# 0010 — Supabase Pro in Frankfurt as the backend

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md`, issue #5, design `docs/architecture/mvp/backend-sync.md` §2

## Context

The MVP needs a shared household database that 1–3 builders can run: auth, row-level access
for households (spec needs 2, 5), a public read path for care cards (need 8), scheduled jobs
(streak day close, need 6) and account deletion (need 11). It serves at most about 100 users.
EU hosting is preferred when it's free. Eyup confirmed Supabase in Frankfurt on 2026-11-22.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. Supabase Pro, Frankfurt (`eu-central-1`) | Postgres, RLS, Auth, pg_cron and Edge Functions in one EU project. SQL is portable. First-class PowerSync integration. | Edge Functions run on Deno (a second runtime). Free projects pause, so Pro is needed for the beta. | $25/month; ~$25–35 at 10k (research report, Nov 2026) | Low for data (plain Postgres); medium for Auth and Functions |
| B. Firebase / Firestore (europe-west3) | Built-in offline sync, mature mobile SDKs | No SQL, security rules instead of RLS, no PowerSync, a document model for relational household data | Free tier likely; pay per operation | High |
| C. Self-hosted Postgres + own API | Full control | Ops load the team doesn't have | VPS ~€10–20 plus time | Low |

## Decision

Use one Supabase Pro project in Frankfurt. Business logic is SQL (RLS, `SECURITY DEFINER`
RPCs, pg_cron). Edge Functions are used only where a secret or an external API is needed.
Local development uses `supabase start`.

## Consequences

- Easier: one vendor for data, login and jobs; RLS is the single place permissions are
  enforced; the region is chosen once at creation and can't be changed later.
- Harder: SQL-heavy logic needs SQL tests (pgTAP or plain SQL) in CI.
- Follow-up: accept the Supabase DPA before public launch; turn on the spend cap.
- Revisit if: we need features Supabase doesn't host well (heavy background workers), or cost
  jumps past Pro.
- Privacy flag: data location Frankfurt; support and billing data may leave the EU (research report).
