# 0020 — Reminders and streak nudges are local notifications planned on the device

- **Status:** proposed
- **Date:** 2026-11-22 (revised after reviews 03 and rulings 04)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (needs 5, 6, 7, 12), issue #5, design `docs/architecture/mvp/platform-services.md` §3

## Context

Spec need 7 says each member turns reminders on per task, controls their own quiet time, and
gets at most one streak nudge a day. Need 6 defines the day as the household's local calendar
day, and acceptance requires correct behaviour over the DST weekend. Members are often offline
(walks, lifts, cellars). The streak-critical set is dog meals + meds + walks and cat meals +
meds + fresh water (Eyup, answer 6). Constraints: 1–3 builders, ≤100 users, no server work that
isn't needed, EN/PL text from `en_US.json` / `pl_PL.json`. Android 14+ denies exact alarms by
default, so local notifications arrive at an approximate time
([expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/), 2026-11-22).

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. Local one-shot notifications from a pure on-device planner (task times in the household tz, quiet time in the device tz, rolling window ≤7 days / ≤56 items, deterministic IDs) | Works offline; no server or cron; each member's prefs and quiet time live where they apply; text in the app language; testable as a pure function with DST fixtures | Can fire after another member already ticked, if the phone hasn't synced (mitigated by "check Today" copy; ADR 0021's push is a planned follow-up); window empties if the app isn't opened for a week; iOS 64-pending limit (Apple, **unverified** this session) | $0 / $0 | Low (expo-notifications; the planner is our code) |
| B. Server-sent reminders (pg_cron every minute → Expo push) | Knows tick state, so no reminder for an already-done task | Fails offline, exactly when a member's own reminder matters; needs cron, server tz logic, server-rendered EN/PL text, per-member prefs on server; Expo/APNs outage = no reminders | Supabase cron included / grows with users × tasks | Medium |
| C. Repeating DAILY local triggers | Simplest code | Can't skip one day's occurrence when ticked, can't express every-N-days, quiet-time shifts or household tz ≠ device tz | $0 | Low |

## Decision

Option A: reminders and the daily streak nudge are local one-shot (DATE-trigger) notifications,
planned on the device and re-planned on every relevant change. Task times and the day boundary
follow the household's time zone; quiet time follows the device's current zone, because it is
about the person's sleep. An occurrence is done when its `tick` row exists (one row per task per
household day, `slot = 0`; ruling 1). The planner honours `ends_on`. A rest day counts as
complete for the nudge. The nudge has one deterministic ID per household day, which enforces
"at most one", and it is offered after the member's first completed day.

## Consequences

- Easier: offline reliability, zero server cost, privacy (names stay on device).
- Harder: a reminder can lag a partner's tick. Copy says "check Today", and there is no
  "Mark done" action on the notification. If testers report this often, ADR 0021's follow-up
  push reduces it.
- Follow-up: mobile builds `planNotifications` / `applyPlan` in `packages/domain`, with fixtures
  for the last weekends of March and October in Europe/Warsaw, a travelling member (quiet time
  in the device zone) and a rest day. Backend syncs `household.timezone`, `task` (including
  `ends_on` and the read-only `streak_critical`), `tick`, `rest_day`, `reminder_pref` and
  `notification_settings` (contracts M1, M2, B1). Templates carry default remind times for
  "any time" tasks.
- Revisit if beta users report reminders for already-done tasks often enough to matter (then
  build ADR 0021), or if they want task times in their own local time zone.
