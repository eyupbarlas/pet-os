# 0019 — Equal members; preview-and-confirm join; removal by left_at; deletion keeps household data unless last member

- **Status:** proposed
- **Date:** 2026-11-22
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (needs 2, 11; acceptance on removal and deletion), confirmed answer 5, ADR 0014, orchestrator rulings 7 and 11, privacy review B2/B4/B5, PO review B-M2/M-4

## Context

Households have up to about 6 adults with equal rights. Any member can remove any other, and
members can leave. Removal must stop access on the next sync. Deleting an account must remove the
user's data, keep household data for the remaining members, or delete it if they were the last.
Past ticks must stay meaningful.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. `household_member.left_at` for removal (row kept for names); account deletion deletes the auth user; FKs cascade per-user rows and set `tick.actor_id` to NULL ("Former member"); households with no active members are deleted | Few moving parts; anonymisation comes from FKs; history stays consistent | A removed (not deleted) member's name stays in the household's history | $0 | Low |
| B. Hard-delete membership on removal | Simpler table | Past ticks lose their names on simple removal | $0 | Low |
| C. Owner role that owns the pets | Clear ownership | Contradicts "equal rights"; transfer flows needed | $0 | Low |

## Decision

Option A.

**Joining.** `preview_invite(p_token)` shows what will happen, then the user confirms, then
`accept_invite(p_token, p_display_name, p_confirm_leave)` runs.
- The cap is 6, and a user has one active household.
- A sole member's pets come along with their history and their care cards, via the
  `ON UPDATE CASCADE` FKs.
- Leaving a household that still has members requires `p_confirm_leave`, which the RPC enforces.
- Joining never deletes pets.
- There is no typable code.

**Removal and leaving.** Both go through `remove_member`, which sets `left_at` and, in the same
transaction:
- revokes all open invites of the household (privacy B2);
- strips the person's `owner_contacts` entries from the household's cards (B4);
- reports the number of cards, so the app can offer to rotate them.

**Deletion.** `delete-account` (Edge Function; user JWT, or the service role for the manual web
runbook) runs `private.delete_user_data(uid)`, then `auth.admin.deleteUser`. That is the commit
point. External steps go into `deletion_followup` (`posthog_person`, `receipt_email`,
`apple_revoke`) and are retried daily by `deletion-followup` (pg_cron → pg_net → Vault secret).
The founders are alerted on the third failure, and payloads are cleared within 7 days (B5).
Apple revocation uses a fresh `authorizationCode` from in-app re-auth. Apple refresh tokens are
never stored long term. The web path can't revoke the Apple token, which is accepted for the
beta.

## Consequences

- Easier: one deletion job for the app and the runbook; idempotent; vendor failures are visible
  rather than silent.
- Harder: the queue briefly holds an email address (receipt) or an Apple refresh token (revoke),
  for at most 7 days.
- Eyup to confirm: pets that came in with a member stay with the household if that member is later
  removed.
- Revisit if: sitter accounts arrive (a `sitter` role with `valid_until`), or users want several
  households.
- Privacy flag: defines what "delete my data" means in a shared household.
