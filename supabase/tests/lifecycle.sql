-- Smoke test of the household lifecycle. Run against a fresh local database:
--   psql -v ON_ERROR_STOP=1 -f supabase/tests/lifecycle.sql
-- Uses request.jwt.claim.sub to act as a user (works with Supabase's auth.uid()).
begin;
insert into auth.users (id) values ('00000000-0000-0000-0000-00000000000a'), ('00000000-0000-0000-0000-00000000000b');

set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
insert into public.household (id, name) values ('10000000-0000-0000-0000-000000000001', 'Kowalski home');
insert into public.household_member (household_id, user_id, display_name)
  values ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-00000000000a', 'Ana');
insert into public.pet (id, household_id, name, species)
  values ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Burek', 'dog');
insert into public.task (id, household_id, pet_id, kind, template_key, anchor_date)
  values ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
          '20000000-0000-0000-0000-000000000001', 'meal', 'breakfast', current_date);
insert into public.tick (id, household_id, pet_id, task_id, local_date, client_at)
  values ('40000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001',
          '20000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001',
          (now() at time zone 'Europe/Warsaw')::date, now());

-- care card works anonymously and shows only "marked done"
create temp table t_out(k text, v text);
grant all on t_out to public;
insert into t_out select 'invite', (public.create_invite('10000000-0000-0000-0000-000000000001'))->>'token';
insert into t_out select 'card', (public.create_care_card_link('20000000-0000-0000-0000-000000000001', 'en_US'))->>'token';

set local role anon;
do $$ declare c jsonb; begin
  c := public.get_care_card((select v from t_out where k = 'card'));
  assert c is not null and c->'today'->0->>'marked_done' = 'true', 'care card shows done tick';
  assert public.get_care_card(repeat('x', 43)) is null, 'unknown token returns null';
  assert (public.record_invite_landing((select v from t_out where k = 'invite')))->>'open' = 'true', 'landing';
  begin perform 1 from public.pet; raise exception 'anon read pet'; exception when insufficient_privilege then null; end;
end $$;

-- partner joins
set local role authenticated;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
do $$ declare p jsonb; begin
  p := public.preview_invite((select v from t_out where k = 'invite'));
  assert p->>'status' = 'ok' and p->>'household_name' = 'Kowalski home', 'preview';
  perform public.accept_invite((select v from t_out where k = 'invite'), 'Tomek', false);
  assert (select count(*) from public.pet) = 1, 'partner sees the pet';
  assert (select count(*) from public.tick) = 1, 'partner sees the tick';
  begin perform public.create_invite('10000000-0000-0000-0000-000000000001'); raise exception 'member invited';
  exception when sqlstate 'P0001' then assert sqlstate = 'P0001'; end;
end $$;

-- owner leaves: ownership passes to Tomek; invite already used
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000a', true);
do $$ begin
  perform public.leave_household('10000000-0000-0000-0000-000000000001');
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-00000000000b', true);
do $$ begin
  assert (select owner_id from public.household) = '00000000-0000-0000-0000-00000000000b', 'ownership passed';
  perform public.delete_household('10000000-0000-0000-0000-000000000001');
  assert (select count(*) from public.pet) = 0, 'household delete cascades';
end $$;
rollback;
select 'lifecycle ok' as result;
