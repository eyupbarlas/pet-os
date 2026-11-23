# 0017 — No anonymous auth: server data exists only after sign-in

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (need 1; acceptance "nothing entered is lost"), ADR 0011, mobile ADR 0005 (device draft, then write at sign-in), design §7

## Context

Onboarding is pet first, account second, and nothing entered before sign-up may be lost. Sync
(PowerSync) and RLS need a user id. Mobile ADR 0005 keeps the onboarding pet and routine as a
device draft and writes it to the synced tables at sign-in. The backend has to decide whether to
also support anonymous Supabase users.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. No anonymous auth; the server only sees signed-in users; the device draft is written in one local transaction after sign-in (household bootstrap, member, pet, tasks) | No server rows or PII for non-sign-ups; no cleanup job; no abuse protection needed; first launch works offline; "existing account" and "invite" cases reuse one "Add this pet?" step | The full app (ticking) needs an account; only the onboarding preview runs before it | $0 | Low |
| B. Supabase anonymous sign-in at first launch, then `linkIdentity` to the same uid | Sync and ticking before an account | First launch needs a connection; anonymous users need a cleanup job and CAPTCHA for open launches; RLS must treat `is_anonymous`; an identity that already exists still needs a discard or merge path ([anonymous docs](https://supabase.com/docs/guides/auth/auth-anonymous.md), 2026-11-22) | $0 | Medium |

## Decision

Option A. Anonymous sign-ins stay off in the Supabase project. The phone writes the draft in
one transaction: `household`, then **the creator's own `household_member` row** (matches mobile
C-B3), then pet and tasks. RLS policy `member_bootstrap` (`private.can_bootstrap`) accepts that
member row only when the caller created the household and it has no members yet. Every other join
goes through `preview_invite` and `accept_invite`. An `auth.users` trigger creates the `profiles`
and `notification_settings` rows. A display-name step fills `profiles.display_name` and the member
row.

## Consequences

- Easier: fewer moving parts in Auth, RLS and jobs; nothing to delete for people who never sign up.
- Harder: users can't tick before signing up (product question, mobile O1).
- Revisit if: Eyup wants the full app before an account. Supabase supports ID-token
  `linkIdentity` for native apps ([identity linking](https://supabase.com/docs/guides/auth/auth-identity-linking),
  2026-11-22), so option B stays open; the draft ids would carry over.
