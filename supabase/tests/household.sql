-- Slice 2 (issue #24): invites, owner controls, leaving, removal, and the two-phone tick rule.
-- Run against a fresh local database after the migrations (scripts/test-db.sh does this).
begin;
insert into auth.users (id) values
  ('00000000-0000-0000-0000-0000000000a1'),   -- Ana, owner of H1
  ('00000000-0000-0000-0000-0000000000b1'),   -- Tomek, has his own household H2 with a cat
  ('00000000-0000-0000-0000-0000000000c1');   -- Ola, brand-new user

create temp table t_out(k text, v text);
grant all on t_out to public;

set local role authenticated;
-- Ana: household H1 with a dog and one task
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
insert into public.household (id, name) values ('11000000-0000-0000-0000-000000000001', 'Ana home');
insert into public.household_member (household_id, user_id, display_name)
  values ('11000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-0000000000a1', 'Ana');
insert into public.pet (id, household_id, name, species)
  values ('21000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'Burek', 'dog');
insert into public.task (id, household_id, pet_id, kind, template_key, anchor_date)
  values ('31000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001',
          '21000000-0000-0000-0000-000000000001', 'meal', 'breakfast', current_date);
insert into t_out select 'inv1', (public.create_invite('11000000-0000-0000-0000-000000000001'))->>'token';
insert into t_out select 'inv2', (public.create_invite('11000000-0000-0000-0000-000000000001'))->>'token';

-- Tomek: his own household H2 with a cat, on his own
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
insert into public.household (id, name) values ('12000000-0000-0000-0000-000000000002', 'Tomek flat');
insert into public.household_member (household_id, user_id, display_name)
  values ('12000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-0000000000b1', 'Tomek');
insert into public.pet (id, household_id, name, species)
  values ('22000000-0000-0000-0000-000000000002', '12000000-0000-0000-0000-000000000002', 'Mruczek', 'cat');

-- existing user joins: the preview says his cat comes along, then it does
do $$ declare p jsonb; begin
  p := public.preview_invite((select v from t_out where k = 'inv1'));
  assert p->>'status' = 'ok', 'preview ok';
  assert p->>'inviter_name' = 'Ana', 'inviter name';
  assert p->'my_current'->>'outcome' = 'pets_come_along', 'sole member: pets come along';
  perform public.accept_invite((select v from t_out where k = 'inv1'), 'Tomek', false);
  assert (select count(*) from public.pet) = 2, 'Tomek sees Burek and Mruczek';
  assert (select household_id from public.pet where name = 'Mruczek') = '11000000-0000-0000-0000-000000000001', 'cat moved';
  assert not exists (select 1 from public.household where id = '12000000-0000-0000-0000-000000000002'), 'old household gone';
  assert (public.preview_invite((select v from t_out where k = 'inv1')))->>'status' = 'invite_used', 'used';
  -- a member is not the owner
  begin perform public.create_invite('11000000-0000-0000-0000-000000000001'); raise exception 'member invited';
  exception when sqlstate 'P0001' then null; end;
  begin perform public.remove_member((select id from public.household_member where display_name = 'Ana'));
    raise exception 'member removed the owner';
  exception when sqlstate 'P0001' then null; end;
  -- a member's rename touches no row (RLS: owner only)
  update public.household set name = 'Hacked' where id = '11000000-0000-0000-0000-000000000001';
  assert (select name from public.household) = 'Ana home', 'member cannot rename';
end $$;

-- brand-new user joins with the second link
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
do $$ declare p jsonb; begin
  p := public.preview_invite((select v from t_out where k = 'inv2'));
  assert p->>'status' = 'ok' and p->'my_current' = 'null'::jsonb, 'new user has no household';
  assert jsonb_array_length(p->'member_names') = 2, 'preview lists both members';
  perform public.accept_invite((select v from t_out where k = 'inv2'), 'Ola', false);
  assert (select count(*) from public.household_member where left_at is null) = 3, 'three members';
end $$;

-- two phones offline tick the same task: one row, credit to the earliest tap
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
insert into public.tick (id, household_id, pet_id, task_id, local_date, client_at)
  values ('41000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001',
          '21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001',
          (now() at time zone 'Europe/Warsaw')::date, now() - interval '5 minutes')
  on conflict (id) do nothing;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
insert into public.tick (id, household_id, pet_id, task_id, local_date, client_at)
  values ('41000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001',
          '21000000-0000-0000-0000-000000000001', '31000000-0000-0000-0000-000000000001',
          (now() at time zone 'Europe/Warsaw')::date, now() - interval '20 minutes')
  on conflict (id) do nothing;
do $$ begin
  assert (select count(*) from public.tick) = 1, 'one tick row';
  assert (select actor_id from public.tick) = '00000000-0000-0000-0000-0000000000b1', 'earliest tap (Tomek) keeps credit';
end $$;

-- owner removes Ola: open invites revoked, Ola loses access at once
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
insert into t_out select 'inv3', (public.create_invite('11000000-0000-0000-0000-000000000001'))->>'token';
do $$ declare r jsonb; begin
  begin perform public.remove_member((select id from public.household_member where display_name = 'Ana'));
    raise exception 'owner removed self';
  exception when sqlstate 'P0001' then assert sqlerrm = 'cannot_remove_self', sqlerrm; end;
  r := public.remove_member((select id from public.household_member where display_name = 'Ola'));
  assert (r->>'open_invites_revoked')::int = 1, 'open invite revoked';
  assert (r->>'household_deleted')::boolean = false, 'household stays';
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000c1', true);
do $$ begin
  assert (select count(*) from public.pet) = 0, 'removed member sees no pets';
  assert (select count(*) from public.tick) = 0, 'removed member sees no ticks';
  assert (public.preview_invite((select v from t_out where k = 'inv3')))->>'status' = 'invite_revoked', 'revoked';
end $$;

-- owner renames, then hands over to Tomek; Ana is now a plain member
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000a1', true);
update public.household set name = 'Our home' where id = '11000000-0000-0000-0000-000000000001';
do $$ begin
  assert (select name from public.household) = 'Our home', 'owner renames';
  perform public.transfer_ownership('11000000-0000-0000-0000-000000000001',
    (select id from public.household_member where display_name = 'Tomek'));
  assert (select owner_id from public.household) = '00000000-0000-0000-0000-0000000000b1', 'transferred';
  begin perform public.delete_household('11000000-0000-0000-0000-000000000001'); raise exception 'member deleted';
  exception when sqlstate 'P0001' then assert sqlerrm = 'not_owner', sqlerrm; end;
  -- Ana leaves; pets stay with the household
  perform public.leave_household('11000000-0000-0000-0000-000000000001');
  assert (select count(*) from public.pet) = 0, 'Ana sees nothing after leaving';
end $$;
select set_config('request.jwt.claim.sub', '00000000-0000-0000-0000-0000000000b1', true);
do $$ begin
  assert (select count(*) from public.pet) = 2, 'pets stay with the household';
  -- the last member leaving deletes the household
  perform public.leave_household('11000000-0000-0000-0000-000000000001');
end $$;
reset role;
do $$ begin
  assert not exists (select 1 from public.household where id = '11000000-0000-0000-0000-000000000001'), 'last one out deletes';
end $$;
rollback;
select 'household ok' as result;
