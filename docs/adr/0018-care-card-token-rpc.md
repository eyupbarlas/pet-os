# 0018 — One-pet care card behind a token-gated SECURITY DEFINER RPC, token stored in plaintext

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (need 8; acceptance "no longer available"), platform B4, orchestrator rulings 3–5, privacy review R1/R2/B1, issue #5

## Context

A sitter opens a link with no account and sees today's routine, meds, feeding, the vet and owner
contacts. The link must be unguessable and revocable at any time (confirmed: no auto-expiry).
Any member should be able to re-share it. The web is a Cloudflare Worker.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. RPC `get_care_card(token)`, `SECURITY DEFINER`, executable by `anon` only; the Worker uses the publishable key; the 256-bit token is stored in plaintext and synced to members | No service key in the Worker; one narrow, auditable query; members can re-share; revoke is immediate | A token is visible on members' phones (which already hold the same data) | $0 | Low |
| A′. As A, but store only `sha256(token)` (platform draft) | Protects tokens if the DB leaks | Re-sharing means rotating, which breaks the link the sitter already has; no real gain, since the card shows a subset of the same DB | $0 | Low |
| B. Edge Function with the service-role key | Flexible | A powerful key in a public path; more code | $0 | Low |

## Decision

Option A (rulings 4 and 5, privacy R1).
- **One pet per link.** `care_card_link.pet_id` has a composite FK to `pet(id, household_id)`, so
  a card can't point at another household's pet (privacy B1). `get_care_card` also joins on the
  household.
- **Token.** `gen_random_bytes(32)`, base64url, exactly 43 characters. It is readable only by
  active members through RLS and the stream. It never goes to PostHog or Sentry, and logs show
  `/c/<redacted>`.
- **Lifecycle.** Create (`create_care_card_link(p_pet_id, p_lang)`), rotate and revoke are online
  RPCs.
- **Read.** Returns NULL for unknown, revoked or expired tokens, so the page shows "no longer
  available". Each task carries `marked_done` only, which the page shows as "Marked done" or
  nothing. There are no names and never "Not done".
- **Contacts.** `owner_contacts` entries are `{ user_id?, first_name, phone }`. A member's own
  entry is stripped when they leave, are removed or delete their account (privacy B4).
- **Counters.** `view_count` and `last_viewed_at` (no IP, no user agent). `expires_at` exists but
  is unused.
- **Web only.** App links claim `/i/*` only (ruling 3). The page sends `noindex, nofollow,
  noarchive` and generic meta tags (platform).

## Consequences

- Easier: G2 signal ("opened") without page analytics; turning on expiry later is a UI change.
- Privacy reviewer accepted plaintext for the MVP (R1). After removing a member, the app offers
  to rotate the household's card links (privacy M1).
- Multi-pet cards are a later, additive change: either a join table or several links.
- Revisit if: cards ever expose data not otherwise in the database (e.g. photos), or sitters get write access. Then switch to option A′.
- Privacy flag: public link to personal data (owner contacts); noindex and no third-party
  scripts on the page (platform).
