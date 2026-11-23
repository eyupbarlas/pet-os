-- Source: docs/architecture/mvp/backend-sync.md (section 11 sketch). ADRs 0010-0019.
-- auth user → profile + settings (architecture B-5)
create or replace function private.on_auth_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (new.id,
          left(new.raw_user_meta_data->>'display_name', 60),
          coalesce(nullif(new.raw_user_meta_data->>'locale',''), 'pl_PL'))
  on conflict (id) do nothing;
  insert into public.notification_settings (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.on_auth_user_created();

-- household bootstrap (matches mobile C-B3)
create or replace function private.household_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.created_by := (select auth.uid());
  new.owner_id   := (select auth.uid());            -- creator = owner
  new.last_closed_date := null;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    perform private.raise_app('invalid_timezone');
  end if;
  return new;
end $$;
create trigger household_before_insert before insert on public.household
  for each row execute function private.household_before_insert();

-- bootstrap member row is inserted by the client (mobile C-B3); checked here, bypassing RLS
create or replace function private.can_bootstrap(p_household uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.household h
                 where h.id = p_household and h.owner_id = (select auth.uid()))
     and not exists (select 1 from public.household_member m where m.household_id = p_household)
$$;
-- household_member BEFORE INSERT (client path): force left_at=null, joined_at=now()

-- ownership invariants (§8.5)
create or replace function private.next_owner(p_household uuid, p_excluding uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select m.user_id from public.household_member m
  where m.household_id = p_household and m.left_at is null and m.user_id <> p_excluding
  order by m.joined_at, m.id limit 1
$$;
create or replace function private.household_owner_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id is distinct from old.owner_id and not exists (
       select 1 from public.household_member m
       where m.household_id = new.id and m.user_id = new.owner_id and m.left_at is null) then
    perform private.raise_app('owner_must_be_member');
  end if;
  return new;
end $$;
create trigger household_owner_guard before update of owner_id on public.household
  for each row execute function private.household_owner_guard();
create or replace function private.member_owner_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  r := coalesce(old, new);
  if pg_trigger_depth() = 1
     and (tg_op = 'DELETE' or (new.left_at is not null and old.left_at is null))
     and exists (select 1 from public.household h where h.id = r.household_id and h.owner_id = r.user_id) then
    perform private.raise_app('owner_must_transfer');
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger member_owner_guard before update of left_at or delete on public.household_member
  for each row execute function private.member_owner_guard();
-- RPCs that run as SECURITY DEFINER at depth 1 therefore always transfer first:
--   update household set owner_id = private.next_owner(h, uid) ...; then set left_at / delete.
-- (timezone is also validated on UPDATE by a similar trigger)

-- task: seed streak_critical; same-household medication (privacy B1)
create or replace function private.task_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_species text;
begin
  if tg_op = 'INSERT' then
    select species into v_species from public.pet where id = new.pet_id;
    new.streak_critical := (v_species = 'dog' and new.kind in ('meal','med','walk'))
                        or (v_species = 'cat' and new.kind in ('meal','med','water'));
  end if;
  if pg_trigger_depth() = 1                              -- skip during ON UPDATE CASCADE (pet move)
     and new.medication_id is not null and not exists (
       select 1 from public.medication m where m.id = new.medication_id and m.household_id = new.household_id) then
    perform private.raise_app('cross_household_reference');
  end if;
  return new;
end $$;
create trigger task_before_write before insert or update on public.task
  for each row execute function private.task_before_write();

-- tick: insert guard, delete guard, streak recompute
create or replace function private.tick_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_today date;
begin
  if not exists (select 1 from public.task t
                 where t.id = new.task_id and t.pet_id = new.pet_id and t.household_id = new.household_id) then
    perform private.raise_app('cross_household_reference');
  end if;
  v_today := private.today_local(new.household_id);
  if new.local_date < v_today - 2 or new.local_date > v_today + 1 then
    return null;                                         -- silently ignored
  end if;
  new.actor_id    := (select auth.uid());
  new.client_at   := least(new.client_at, now());       -- a tap precedes its upload: no future claims
  new.received_at := now();
  -- duplicate tick (same deterministic id): earliest tap keeps the credit (amended 2026-11-23)
  perform pg_advisory_xact_lock(hashtext(new.id::text));
  if exists (select 1 from public.tick k where k.id = new.id) then
    update public.tick k
       set actor_id = new.actor_id, client_at = new.client_at
     where k.id = new.id and new.client_at < k.client_at;
    return null;                                         -- skip the insert; upload succeeds
  end if;
  return new;
end $$;
create trigger tick_before_insert before insert on public.tick
  for each row execute function private.tick_before_insert();

create or replace function private.tick_before_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- only direct client deletes are guarded; FK cascades (pet/household delete, depth > 1)
  -- and service-role/postgres deletes pass (a suppressed cascade row would make the FK action fail)
  if pg_trigger_depth() = 1 and (select auth.uid()) is not null
     and old.local_date < private.today_local(old.household_id) - 1 then
    return null;                                         -- silently ignored
  end if;
  return old;
end $$;
create trigger tick_before_delete before delete on public.tick
  for each row execute function private.tick_before_delete();

create or replace function private.after_care_change()   -- shared by tick and rest_day
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  r := coalesce(new, old);
  if pg_trigger_depth() = 1                              -- not during cascades
     and r.local_date < private.today_local(r.household_id) then
    perform private.streak_recompute(r.pet_id, r.local_date);
  end if;
  return null;
end $$;
create trigger tick_after_change after insert or delete on public.tick
  for each row execute function private.after_care_change();

-- rest_day: today only (ruling 2), created_by from JWT
create or replace function private.rest_day_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  r := coalesce(new, old);
  if pg_trigger_depth() = 1 and (select auth.uid()) is not null
     and r.local_date <> private.today_local(r.household_id) then
    return null;                                         -- silently ignored
  end if;
  if tg_op = 'INSERT' then new.created_by := (select auth.uid()); return new; end if;
  return old;
end $$;
create trigger rest_day_guard before insert or delete on public.rest_day
  for each row execute function private.rest_day_guard();
create trigger rest_day_after_change after insert or delete on public.rest_day
  for each row execute function private.after_care_change();   -- no-op for today; kept for safety

-- Every guard checks pg_trigger_depth() = 1, so FK cascades (pet move via ON UPDATE CASCADE,
-- pet/household delete) are never suppressed or rejected mid-cascade.
-- reminder_pref: same-household task (privacy B1)
-- care_card_link: created_by := auth.uid() on insert; owner_contacts entries shape-checked and
--                 any user_id must be an active member of household_id
-- updated_at triggers on all tables with updated_at
