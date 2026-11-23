# 0023 — Sentry EU for crash and error reporting, consent-gated, without user identity

- **Status:** proposed
- **Date:** 2026-11-22 (revised after reviews 03 and rulings 04)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (need 11, acceptance on opt-in), issue #5, ADR 0022, design §4, §6

## Context

A 1–3 person team needs readable crashes from ~100 beta users on iOS and Android
(Hermes and native). Eyup confirmed Sentry EU in the stack. Whether crash reporting is
"strictly necessary" under PKE art. 399 is an open **[lawyer]** item, so it is
consent-gated and **off by default** for the beta (ruling 10; privacy review R4). Sentry's free Developer plan is 1 user, 5,000 errors a month and a 30-day
lookback. Team is $26–29 a month ([pricing](https://sentry.io/pricing/), 2026-11-22). Sentry's
EU region can only be chosen at org creation (research report). PostHog also offers error
tracking, including native crashes via `@posthog/react-native-plugin`
([docs](https://posthog.com/docs/error-tracking/installation/react-native), 2026-11-22).

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. Sentry EU org, `@sentry/react-native` + Expo plugin, own consent switch, no `setUser` | Mature RN/Hermes/native symbolication via EAS; separate consent from analytics; no personal data in Sentry, so no deletion call | Second vendor and SDK; free plan is one seat | $0 (1 seat) / $26–29 Team | Low (behind `reportError`) |
| B. PostHog error tracking in the same project | One vendor, 100k exceptions free, unlimited seats | Native plugin newer; crash consent tied to analytics consent; not what Eyup confirmed | $0 / $0 | Low |
| C. Store crash reports only (App Store Connect, Play vitals) | No SDK, no consent | Slow, no JS stack traces, poor for a JS app | $0 | none |

## Decision

Option A. Create a new Sentry org in the EU region. Initialise the SDK only after the user turns
on "Send crash reports" (default off). Settings:
- `sendDefaultPii: false`, no user context, replay, profiling and tracing off;
- a shared `scrubSensitive()` in `beforeSend` and `beforeBreadcrumb`. It redacts `/c/<token>`,
  `/i/<token>`, `t=`, `token`, `code`, `access_token`, `refresh_token`, and `Authorization`,
  `apikey` and cookie headers. It drops query strings and fragments on HTTP breadcrumbs, and
  drops request bodies.

Store crash reports (option C) are the consent-free baseline.

## Consequences

- Contract M7. All calls go through `reportError()` and a root `ErrorBoundary`, so swapping to
  option B is about a day.
- The deletion job does not call Sentry, because there is no user identity. Events age out
  at 30 days.
- Moving to Team ($26–29) when a second builder needs access.
- Consent belongs to the person. On sign-out, `Sentry.close()` runs and the cached choice is
  cleared.
- LATER: if the lawyer says crash reports are strictly necessary, the switch can default on.
- Revisit to cut a vendor (option B) if PostHog native crashes prove readable, or on cost.
