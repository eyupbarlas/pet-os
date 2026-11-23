-- Source: docs/architecture/mvp/backend-sync.md (section 11 sketch). ADRs 0010-0019.
create or replace function private.day_outcome(p_pet uuid, d date)
returns text language sql stable security definer set search_path = '' as $$
  with due as (
    select t.id as task_id
    from public.task t
    where t.pet_id = p_pet and t.streak_critical and not t.paused
      and t.anchor_date <= d and (t.ends_on is null or t.ends_on >= d)
      and (d - t.anchor_date) % t.every_n_days = 0
  ), agg as (
    select count(*) as due_n,
           count(*) filter (where exists (
             select 1 from public.tick k
             where k.task_id = due.task_id and k.local_date = d and k.slot = 0)) as done_n
    from due
  )
  select case
    when a.due_n = 0 then 'neutral'
    when a.done_n = a.due_n then 'complete'
    when exists (select 1 from public.rest_day r where r.pet_id = p_pet and r.local_date = d) then 'rest'
    when d = (select (p.created_at at time zone h.timezone)::date
              from public.pet p join public.household h on h.id = p.household_id where p.id = p_pet)
      then 'neutral'
    else 'missed' end
  from agg a
$$;

create or replace function private.streak_recompute(p_pet uuid, p_from date)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_hh uuid; v_tz text; v_today date; v_start date; d date;
  v_len int := 0; v_passes smallint := 0; v_out text; v_prev record;
begin
  perform pg_advisory_xact_lock(hashtext(p_pet::text));
  select p.household_id, h.timezone, (p.created_at at time zone h.timezone)::date
    into v_hh, v_tz, v_start
    from public.pet p join public.household h on h.id = p.household_id where p.id = p_pet;
  if v_hh is null then return; end if;
  v_today := (now() at time zone v_tz)::date;
  d := greatest(p_from, v_start);

  select streak_after, passes_used_in_month, local_date into v_prev
    from public.streak_day where pet_id = p_pet and local_date = d - 1;
  if found then
    v_len := v_prev.streak_after;
    v_passes := case when date_trunc('month', d) = date_trunc('month', v_prev.local_date)
                     then v_prev.passes_used_in_month else 0 end;
  end if;

  while d < v_today loop
    if extract(day from d) = 1 then v_passes := 0; end if;
    v_out := private.day_outcome(p_pet, d);
    if v_out = 'complete' then v_len := v_len + 1;
    elsif v_out = 'missed' then
      if v_passes < 2 then v_out := 'paw_pass'; v_passes := v_passes + 1;
      else v_len := 0; end if;
    end if;
    insert into public.streak_day (household_id, pet_id, local_date, outcome, streak_after, passes_used_in_month)
    values (v_hh, p_pet, d, v_out, v_len, v_passes)
    on conflict (pet_id, local_date) do update
      set outcome = excluded.outcome, streak_after = excluded.streak_after,
          passes_used_in_month = excluded.passes_used_in_month, computed_at = now();
    d := d + 1;
  end loop;
end $$;

create or replace function private.streak_close_due_days()
returns void language plpgsql security definer set search_path = '' as $$
declare h record; p record; v_yday date;
begin
  for h in select id, timezone, last_closed_date from public.household loop
    v_yday := (now() at time zone h.timezone)::date - 1;
    continue when h.last_closed_date is not null and h.last_closed_date >= v_yday;
    for p in select id from public.pet where household_id = h.id loop
      perform private.streak_recompute(p.id, coalesce(h.last_closed_date + 1, v_yday));
    end loop;
    update public.household set last_closed_date = v_yday where id = h.id;
  end loop;
end $$;

select cron.schedule('streak-close', '*/15 * * * *', 'select private.streak_close_due_days()');
select cron.schedule('deletion-followups', '10 3 * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'deletion_followup_url'),
    headers := jsonb_build_object('x-cron-secret',
                 (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body    := '{}'::jsonb)
$$);
