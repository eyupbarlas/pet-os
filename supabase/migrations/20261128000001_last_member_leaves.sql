-- Slice 2 (issue #24) fix: the last member of a household could not leave, because the owner
-- guard requires a transfer first and there was nobody to transfer to. Now the household is
-- deleted instead, as ADR 0019 says ("if nobody remains, the household is deleted").
set check_function_bodies = off;

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
    else
      -- last member out: the owner cannot hand over, so the household goes (ADR 0019)
      delete from public.household where id = p_household;
      return jsonb_build_object('household_deleted', true, 'new_owner_member_id', null,
                                'open_invites_revoked', 0, 'care_cards', 0);
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
