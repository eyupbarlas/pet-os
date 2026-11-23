-- Source: docs/architecture/mvp/backend-sync.md (section 11 sketch). ADRs 0010-0019.
-- RLS ON for every table, including server-only ones (privacy B3b)
alter table public.profiles              enable row level security;
alter table public.notification_settings enable row level security;
alter table public.household             enable row level security;
alter table public.household_member      enable row level security;
alter table public.invite                enable row level security;
alter table public.pet                   enable row level security;
alter table public.medication            enable row level security;
alter table public.task                  enable row level security;
alter table public.tick                  enable row level security;
alter table public.rest_day              enable row level security;
alter table public.streak_day            enable row level security;
alter table public.health_record         enable row level security;
alter table public.vet_contact           enable row level security;
alter table public.pet_place             enable row level security;
alter table public.care_card_link        enable row level security;
alter table public.reminder_pref         enable row level security;
alter table public.deletion_followup     enable row level security;   -- no policies: server only
alter table public.app_config            enable row level security;   -- no policies: read via RPC

-- Policy pattern for household-scoped tables (shown for pet)
create policy pet_rw on public.pet for all to authenticated
  using      (household_id in (select private.my_household_ids()))
  with check (household_id in (select private.my_household_ids()));
do $$ declare t text; begin
  foreach t in array array['medication','task','tick','rest_day','health_record','vet_contact','pet_place','care_card_link'] loop
    execute format($f$create policy %I on public.%I for all to authenticated
      using (household_id in (select private.my_household_ids()))
      with check (household_id in (select private.my_household_ids()))$f$, t || '_rw', t);
  end loop;
end $$;
create policy streak_day_select on public.streak_day for select to authenticated
  using (household_id in (select private.my_household_ids()));
-- Same "household_rw" policy on: medication, task, tick, rest_day, health_record,
-- vet_contact, pet_place, care_card_link; select-only policy on streak_day (invite: owner-only, below).
-- Grants below decide which commands are possible at all.

create policy household_select on public.household for select to authenticated
  using (id in (select private.my_household_ids()));
create policy household_insert on public.household for insert to authenticated
  with check (true);                                     -- created_by forced by trigger
create policy household_update on public.household for update to authenticated
  using (owner_id = (select auth.uid()))                 -- owner only (rename, time zone)
  with check (owner_id = (select auth.uid()));
create policy invite_select_owner on public.invite for select to authenticated   -- replaces the member-wide select
  using (household_id in (select h.id from public.household h where h.owner_id = (select auth.uid())));
create policy member_select on public.household_member for select to authenticated
  using (household_id in (select private.my_household_ids()));
create policy member_bootstrap on public.household_member for insert to authenticated
  with check (user_id = (select auth.uid()) and private.can_bootstrap(household_id));
create policy member_update_self on public.household_member for update to authenticated
  using (user_id = (select auth.uid()) and left_at is null)
  with check (user_id = (select auth.uid()));
create policy own_profile on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy own_settings on public.notification_settings for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy own_reminder on public.reminder_pref for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and household_id in (select private.my_household_ids()));

-- Explicit grants (= the upload map in §6.2)
revoke all on all tables in schema public from anon, authenticated;
grant select, insert, update, delete on public.pet, public.medication, public.health_record to authenticated;
grant select, insert on public.task to authenticated;
grant update (title, template_key, amount, time_of_day, every_n_days, anchor_date, ends_on,
              paused, medication_id, sort_order) on public.task to authenticated;   -- no streak_critical, no DELETE (B-3)
grant select, insert, delete on public.tick, public.rest_day to authenticated;      -- no UPDATE
grant select, insert, update on public.pet_place, public.vet_contact, public.reminder_pref to authenticated;
grant select, insert on public.household to authenticated;
grant update (name, timezone) on public.household to authenticated;   -- not owner_id
grant select, insert on public.household_member to authenticated;   -- insert = bootstrap only (policy)
grant update (display_name) on public.household_member to authenticated;
grant select on public.invite, public.streak_day, public.care_card_link to authenticated;
grant update (owner_contacts, note, lang, show_vet) on public.care_card_link to authenticated;
grant select, update on public.profiles, public.notification_settings to authenticated;
-- deletion_followup, app_config: no grants

revoke execute on all functions in schema public, private from public, anon, authenticated;
grant execute on function private.my_household_ids(), private.can_bootstrap(uuid) to authenticated;
grant execute on function public.get_care_card(text), public.health(), public.get_app_config(),
  public.record_invite_landing(text) to anon, authenticated;
grant execute on function
  public.create_invite(uuid), public.revoke_invite(uuid), public.preview_invite(text),
  public.accept_invite(text, text, boolean), public.remove_member(uuid),
  public.leave_household(uuid), public.transfer_ownership(uuid, uuid), public.delete_household(uuid),
  public.create_care_card_link(uuid, text), public.rotate_care_card_link(uuid),
  public.revoke_care_card_link(uuid)
  to authenticated;
-- private.delete_user_data(uuid), private.admin_delete_user(uuid): postgres / service_role only
