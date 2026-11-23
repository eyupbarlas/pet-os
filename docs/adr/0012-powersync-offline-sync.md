# 0012 — PowerSync as the offline sync engine

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (need 5; acceptance "both offline"), issue #5, ADR 0013, ADR 0014

## Context

Household members tick care while offline (lifts, cellars, walks) and must converge after
reconnecting, with correct attribution and streaks (need 5, acceptance lines 2–3). Supabase has
no built-in offline sync. Mobile is Expo (React Native).

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. PowerSync | Local SQLite with offline writes and an upload queue; Supabase JWT auth; Sync Streams scoped per household; RN SDK | Write path is our connector (supabase-js under RLS); sync config is PowerSync-specific | Free (2 GB/month, 50 peak clients); Pro from $49 ([pricing](https://powersync.com/pricing.md), 2026-11-22) | Medium (source-available service; data stays in Postgres) |
| B. ElectricSQL | Postgres-native read sync | Reads only; we'd build offline writes ourselves | Free / paid | Medium |
| C. Hand-rolled (React Query + local queue) | No vendor | Conflict handling, partial sync and removal-on-revoke all on us | $0 + much time | Low |
| D. Zero (Rocicorp) | Good DX | No offline writes (maintainer, Feb 2026, per research report) | — | — |

## Decision

Use PowerSync with Sync Streams: one bucket per household (membership CTE on
`auth.user_id()`) plus one per-user stream. Writes go through a supabase-js connector under
RLS, with **one write mapping per table**. A generic "PUT → upsert" would break the column
grants (architecture review row 2). The mapping is:

| Table | PUT | PATCH | DELETE |
|---|---|---|---|
| `tick`, `rest_day` | `upsert(ignoreDuplicates)` | — | `delete` (window-guarded) |
| `pet_place`, `vet_contact`, `reminder_pref` | `upsert(onConflict: id)` | `update` | — |
| `household`, `household_member` (bootstrap) | `insert`, no `RETURNING` | `update` (granted columns) | — |
| `pet`, `medication`, `health_record` | `insert` | `update` | `delete` |
| `task` | `insert` | `update` | — (`ends_on`) |
| `profiles`, `notification_settings` | — (created by trigger) | `update` | — |
| `care_card_link` | — (RPC) | `update` (content columns) | — (RPC) |

**Error classification (ruling 14).** Discard only these permanent Postgres codes: `23502`,
`23503`, `23505`, `23514`, `22001`, `22003`, `22007`, `22008`, `22P02`, `42501` and `P0001`. Every
discard is logged (a dev banner and a per-table count). HTTP 401 (after a token refresh), 408, 429,
5xx and network errors are retried. A connector test per table runs against local Supabase in CI.
The streams must select the same rows as RLS, because they are a second authorisation layer.

## Consequences

- Easier: offline by default; removal of a member drops their local data on next sync.
- Harder: every table needs a uuid `id`; arrays and jsonb arrive as JSON text; the data model must
  be conflict-friendly (ADR 0014: deterministic ids for one-per-key rows). Silent discards can hide
  contract bugs, which is why the connector tests and discard logging exist.
- Revisit if: PowerSync pricing or licence changes, or a free-plan limit becomes a problem.
