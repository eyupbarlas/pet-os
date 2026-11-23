-- Source: docs/architecture/mvp/backend-sync.md (section 11 sketch). ADRs 0010-0019.
create view analytics.g1_invites as          -- G1 primary: invite created within 7 days; secondary: accepted
select date_trunc('week', h.created_at) as cohort_week,
       count(*) as households,
       count(*) filter (where exists (select 1 from public.invite i
         where i.household_id = h.id and i.created_at < h.created_at + interval '7 days')) as invited_7d,
       count(*) filter (where exists (select 1 from public.household_member m
         where m.household_id = h.id and m.user_id is distinct from h.created_by
           and m.joined_at < h.created_at + interval '7 days')) as partner_joined_7d
from public.household h
where h.created_at < now() - interval '7 days'
group by 1;

create view analytics.tick_activity as       -- G1: ticks per active pet per day, % by non-creators
select k.local_date,
       count(distinct k.pet_id) as active_pets,
       count(*) as ticks,
       count(*) filter (where k.actor_id is distinct from h.created_by) as ticks_by_non_creator
from public.tick k join public.household h on h.id = k.household_id
group by 1;

create view analytics.g3_streaks as          -- G3: share of active pets reaching a 7-day streak, per week
select date_trunc('week', s.local_date) as week,
       count(distinct s.pet_id) as pets_with_closed_days,
       count(distinct s.pet_id) filter (where s.streak_after >= 7) as pets_streak_7,
       count(*) filter (where s.outcome = 'paw_pass') as paw_passes,
       count(*) filter (where s.outcome = 'rest') as rest_days,
       count(*) filter (where s.outcome = 'missed' and s.streak_after = 0) as resets
from public.streak_day s
group by 1;

create view analytics.g1_invite_funnel as    -- invite created → landing opened → accepted
select date_trunc('week', i.created_at) as week,
       count(*) as invites,
       count(*) filter (where i.landing_view_count > 0) as landing_opened,
       count(*) filter (where i.accepted_at is not null) as accepted
from public.invite i group by 1;

-- D30 "active" signal (platform open question 2), defined by backend:
-- a member is ACTIVE on household day d if they are the actor of >= 1 tick with local_date = d.
-- D30 retained = active on at least one day in days 28-32 after joined_at (household dates).
-- No app-open "check-in" is recorded server-side in the MVP (data minimisation); app-open
-- retention for consented users comes from PostHog lifecycle events and is reported separately.
create view analytics.d30_retention as
select date_trunc('week', m.joined_at) as join_week,
       count(*) as members,
       count(*) filter (where exists (
         select 1 from public.tick k join public.household h on h.id = k.household_id
         where k.actor_id = m.user_id and k.household_id = m.household_id
           and k.local_date between (m.joined_at at time zone h.timezone)::date + 28
                                and (m.joined_at at time zone h.timezone)::date + 32)) as retained_d30
from public.household_member m
where m.joined_at < now() - interval '33 days'
group by 1;

create view analytics.g2_cards as            -- G2 early signal
select count(*) as cards, count(*) filter (where revoked_at is null) as active,
       count(*) filter (where view_count > 0) as opened, sum(view_count) as views
from public.care_card_link;
