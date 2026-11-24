-- Run ONCE in the Supabase SQL editor, after the migrations. Lets PowerSync read changes.
-- 1. Replace CHANGE_ME with a long random password and keep it: you paste it into PowerSync.
--    Do not commit the edited file.
create role powersync_role with replication bypassrls login password 'CHANGE_ME';

grant usage on schema public to powersync_role;
grant select on all tables in schema public to powersync_role;
alter default privileges in schema public grant select on tables to powersync_role;

-- The publication must be named "powersync". Only tables that are synced to phones.
create publication powersync for table
  public.household, public.household_member, public.invite, public.pet, public.task, public.tick,
  public.rest_day, public.streak_day, public.medication, public.health_record, public.vet_contact,
  public.pet_place, public.care_card_link, public.profiles, public.notification_settings,
  public.reminder_pref;
