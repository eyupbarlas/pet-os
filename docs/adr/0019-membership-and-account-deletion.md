# 0019 — One owner plus members; preview-and-confirm join; removal by left_at; deletion keeps household data unless last member

- **Status:** proposed
- **Date:** 2026-11-22 (amended 2026-11-23: owner role)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (needs 2, 11; acceptance on removal and deletion), confirmed answer 5, ADR 0014, orchestrator rulings 7 and 11, privacy review B2/B4/B5, PO review B-M2/M-4

## Context

Households have up to about 6 adults. *Amended 2026-11-23 (Eyup; spec need 2, decision 5):* each
household has **one owner** (admin) plus members, replacing equal rights.
- Every member sees and edits all pets, routines, ticks, health records and care cards.
- Only the owner invites, removes members, renames or deletes the household, and transfers
  ownership.
- Members can leave at any time.
- If the owner leaves or deletes their account, ownership passes to the longest-standing member.
- Pets belong to the household. Removal must stop access on the next sync. Deleting an account must remove the
user's data, keep household data for the remaining members, or delete it if they were the last.
Past ticks must stay meaningful.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. `household_member.left_at` for removal (row kept for names); account deletion deletes the auth user; FKs cascade per-user rows and set `tick.actor_id` to NULL ("Former member"); households with no active members are deleted | Few moving parts; anonymisation comes from FKs; history stays consistent | A removed (not deleted) member's name stays in the household's history | $0 | Low |
| B. Hard-delete membership on removal | Simpler table | Past ticks lose their names on simple removal | $0 | Low |
| C. Owner who personally owns the pets | Clear ownership | Pets would have to move with the owner; contradicts "pets belong to the household" | $0 | Low |

How the owner is stored (chosen together with A):

| Option | Pros | Cons | Cost | Lock-in |
|--------|------|------|------|---------|
| O1. `household.owner_id uuid NOT NULL` | Exactly one owner by construction; RLS check is `owner_id = auth.uid()`; one source of truth | Needs triggers so the owner is always an active member | $0 | Low |
| O2. `household_member.role in ('owner','member')` | Role sits on the member row | Needs a partial unique index (at most one owner) **and** a deferred constraint trigger (at least one) | $0 | Low |

## Decision

Option A with O1.

**Owner.** `household.owner_id` is NOT NULL and references `auth.users ON DELETE RESTRICT`.
- The bootstrap trigger sets it to the creator.
- Clients have no update grant on it.
- Triggers require the new owner to be an active member, and block the owner's membership from
  ending without a transfer.
- The owner-only RPCs (`create_invite`, `revoke_invite`, `remove_member`, `transfer_ownership`,
  `delete_household`) and the household rename/time-zone RLS policy check
  `owner_id = auth.uid()`. Open invites sync to the owner only.
- **Auto-transfer:** `leave_household`, `accept_invite` (when it leaves the old household) and
  `delete_user_data` move ownership to the active member with the earliest `joined_at`. If nobody
  remains, the household is deleted.
- `delete_household` (owner only) cascades everything, pets included. The other members lose it on
  the next sync.

**Joining.** `preview_invite(p_token)` shows what will happen, then the user confirms, then
`accept_invite(p_token, p_display_name, p_confirm_leave)` runs.
- The cap is 6, and a user has one active household.
- A sole member's pets come along with their history and their care cards, via the
  `ON UPDATE CASCADE` FKs.
- Leaving a household that still has members requires `p_confirm_leave`, which the RPC enforces.
  The preview names the new owner if the caller owned it.
- The joiner becomes a member of the target, never its owner.
- Joining never deletes pets.
- There is no typable code.

**Removal and leaving.** `remove_member` (owner only, never self) and `leave_household` (anyone,
with auto-transfer) set `left_at` and, in the same transaction:
- revokes all open invites of the household (privacy B2);
- strips the person's `owner_contacts` entries from the household's cards (B4);
- reports the number of cards, so the app can offer to rotate them.

**Deletion.** `delete-account` (Edge Function; user JWT, or the service role for the manual web
runbook) runs `private.delete_user_data(uid)` (which transfers ownership or deletes last-member
households), then `auth.admin.deleteUser`. That is the commit
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
- Pets that came in with a member stay with the household if that member later leaves or is
  removed (pets belong to the household).
- Harder: owner-only controls must be hidden for members in the app; a member's queued rename is
  discarded (`42501`).
- The household time zone is treated as owner-only. Making it member-editable is a one-line policy
  change.
- Revisit if: sitter accounts arrive (a `sitter` role with `valid_until`), or users want several
  households.
- Privacy flag: defines what "delete my data" means in a shared household.
