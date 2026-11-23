# 0024 — Web pages as a plain Cloudflare Worker reading via narrow anon RPCs

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22 (revised after reviews 03 and rulings 04)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (needs 2, 8, 11, 12; care-card and deletion acceptance), issue #5, ADR 0018 (care-card token), ADR 0008 (mobile: shared TS packages), design §8–9

## Context

The web front end is small:
- a public read-only care card, **one pet per link** (ruling 5), turned off by the owner, with
  no auto-expiry;
- an invite landing page that is the app-link target;
- EN/PL account-deletion pages, which Google Play requires;
- an EN/PL beta privacy notice (privacy review P5);
- the app-link files.

The pages must work without an account, carry no third-party scripts and not be indexed or
archived. Eyup confirmed Cloudflare for web pages, and Cloudflare already runs DNS. Workers
Free gives 100k requests a day, and static assets are "free and unlimited"
([pricing](https://developers.cloudflare.com/workers/platform/pricing/), 2026-11-22). Whether
Expo Router web SSR deploys to Workers is **unverified**.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. Plain Worker (TS, optional Hono), server-rendered HTML with no client JS; reads only through anon `SECURITY DEFINER` RPCs (`get_care_card`, `record_invite_landing`, `health`, `get_app_config`) with the publishable key | Tiny; never holds the service-role key; same vendor as DNS; shares i18n JSON and the scrubber from `packages/domain` | Separate small codebase; hand-written templates | $0 / $0–5 | Low (Hono runs on Netlify, Vercel, Node) |
| B. Expo Router web SSR on Workers | One codebase with the app | Deploy path unverified; couples the pages to Expo upgrade churn | $0 | Medium |
| C. Supabase Edge Functions serving HTML | One vendor fewer | HTML from functions on the default domain is restricted (**unverified**); no custom domain by default | $0 | Medium |
| D. Vercel | Familiar | Hobby is non-commercial; Pro is $20 a seat | $20–60 | Low |

## Decision

Option A. A plain Cloudflare Worker on our domain serves the following:
- **`/c/:token`**, the care card. The token is **plaintext, 256-bit, exactly 43 base64url
  characters**, looked up as `token = p_token`, as in ADR 0018. It shows one pet, checked
  against the card's household. Tasks show "Marked done" or nothing, never "Not done", and
  no names.
- **`/i/:token`**, the invite landing. It has numbered TestFlight/Play steps, no code and no
  household data, and it counts views through `record_invite_landing`.
- **`/en/delete-account`, `/pl/usun-konto`**: an explainer of the in-app path plus a request by
  email to `privacy@`, handled with a manual runbook. There is **no self-serve web flow** in
  the MVP (ruling 7).
- **`/en/privacy`, `/pl/prywatnosc`**: the beta privacy notice.
- Terms, `/.well-known/*` (app links for **`/i/*` only**; cards are web only, ruling 3),
  `robots.txt` (no `Disallow: /c/`) and `/healthz`.

Care-card and invite responses use:
- `Cache-Control: no-store`;
- `X-Robots-Tag: noindex, nofollow, noarchive` and the matching meta tag;
- `Referrer-Policy: no-referrer`;
- a strict CSP with no scripts;
- no cookies and no analytics;
- generic `<title>`/OG tags ("Pet OS care card"), never card content.

Worker logs keep only method, redacted path, status and duration.

## Consequences

- Contracts B4 and B8 with backend (four anon RPCs, checked in CI; `invite.landing_view_count`),
  and M8, M9 and M11 with mobile.
- A leaked care-card token stays valid until a member turns the card off or rotates it.
  Members can re-share the same link (ADR 0018). Removal of a member prompts "Replace care
  card links?" in the app (mobile).
- The privacy reviewer confirms that the explainer plus email route fits Google Play's
  web-deletion requirement. The automated flow (Turnstile, `deletion_request`, request and
  confirm functions) is parked for before public launch.
- Revisit if:
  - sitters get write access: they would POST ticks, and the CSP would need a form action;
  - the beta opens publicly: build automated web deletion;
  - cards expose data not otherwise in the database: switch to hashed tokens;
  - a web app for owners enters scope: option B.
