# 0005 — Pre-account onboarding: device draft, written to synced tables at sign-in; separate join path for invitees

- **Status:** proposed
- **Date:** 2026-11-22 (revised after phase-3 reviews); amended 2026-11-23 (owner role)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` need 1 and acceptance "A new user adds a dog, sees its default routine, then signs up; nothing entered is lost"; need 2 (invite); `pet-os-context` "Onboarding is pet first, account second"; backend ADR 0017 (no anonymous auth); `docs/architecture/mvp/reviews/rulings.md` rulings 11, 12; issue #5; draft §4

## Context

A new user adds a dog or cat and sees its default routine before creating an account. Signing in must keep everything. The user may already have a household (reinstall, second device) or may arrive through a partner's invite link. Reviews added three needs: a display name for "Done by …" (arch M-7), invited partners must not see pet creation (PO M-3), and joining must never silently leave a household or delete pets (PO M-4, ruling 11). Facts (checked 2026-11-22): PowerSync supports local-only tables with a `viewName` swap; switching a table from local-only to synced **deletes its local data** (https://docs.powersync.com/client-sdks/advanced/local-only-usage).

## Options considered

| Option | Pros | Cons | Cost at MVP / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. JSON draft (pet + tasks, ids pre-generated) in device storage; after sign-in and a name step, one transaction inserts `household` (the server sets `owner_id` = creator, so the creator is the owner), the creator's bootstrap `household_member`, pet and tasks; invitees take a separate join path (sign in → name → preview + explicit join sheet) | Tiny and testable. No server rows for non-sign-ups. Invitees reach Today in four screens | Main app gated behind sign-up (no ticking before an account) | $0 | Low |
| B. PowerSync local-only tables with `viewName` swap | Full app before sign-up | Schema flips can delete local data; more moving parts | $0 | Low–medium |
| C. Supabase anonymous sign-in, link identity later | Sync from minute one | Server rows for non-sign-ups, abuse protection, linking native ID tokens **unverified**, still needs a merge | $0 | Medium |

## Decision

**Option A.**
- New owner: pet-new → editable routine preview → sign in → "What should the household call you?" (prefilled from the provider, required) → bootstrap transaction (or "Add Burek to your household?" for an existing household) → consent → Today.
- Invited partner: `/i/<token>` → sign in → name → `preview_invite` → a join sheet that names the consequences ("Burek comes with you, with his history" / "You'll leave 'Kowalski home'; Burek stays there with Tomek", plus "Tomek becomes the owner." when the joiner owned that household, from `preview_invite.my_current.new_owner_name`) → flush the upload queue → `accept_invite(p_token, p_display_name, p_confirm_leave)` → consent → Today. Pets always come along; the join flow never deletes pets. The joiner always becomes a member, never the owner (owner role added 2026-11-23, ADR 0019).
- No typable invite code in the MVP (ruling 6).

## Consequences

- Easier: one small onboarding module and one join module, both with clear tests; no PII on the server before sign-up.
- Harder: users can't tick before an account (accepted by PO R1). Joining needs a connection and an empty upload queue.
- Revisit if Eyup wants full pre-account use (move to option B, keeping the same draft ids), or if beta drop-off between routine preview and account is high.
