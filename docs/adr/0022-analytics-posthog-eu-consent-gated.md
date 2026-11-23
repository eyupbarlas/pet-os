# 0022 — PostHog EU for consented product events; gate metrics from SQL aggregates

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22 (revised after reviews 03 and rulings 04)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (need 11; acceptance "No analytics or session data leave the device before opt-in"; G1/G2/G3 metrics), issue #5, design §4–5

## Context

The beta has to measure G1 (partner invited within 7 days; target ≥40%), G3 (D30 ≥25%,
≥30% of active pets with a 7-day streak, paw-pass use, reminder opt-in/out) and G2 (care cards
created and opened), from consented users only. Polish PKE art. 399 requires consent before
non-essential device access (research report). Eyup confirmed PostHog EU. PostHog's free plan
gives 1M events/month with no card ([pricing](https://posthog.com/pricing), 2026-11-22). The
RN SDK supports `defaultOptIn: false` ("will not track until `optIn()`"), but its docs do not
say what it writes to disk while opted out
([RN docs](https://posthog.com/docs/libraries/react-native), 2026-11-22).

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. PostHog EU, client **not mounted** until the "usage stats" switch is on; `defaultOptIn: false` as a second guard; lean typed event list; autocapture and replay off | Strictest reading of the acceptance criterion; one wrapper; EU region; free | Pre-consent onboarding funnel invisible; metrics biased to opted-in users | $0 / $0 under 1M events | Medium (event schema portable; dashboards are not) |
| B. PostHog with `defaultOptIn: false` only (SDK always initialised) | Simpler wiring | Relies on undocumented opt-out behaviour for "nothing leaves/is stored" | $0 | Medium |
| C. Aptabase (EU) | Privacy-first, small | Another vendor, not confirmed; fewer funnel tools | ~$0–10 | Low |
| D. Gate metrics (G1, G3 streak, G2 views) from SQL views over service data in a non-exposed `analytics` schema, aggregates only | Server truth; no cross-device dedupe; no consent bias; no device access, so PKE art. 399 is not touched (privacy review R3) | Needs a privacy-notice line and team discipline (aggregates only, no joins with PostHog); not a product-analytics tool | $0 | none |

## Decision

Options A **and** D together (ruling 9).
- **Gate metrics** come from SQL aggregate views (D):
  - G1 primary: invite created within 7 days;
  - G1 secondary: invites accepted, plus the invite landing-page view count;
  - G3: 7-day streaks, paw passes, D30, reminder opt-in;
  - G2: card views.
- **PostHog EU Cloud** (`https://eu.i.posthog.com`) gets only **consented product events** (A).
  The client stays unmounted until the user turns on "Share usage stats". Users are identified
  only by their Supabase UUID. Screen names are routes, never URLs. Every value passes the
  shared token scrubber. No streak events are sent from the client.

## Consequences

- Contracts M5, M6, B9 and B10: consent belongs to the person, with the profile as source of
  truth and a per-user cache that is cleared on sign-out. `track()` is the only entry point.
  No names, free text, tokens or IPs. The `analytics` schema has no grants to `anon` or
  `authenticated`.
- Account deletion calls PostHog person deletion (endpoint **unverified**).
- The privacy reviewer approved aggregate service-data metrics without consent, under
  conditions (review R3). The EN/PL beta privacy notice says so.
- Before public launch: PostHog DPA.
- Revisit if PostHog opt-in is so low that product questions can't be answered, or if event
  volume approaches 1M a month.
