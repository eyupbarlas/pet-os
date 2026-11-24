# 0025 — Resend for transactional email: custom SMTP for auth, API for the deletion receipt

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22 (revised after reviews 03 and rulings 04)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (needs 1, 11, 12), issue #5, ADR 0024, design §7

## Context

We need email for Supabase Auth (email OTP, email change) and for a "your account was
deleted" receipt at the end of the deletion job. The deletion job runs from the in-app flow, or
by hand from the runbook for email requests (ruling 7). Partner invites are share links, not
emails. Every user-facing text must exist in EN and PL (need 12). Supabase's built-in mailer is
meant for testing (its rate limits are **unverified**). Eyup confirmed Resend: 3,000 emails a
month, 100 a day and 3 domains free, and Pro is $20 a month for 50k
([pricing](https://resend.com/pricing), 2026-11-22). Sending can be in the EU; stored data is
in the US (research report). The Supabase Send Email Hook is **unverified**, and the
architecture review (P-7) advised starting without it.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. Resend as Supabase **custom SMTP**; auth templates in `supabase/templates/` with Polish first, then English in one message, with strings copied from `email.*` keys by a build script; the deletion receipt sent via the Resend API from `delete-account` in the user's locale | Least code; no unverified hook; JSON files stay the source of strings | Auth emails are bilingual rather than in one language | $0 / $20 | Low |
| B. Resend API from a Supabase Auth Send Email Hook (single-language auth emails) | One language per email | Hook unverified; one more non-JWT function to secure (signature) | $0 / $20 | Low |
| C. Amazon SES Frankfurt or Mailgun EU | EU storage | More setup; not confirmed | ~$0 / low | Low |

## Decision

Option A. Send from `no-reply@mail.healthypaws.io`, with SPF, DKIM and DMARC (`p=none`) in Cloudflare
DNS. Use the EU sending region, and turn off open and click tracking. Move to B when a third
language or richer templates are needed.

## Consequences

- Contracts B5 and B7. The `locale` in sign-up metadata picks the receipt language. The
  deletion job reads the email before deleting the auth user. A failed receipt is retried via
  `deletion_followup`, and the email is nulled once it is sent.
- With no public deletion form, the 100-a-day cap is ample.
- Before public launch: Resend DPA, a TIA for US storage, and a check of log retention.
- Revisit if the daily cap bites, if EU storage becomes a requirement (option C), or if
  bilingual auth emails confuse testers (option B).
