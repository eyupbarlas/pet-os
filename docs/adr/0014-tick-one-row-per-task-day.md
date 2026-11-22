# 0014 — Ticks are one row per task per household day; undo is DELETE

- **Status:** proposed
- **Date:** 2026-11-22
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (need 5, acceptance lines 2–3), mobile ADR 0004, ADR 0012, ADR 0016, orchestrator ruling 1, design §4

## Context

Two members can tick the same task or different tasks while offline. After sync, the spec requires
three things: both ticks show with names; the same task ticked twice shows once, credited to one
person; and nobody sees an error. Undo must exist (need 5). PowerSync may upload the same operation
twice. The team is 1–3 people and the MVP has at most about 100 users, so every extra reader of the
data costs real time.

The first draft (an insert-only event log) and mobile ADR 0004 (one row with a deterministic id,
undone by DELETE) contradicted each other. Combined as written, every undo would have been rejected
and then silently reappeared (architecture review R1). The orchestrator ruled for one row per key.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. **One row per `(task_id, local_date, slot)`** with id `uuidv5(NS_TICK, task_id|local_date|slot)` and a unique key. Insert with `ON CONFLICT DO NOTHING`; undo is a `DELETE` | "Done" is simply "the row exists" in every reader (Today, planner, streak SQL, card RPC, analytics). Duplicate uploads are idempotent. No clock-skew edge case. Matches mobile ADR 0004 | Credit goes to whoever **syncs** first, not whoever tapped first. No audit trail of undos. Undo against tick: the last upload wins | ~$0; ~3k rows per pet per year | Low |
| B. Insert-only events (`done`/`undo`) with random ids, folded by `(client_at, id)` (**rejected**) | First tapper credited. Full audit trail | The fold has to exist in TypeScript and SQL across 5 readers. Device clock skew decides undo races. More fixtures, more code | ~$0 | Low |
| C. A mutable row with last-write-wins updates | Small | The second offline tick overwrites the first person's credit. Needs an `UPDATE` grant. Messy undo semantics | ~$0 | Low |

## Decision

Option A.
- The server `BEFORE INSERT` trigger:
  - sets `actor_id` from the JWT;
  - clamps `client_at` to `now()` (display only);
  - checks that the task, pet and household match;
  - silently drops rows outside `today-2 … today+1`.
- Clients have `INSERT` and `DELETE` but no `UPDATE`.
- A `BEFORE DELETE` guard silently ignores client deletes older than `today-1`, so only today and
  yesterday can be undone. FK cascades are exempt.
- `AFTER INSERT/DELETE` triggers recompute the streak for past days (ADR 0016).
- Undoing another member's tick needs a confirmation in the app.
- The phone writes ticks with `INSERT OR IGNORE`.

## Consequences

- Easier: both offline acceptance cases pass by construction (the second insert is a no-op). The
  readers stay trivial. The platform planner's "skip if a tick exists" is correct as written.
- Harder: "Done by You" can quietly flip to the partner after sync. This is listed for Eyup as a
  confirmable decision, and the UI never animates the flip.
- Follow-up: the namespace and key-string format live in `packages/domain/ids.ts`, which mobile
  owns and backend reviews.
- Revisit if: Eyup wants first-tapper credit or an undo history. Then move to option B: mobile
  switches to random ids and undo events, and every reader changes to "folded state is done".
