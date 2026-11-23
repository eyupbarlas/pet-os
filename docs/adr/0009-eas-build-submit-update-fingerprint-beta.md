# 0009 — EAS Build, Submit and Update with fingerprint runtime versions for the invite-only beta

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22 (revised after phase-3 reviews)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (confirmed answer 7: invite-only beta via TestFlight + Play closed testing); research `docs/research/stack-choice.md` (EAS pricing); platform-services draft §10 (environments); issue #5; draft §11

## Context

≤100 testers, 1–3 builders, no dedicated release engineer. We need signed iOS/Android builds, delivery to TestFlight and Play closed testing, and quick JS fixes without store review. A JS update must never reach an incompatible native binary. Research report (early Nov 2026): EAS Free covers 15 + 15 builds a month and 1k OTA update users. At 10k users OTA would cost up to $199/month on EAS Production. Facts (checked 2026-11-22): SDK 58 adds `updates.maxUpdatesToKeep` (https://expo.dev/changelog/sdk-58).

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. EAS Build + Submit + Update; `runtimeVersion: { policy: "fingerprint" }`; remote auto-incremented build numbers; channels per profile | Managed signing and submission; native-compat safety from the fingerprint; built into Expo | Build queue waits on the free tier; OTA cost at scale | $0 / $19–199 a month at 10k | Low–medium |
| B. Local/GitHub Actions builds + fastlane; no OTA | No vendor | Mac runner for iOS, signing upkeep, slow fixes | $0 + time | Low |
| C. EAS Build + Codemagic OTA | Free OTA under 100k users (research) | Two vendors for one pipeline | $0 | Medium |

## Decision

**Option A.** Build profiles `development` (dev client), `preview` (internal testers) and `production` (TestFlight external + Play closed testing), matching platform-services' environment table. Fingerprint runtime versions, OTA for JS-only fixes, rollback by republishing the previous update. A `get_app_config().min_supported_version` gate retires broken builds.

## Consequences

- Easier: a release is two commands. Fixes reach testers in minutes.
- Harder: invited partners must also be testers. Per orchestrator ruling 6 this is handled by the beta landing page (public TestFlight link + Play closed-testing group), not by an app feature; there is no typable invite code. G1 is read primarily as "invite created within 7 days", with acceptance as a secondary number.
- Revisit at public launch (OTA cost at scale, Codemagic option) or if free-tier build queues slow the team down.
