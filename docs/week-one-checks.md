# Week-one checks

The architecture ([README](architecture/mvp/README.md#week-one-checks-unverified)) lists eight
things it could not verify from documents. Each needs a real device, a real account or a vendor
answer, Checks 1, 3, 4 and 8 passed on an iPhone on 2026-11-28; Android is not built yet. This page says how to check each, and where to record the result.

Status: `todo`, `pass`, `fail`. Fill it in as you go, with the date and what you saw.

| # | Check | How | Status |
|---|---|---|---|
| 1 | Native Apple and Google sign-in with Supabase | Create the Apple and Google credentials, fill `supabase/config.toml` env vars and `apps/mobile/.env.local`, build a dev client, call `signInWithApple` / `signInWithGoogle` from `src/data/auth/signIn.ts` | pass on iOS (2026-11-28, TestFlight build 0.1.0 (1) on an iPhone). Android todo |
| 2 | Apple code exchange and token revocation in `delete-account` | Needs the Edge Function (not written yet) and an Apple key. Do after check 1 | todo |
| 3 | Hermes `Intl` time zones and plural rules | Dev build, open the app, Welcome, "Week-one checks", Run. Both rows must say PASS on an iPhone and an Android phone | pass on iOS (2026-11-28). Android todo |
| 4 | op-sqlite with pnpm on SDK 58 | Same screen, the "op-sqlite + PowerSync open" row. The Android and iOS JS bundles already build in this repo; the native build is not tried | pass on iOS (2026-11-28). Android todo |
| 5 | PowerSync free-plan inactivity | Create the instance, leave it idle past one and two weeks, see if it deactivates and whether an uptime ping counts. Pro is $49 a month if it hurts testers | todo |
| 6 | PostHog person-deletion endpoint | Needs a PostHog EU project. If it can't be automated, delete by hand within 30 days | todo |
| 7 | Better Stack free plan and commercial use | Read the current terms | todo |
| 8 | iOS 64-notification cap | Same screen, "Scheduled notification cap" row. On iOS it should report 64 | pass on iOS (2026-11-28) |

## What the checks screen is

`apps/mobile/app/diagnostics.tsx` runs checks 3, 4 and 8 on the phone and shows PASS or FAIL per
row. It only appears in dev builds.

## What is verified without a device

- The TypeScript domain code (ids, household day with the two DST weekends, due rules, streak
  rules) passes its tests, including the streak fixtures in
  `packages/domain/src/streak/streak-fixtures.json`.
- The SQL migrations apply on Postgres 16 and the smoke tests pass (`scripts/test-db.sh`).
  That run stubs Supabase's own pieces (roles, `auth` schema, `pg_cron`, `pg_net`), so it does
  not prove they work on a real Supabase project.
- Not yet done: running the same streak fixtures against the SQL `streak_recompute`. The
  architecture calls this a week-one deliverable.
