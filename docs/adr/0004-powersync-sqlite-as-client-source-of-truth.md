# 0004 — PowerSync's local SQLite is the client's source of truth; deterministic ids for one-per-key rows

- **Status:** proposed
- **Date:** 2026-11-22 (revised after phase-3 reviews)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` needs 2, 5, 6 and both offline acceptance tests; issue #5; backend ADR 0012 (upload path and error classes), backend ADR 0014 (tick model, rewritten per orchestrator ruling 1); `docs/architecture/mvp/reviews/rulings.md` rulings 1, 13, 14; draft `docs/architecture/mvp/mobile.md` §3, §5

## Context

Ticks and edits must work offline and sync later (need 5). Two members ticking offline must converge without errors: "same task, both offline → shows once, credited to one person, no error". Eyup confirmed PowerSync Cloud (free plan) over Supabase. Phase-3 review found that the first draft's blanket `PUT → upsert`, random ids on rows the backend keys deterministically, and "discard on any 4xx" would silently drop data (arch M-1, M-2, M-5). Facts (checked 2026-11-22): `@powersync/react` provides `useQuery`. The connector implements `fetchCredentials()` and `uploadData()` with `getNextCrudTransaction()` (https://docs.powersync.com/client-sdks/reference/react-native-and-expo).

## Options considered

| Option | Pros | Cons | Cost at MVP / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. UI reads PowerSync SQLite directly with reactive `useQuery`; writes are local transactions; per-table upload map; deterministic v5 ids for one-per-key rows (ticks included: one row per task per day, undo = delete) | One source of truth. Every reader of "is it done?" is `EXISTS`. Concurrent creates converge by construction. Fewest libraries | SQL in the client (kept in `data/queries`). Credit goes to the first **uploader**, not the first tapper | $0 | Medium: tied to PowerSync's API, isolated in `data/` |
| B. As A, but ticks as an insert-only event log (random ids, undo = insert, fold by `client_at`) | Audit trail; first tapper credited | A fold in TS and SQL across five readers; clock-skew edge cases; more code for ≤100 users | $0 | Medium |
| C. PowerSync + TanStack Query/Redux cache on top | Familiar patterns | Two caches to keep coherent | $0 | Medium |
| D. Legend-State + Supabase, no PowerSync | Lighter | We build the offline queue and conflict handling | $0 | Medium |

## Decision

**Option A** (orchestrator ruling 1 for the tick model).
- Domain data is read only through typed query hooks over PowerSync SQLite and written only through `data/mutations` (one write transaction each).
- Ids: UUIDv7 for ordinary rows. Deterministic UUIDv5 from `@petos/domain/ids` for `tick` (`task_id|local_date|slot`), `rest_day` (`pet_id|local_date`), `pet_place` (`pet_id|kind`), `reminder_pref` (`user_id|task_id`); `vet_contact.id = household_id`; `notification_settings.id = user_id`. The local tick write checks for an existing row first.
- Upload: a per-table map mirroring backend ADR 0012 (insert vs upsert vs ignore-duplicates; PATCH sends changed columns only; care cards, invites and membership changes go through online RPCs, except the household bootstrap member row).
- Errors: discard only on SQLSTATE `22xxx`, `23xxx`, `42501` and `P0001` (the single list lives in ADR 0012) (reported, dev banner); retry on 401 after a token refresh, 408, 429, 5xx and network errors.
- Zustand holds small UI state; AsyncStorage holds device-only and per-user keys.

## Consequences

- Easier: offline is the default path. Both offline acceptance tests pass with no error UI. Undo is a plain delete.
- Harder: a per-table connector test against local Supabase is required in CI, because a wrong mapping fails silently. Server schema changes must be additive during the beta. The "Done by" credit can silently flip after sync (first uploader wins); accepted by ruling 1.
- Next: keep the namespace constants and key format in `@petos/domain/ids`, reviewed by backend.
- Revisit if Eyup prefers the event log (option B): then ticks use random ids and undo-as-insert, and the fold lives in `@petos/domain/streak`. Only `data/mutations`, the tick queries and the planner's "already done" rule change.
