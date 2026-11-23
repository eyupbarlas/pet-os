# 0008 — One shared TS domain package; web pages render in a small Worker, not Expo Router web

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22 (revised after phase-3 reviews)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` needs 6, 8, 11 and the care-card / deletion acceptance tests; issue #5; platform ADR 0024 (Worker hosting); backend ADRs 0014–0016, 0018; `docs/architecture/mvp/reviews/rulings.md` rulings 3, 4, 5, 7; draft §2.1, C-B6, C-P9

## Context

The web front end is small: a public read-only care card (`/c/<token>`), an EN/PL deletion info page, an invite landing (`/i/<token>`) and `.well-known` files. The card must be fast, `noindex`/`noarchive`, cookie-free and script-free. Eyup confirmed Cloudflare for the web pages.

Reviews found three package names in use across the drafts (`@pet-os/domain`, `@petos/streak`, `@petos/shared`) for the same rules: household day, routine defaults, streak, id namespaces and the notification planner (arch row 25). These rules must be identical in the app, the Worker, the Edge Functions and the SQL fixtures.

Facts (checked 2026-11-22): Expo's documented server adapters are EAS Hosting, Bun, Express, Netlify and Vercel; **Cloudflare Workers is not listed** (https://docs.expo.dev/router/web/api-routes/).

## Options considered

| Option | Pros | Cons | Cost at MVP / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. `apps/web`: plain server-rendered TS Worker importing **one** shared package `@petos/domain` (plus `@petos/i18n`, `@petos/tokens`) | Script-free HTML; tiny; one home for shared rules | UI written twice (RN vs HTML templates) for three pages | $0 | Low |
| B. Expo Router web output | One framework | Ships React Native Web; Cloudflare adapter undocumented; upgrade churn on public pages | $0–? | Medium |
| C. Several small shared packages per owner | Clear ownership per package | Three names for one set of rules; cross-package drift | $0 | Low |

## Decision

**Option A.** The web pages are a small TypeScript Worker (hosting, headers and routes owned by platform). All shared rules live in **one package, `@petos/domain`**, with module owners:

| Module | Owner | Reviewer |
|---|---|---|
| `ids` (UUIDv5 namespaces, `|` key format) | mobile | backend |
| `day` (household date, DST, Luxon) | mobile | backend |
| `routineDefaults` (templates, `task.<species>.<kind>.<variant>` keys, `streak_critical` defaults) | mobile | backend |
| `streak` (`dueSet`, `dayOutcome`, `provisionalStreak`, `streak-fixtures.json` shared with SQL tests) | backend | mobile |
| `planner` (`planNotifications`) | platform | mobile |
| `parse` (decimal input, validators) | mobile | — |

Care cards: **one pet per link**; `get_care_card` computes "today" server-side, so the Worker only renders. The card shows "Marked done" or nothing, never names or "Not done". `/c/*` is web-only; app links claim `/i/*` only.

## Consequences

- Easier: one place to change a rule; CI runs the streak fixtures against TS and SQL.
- Harder: three owners commit to one package; changes to someone else's module need their review.
- Revisit if an owner web app comes into scope (then Expo Router web becomes attractive), or if sitters start ticking on the card (adds a small form; option A still fits).
