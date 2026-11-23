# 0026 — No feature-flag vendor in the MVP; an `app_config` RPC is the kill switch

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22 (revised after reviews 03 and rulings 04)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md`, issue #5, ADRs 0021 and 0022, design §10

## Context

A 1–3 person team with ~100 invite-only users runs no experiments. We do need two levers:
forcing an update when a build is broken or incompatible with the sync schema, and turning off
the silent "sync now" push without a release, once that
planned follow-up ships (ADR 0021). Until then the flag stays `false`. PostHog flags would sit behind analytics consent
(ADR 0022). The research report says to bootstrap kill switches from our own backend for that
reason, and whether PostHog fetches flags while opted out is untested.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. `get_app_config()` RPC (anon-readable) returning `{ min_supported_version, maintenance_message_key, push_sync_enabled }`, plus EAS Update for fixes | Works for every user regardless of consent; no vendor; trivial | No targeting or percentages | $0 | none |
| B. PostHog feature flags | Targeting, rollouts, experiments | Only for consented users; a kill switch that misses non-consenting users isn't one | $0 (1M requests free) | Medium |
| C. A dedicated flag vendor | Full features | Extra vendor for no MVP need | $0–$$ | Medium |

## Decision

Option A. There is no flag vendor for the MVP. The app reads `get_app_config()` at start (contracts
M10 and B8).

## Consequences

- One small table and RPC. The update-required screen needs EN/PL strings.
- Revisit when we want staged rollouts or A/B tests, for example the premium test in Later.
  Then adopt PostHog flags for consented users, and keep this RPC for kill switches.
