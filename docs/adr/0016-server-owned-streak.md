# 0016 — Streak computed in SQL on the server, provisional on the phone

- **Status:** proposed
- **Date:** 2026-11-22
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (need 6; acceptance on paw passes, DST), ADR 0014, ADR 0015, design §5

## Context

A day counts when every streak-critical task (a per-task flag; dog: meals, meds, walks; cat:
meals, meds, fresh water) is ticked. There are 2 automatic paw passes a month, rest days (today only,
no monthly limit; ruling 2), and the third miss resets. Ticks can arrive late from offline phones. The phone must show progress
offline. There must be one owner of the verdict, and it must be idempotent.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. Client-only: every device derives the streak from synced data | No server code | No frozen history (editing a task rewrites the past); each device may hold a different config snapshot; no server source for G3 metrics | $0 | Low |
| B. Server SQL (PL/pgSQL) writes `streak_day` rows: pg_cron close every 15 min plus a recompute on late ticks or undos; the phone mirrors the rules in TS for every unclosed day; shared fixtures | One authoritative, idempotent owner; frozen closed days; small and transactional | The same rules in two languages (kept in step by the fixtures) | $0 | Low |
| C. Server in a TS Edge Function sharing code with the app | One language | pg_net plus webhooks for each trigger and cron; a second runtime; no transaction with the tick insert | $0 | Medium |

## Decision

Option B. `streak_recompute(pet, from_date)` walks the closed days and upserts `streak_day(outcome,
streak_after, passes_used_in_month)` under an advisory lock per pet. A late tick insert or delete (ADR 0014: one row per task-day, so "done" means the row exists)
for a day before today triggers a recompute. Rest days can be set or cleared only for `today_local`,
which is enforced by a trigger. A rest day therefore can't turn yesterday's miss into a rest day,
and the 2-pass limit keeps its meaning. A rest day bridges the streak but doesn't extend it. The
phone computes `provisionalStreak(latestStreakDay, openDays[])` over **every** day the server
hasn't closed yet, with the same rules. Any reversal is silent.

## Consequences

- Easier: correct after late syncs; G3 aggregates from `streak_day` (subject to privacy review).
- Harder: keep `packages/domain/streak` and the SQL function in step. CI runs
  `streak-fixtures.json` against both. This is a week-1 deliverable, covering DST, month boundary,
  third miss, rest today, a rejected rest-yesterday, a late tick, a late undo and several days open
  offline.
- Privacy: the G3 aggregates come from `streak_day` through unexposed `analytics` views (ruling 9),
  so the client streak events go away.
- Revisit if: the rules grow complex enough that one shared TS implementation (option C) is worth
  the extra runtime.
