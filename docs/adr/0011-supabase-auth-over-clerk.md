# 0011 — Supabase Auth, not Clerk

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (needs 1, 11), issue #5, ADR 0010, ADR 0017

## Context

Sign-in must offer Apple, Google and email (Apple is mandatory on iOS when Google is offered).
Pet-first onboarding before an account (need 1) is handled on the device (mobile ADR 0005,
backend ADR 0017). Account deletion must remove
the user everywhere (need 11). The founder's list had Clerk. Eyup confirmed Supabase Auth on
2026-11-22.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. Supabase Auth | Same project and region as the data; `auth.uid()` usable directly in RLS; native ID-token sign-in for Apple and Google; PowerSync accepts Supabase JWTs directly | Prebuilt UI is minimal (we build our own screens anyway); native ID-token sign-in on Expo needs a week-1 spike | Included in Pro (100k MAU) | Medium |
| B. Clerk | Polished prebuilt sign-in, native Apple in Expo | A second identity store to sync and delete from; no EU residency in its DPA; no official PowerSync example; JWT bridging into RLS needed | Free tier large | Medium–high |

## Decision

Use Supabase Auth with Apple (native ID token), Google (native ID token) and email one-time
code. Anonymous sign-in stays off (ADR 0017). Clerk is not used.

## Consequences

- Easier: one user table; deletion is one `auth.admin.deleteUser` plus FK cascades; RLS uses
  `auth.uid()`.
- Harder: we build sign-in screens with the official Apple and Google buttons.
- Follow-up: week-1 spike on `signInWithIdToken` (Apple with nonce, Google) on Expo for both
  platforms; Apple token revocation on deletion.
- Revisit if: native linking proves unreliable, or we need enterprise SSO.
