-- Public RPCs: household lifecycle, invites, care card, app config.
-- Source: docs/architecture/mvp/backend-sync.md sections 8 and 9. Grants are in the next migration.
set check_function_bodies = off;

create or replace function public.health() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('ok', true)
$$;

create or replace function public.get_app_config() returns jsonb
language sql stable security definer set search_path = '' as $$
  select coalesce((select to_jsonb(c) - 'id' from public.app_config c limit 1),
                  jsonb_build_object('min_supported_version','0.0.0','push_sync_enabled',false))
$$;

-- owner check helper
create or replace function private.assert_owner(p_household uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.household h
                 where h.id = p_household and h.owner_id = (select auth.uid())) then
    perform private.raise_app('not_owner');
  end if;
end $$;

-- invites ---------------------------------------------------------------------
create or replace function public.create_invite(p_household_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.invite;
begin
  perform private.assert_owner(p_household_id);
  insert into public.invite (household_id, created_by) values (p_household_id, (select auth.uid()))
  returning * into v;
  return jsonb_build_object('token', v.token, 'expires_at', v.expires_at);
end $$;

create or replace function public.revoke_invite(p_invite_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare h uuid;
begin
  select household_id into h from public.invite where id = p_invite_id;
  if h is null then perform private.raise_app('invite_not_found'); end if;
  perform private.assert_owner(h);
  update public.invite set revoked_at = now() where id = p_invite_id and revoked_at is null;
end $$;

create or replace function private.invite_status(i public.invite) returns text
language sql stable set search_path = '' as $$
  select case when i.id is null then 'invite_not_found'
              when i.revoked_at is not null then 'invite_revoked'
              when i.accepted_at is not null then 'invite_used'
              when i.expires_at <= now() then 'invite_expired'
              else 'ok' end
$$;

create or replace function public.record_invite_landing(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare v public.invite;
begin
  select * into v from public.invite where token = p_token;
  if v.id is null or private.invite_status(v) <> 'ok' then return jsonb_build_object('open', false); end if;
  update public.invite set landing_view_count = landing_view_count + 1 where id = v.id;
  return jsonb_build_object('open', true);
end $$;

create or replace function public.preview_invite(p_token text) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v public.invite; uid uuid := (select auth.uid()); st text;
  cur uuid; hname text; mine jsonb := null; others text[]; pets jsonb; nown text;
begin
  select * into v from public.invite where token = p_token;
  st := private.invite_status(v);
  if st <> 'ok' then return jsonb_build_object('status', st); end if;
  if exists (select 1 from public.household_member m
             where m.household_id = v.household_id and m.user_id = uid and m.left_at is null) then
    return jsonb_build_object('status', 'already_member');
  end if;

  select m.household_id into cur from public.household_member m
   where m.user_id = uid and m.left_at is null limit 1;
  if cur is not null then
    select coalesce(array_agg(m.display_name order by m.joined_at), '{}') into others
      from public.household_member m where m.household_id = cur and m.left_at is null and m.user_id <> uid;
    select coalesce(jsonb_agg(jsonb_build_object('id', p.id, 'name', p.name, 'species', p.species)
                              order by p.sort_order), '[]') into pets
      from public.pet p where p.household_id = cur;
    select m.display_name into nown from public.household h
      join public.household_member m on m.user_id = private.next_owner(h.id, uid) and m.household_id = h.id
      where h.id = cur and h.owner_id = uid and cardinality(others) > 0;
    mine := jsonb_build_object(
      'household_name', (select name from public.household where id = cur),
      'other_member_names', to_jsonb(others), 'pets', pets,
      'outcome', case when cardinality(others) = 0 then 'pets_come_along' else 'leave_pets_stay' end,
      'new_owner_name', to_jsonb(nown));
  end if;

  return jsonb_build_object(
    'status', 'ok',
    'household_name', (select name from public.household where id = v.household_id),
    'inviter_name', (select m.display_name from public.household_member m
                     where m.household_id = v.household_id and m.user_id = v.created_by),
    'member_names', (select coalesce(jsonb_agg(m.display_name order by m.joined_at), '[]')
                     from public.household_member m where m.household_id = v.household_id and m.left_at is null),
    'pet_names', (select coalesce(jsonb_agg(p.name order by p.sort_order), '[]')
                  from public.pet p where p.household_id = v.household_id),
    'full', (select count(*) >= 6 from public.household_member m
             where m.household_id = v.household_id and m.left_at is null),
    'my_current', to_jsonb(mine));
end $$;

-- leave / remove / transfer / delete -------------------------------------------
-- Shared by leave_household, remove_member, accept_invite. Returns the result object.
create or replace function private.leave_internal(p_household uuid, p_user uuid, p_removed_by uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare nxt uuid; revoked int; cards int; deleted boolean := false; new_owner_member uuid;
begin
  if exists (select 1 from public.household h where h.id = p_household and h.owner_id = p_user) then
    nxt := private.next_owner(p_household, p_user);
    if nxt is not null then
      update public.household set owner_id = nxt where id = p_household;
      select id into new_owner_member from public.household_member
       where household_id = p_household and user_id = nxt;
    end if;
  end if;

  update public.household_member set left_at = now(), removed_by = p_removed_by
   where household_id = p_household and user_id = p_user and left_at is null;

  update public.invite set revoked_at = now()
   where household_id = p_household and revoked_at is null and accepted_at is null;
  get diagnostics revoked = row_count;

  update public.care_card_link c
     set owner_contacts = coalesce((select jsonb_agg(e) from jsonb_array_elements(c.owner_contacts) e
                                    where e->>'user_id' is distinct from p_user::text), '[]')
   where c.household_id = p_household;
  select count(*) into cards from public.care_card_link where household_id = p_household and revoked_at is null;

  if not exists (select 1 from public.household_member where household_id = p_household and left_at is null) then
    delete from public.household where id = p_household;
    deleted := true;
  end if;
  return jsonb_build_object('household_deleted', deleted, 'new_owner_member_id', new_owner_member,
                            'open_invites_revoked', revoked, 'care_cards', cards);
end $$;

create or replace function public.leave_household(p_household_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare uid uuid := (select auth.uid());
begin
  if not exists (select 1 from public.household_member where household_id = p_household_id
                 and user_id = uid and left_at is null) then
    perform private.raise_app('not_a_member');
  end if;
  return private.leave_internal(p_household_id, uid, null);
end $$;

create or replace function public.remove_member(p_member_id uuid) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare m public.household_member; uid uuid := (select auth.uid());
begin
  select * into m from public.household_member where id = p_member_id and left_at is null;
  if m.id is null then perform private.raise_app('member_not_found'); end if;
  perform private.assert_owner(m.household_id);
  if m.user_id = uid then perform private.raise_app('cannot_remove_self'); end if;
  return private.leave_internal(m.household_id, m.user_id, uid);
end $$;

create or replace function public.transfer_ownership(p_household_id uuid, p_member_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare target uuid;
begin
  perform private.assert_owner(p_household_id);
  select user_id into target from public.household_member
   where id = p_member_id and household_id = p_household_id and left_at is null;
  if target is null then perform private.raise_app('member_not_found'); end if;
  update public.household set owner_id = target where id = p_household_id;
end $$;

create or replace function public.delete_household(p_household_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  perform private.assert_owner(p_household_id);
  delete from public.household where id = p_household_id;
end $$;

create or replace function public.accept_invite(p_token text, p_display_name text, p_confirm_leave boolean)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v public.invite; uid uuid := (select auth.uid()); cur uuid; others int; st text;
begin
  if uid is null then perform private.raise_app('not_authenticated'); end if;
  select * into v from public.invite where token = p_token for update;
  st := private.invite_status(v);
  if st <> 'ok' then perform private.raise_app(st); end if;
  if (select count(*) from public.household_member
      where household_id = v.household_id and left_at is null) >= 6 then
    perform private.raise_app('household_full');
  end if;
  if exists (select 1 from public.household_member
             where household_id = v.household_id and user_id = uid and left_at is null) then
    perform private.raise_app('already_member');
  end if;

  select household_id into cur from public.household_member
   where user_id = uid and left_at is null limit 1;
  if cur is not null then
    select count(*) into others from public.household_member
     where household_id = cur and left_at is null and user_id <> uid;
    if others = 0 then
      -- sole member: pets come along (composite FKs cascade to tasks, ticks, cards, ...)
      update public.pet set household_id = v.household_id where household_id = cur;
      update public.vet_contact set id = v.household_id, household_id = v.household_id
       where household_id = cur
         and not exists (select 1 from public.vet_contact where household_id = v.household_id);
      delete from public.household where id = cur;
    else
      if p_confirm_leave is not true then perform private.raise_app('confirm_leave_required'); end if;
      perform private.leave_internal(cur, uid, null);
    end if;
  end if;

  insert into public.household_member (household_id, user_id, display_name)
  values (v.household_id, uid, left(p_display_name, 60))
  on conflict (household_id, user_id)
  do update set left_at = null, removed_by = null, joined_at = now(), display_name = excluded.display_name;
  update public.invite set accepted_by = uid, accepted_at = now() where id = v.id;
  return jsonb_build_object('household_id', v.household_id);
end $$;

-- care card ----------------------------------------------------------------------
create or replace function private.assert_member(p_household uuid) returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.household_member where household_id = p_household
                 and user_id = (select auth.uid()) and left_at is null) then
    perform private.raise_app('not_a_member');
  end if;
end $$;

create or replace function public.create_care_card_link(p_pet_id uuid, p_lang text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare hh uuid; v public.care_card_link;
begin
  select household_id into hh from public.pet where id = p_pet_id;
  if hh is null then perform private.raise_app('pet_not_found'); end if;
  perform private.assert_member(hh);
  insert into public.care_card_link (household_id, pet_id, lang, created_by)
  values (hh, p_pet_id, coalesce(p_lang, 'pl_PL'), (select auth.uid())) returning * into v;
  return jsonb_build_object('id', v.id, 'token', v.token);
end $$;

create or replace function public.rotate_care_card_link(p_id uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare hh uuid; t text := private.new_token();
begin
  select household_id into hh from public.care_card_link where id = p_id;
  if hh is null then perform private.raise_app('card_not_found'); end if;
  perform private.assert_member(hh);
  update public.care_card_link set token = t, revoked_at = null, updated_at = now() where id = p_id;
  return t;
end $$;

create or replace function public.revoke_care_card_link(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare hh uuid;
begin
  select household_id into hh from public.care_card_link where id = p_id;
  if hh is null then perform private.raise_app('card_not_found'); end if;
  perform private.assert_member(hh);
  update public.care_card_link set revoked_at = now(), updated_at = now() where id = p_id;
end $$;

create or replace function public.get_care_card(p_token text) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare c public.care_card_link; p public.pet; today date; res jsonb;
begin
  if p_token is null or length(p_token) <> 43 then return null; end if;
  select * into c from public.care_card_link
   where token = p_token and revoked_at is null and (expires_at is null or expires_at > now());
  if c.id is null then return null; end if;
  select * into p from public.pet where id = c.pet_id and household_id = c.household_id;
  if p.id is null then return null; end if;
  today := private.today_local(c.household_id);

  update public.care_card_link set view_count = view_count + 1, last_viewed_at = now() where id = c.id;

  res := jsonb_build_object(
    'lang', c.lang, 'household_today', today,
    'pet', jsonb_strip_nulls(jsonb_build_object(
      'name', p.name, 'species', p.species, 'breed', p.breed,
      'age_years', case when p.birth_date is null then null else extract(year from age(today, p.birth_date)) end,
      'weight_kg', p.weight_kg, 'care_notes', p.care_notes)),
    'today', (select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                'template_key', t.template_key, 'title', t.title, 'kind', t.kind,
                'time_of_day', t.time_of_day, 'amount', t.amount,
                'marked_done', exists (select 1 from public.tick k where k.task_id = t.id and k.local_date = today)))
                order by t.sort_order), '[]')
              from public.task t
              where t.pet_id = p.id and not t.paused and (t.ends_on is null or t.ends_on >= today)),
    'meds', (select coalesce(jsonb_agg(jsonb_strip_nulls(jsonb_build_object(
                'name', m.name, 'dose', m.dose, 'notes', m.notes)) order by m.name), '[]')
             from public.medication m
             where m.pet_id = p.id and m.starts_on <= today and (m.ends_on is null or m.ends_on >= today)),
    'owner_contacts', (select coalesce(jsonb_agg(e - 'user_id'), '[]')
                       from jsonb_array_elements(c.owner_contacts) e),
    'note', c.note);
  if c.show_vet then
    res := res || jsonb_build_object('vet', (select jsonb_strip_nulls(jsonb_build_object(
             'name', v.name, 'phone', v.phone, 'address', v.address))
             from public.vet_contact v where v.household_id = c.household_id));
  end if;
  return res;
end $$;
