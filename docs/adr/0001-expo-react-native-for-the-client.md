# 0001 — Expo (React Native) for the iOS and Android client

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22 (reviewed in phase 3; no change)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md`, issue #5 (spec issue #3), research `docs/research/stack-choice.md`, draft `docs/architecture/mvp/mobile.md` §1

## Context

Pet OS needs iOS + Android from one codebase plus a small web front end (care card, deletion page), built by 1–3 people (`pet-os-context`). The MVP is offline-first (spec need 5) with PowerSync over Supabase. It is bilingual EN/PL (need 12) and must meet WCAG 2.1 AA. Eyup confirmed Expo in the stack on 2026-11-22. This ADR records why, so it isn't re-argued later.

Current facts (checked 2026-11-22): Expo SDK 58 shipped 2026-10-15 on React Native 0.88 (https://expo.dev/changelog/sdk-58). PowerSync's React Native SDK needs a development build (op-sqlite is not available in Expo Go) (https://docs.powersync.com/client-sdks/reference/react-native-and-expo).

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. Expo / React Native, TypeScript | One language for the app, web pages, shared domain logic and Supabase Edge Functions. First-party PowerSync RN SDK and supabase-js. Managed native builds/OTA (EAS). Large hiring pool | Expo SDK upgrade churn (~3 a year, 1–3 days each). Animation polish needs care (Reanimated) | $0 framework; EAS Free at MVP; $19–199/month EAS at 10k (research) | Medium: UI rewrite to leave; domain package is plain TS and portable |
| B. Flutter (Dart) | Strong rendering and animation. PowerSync Flutter SDK exists | Second language for web pages and Edge Functions. Flutter web is a poor fit for light link-preview pages (**unverified**), so the web is a separate stack anyway | $0; Codemagic or similar for CI | Medium–high: Dart-only codebase |
| C. Kotlin Multiplatform + native UIs | Native feel, shared logic | Two UI codebases (SwiftUI + Compose), more native skills needed. Too much for 1–3 people | Highest build effort | Medium |
| D. Fully native (Swift + Kotlin) | Best platform fidelity | Two apps, two teams' worth of work | Highest | Low per platform, high total cost |

## Decision

Build the client with **Expo (SDK 58), React Native and TypeScript**, using development builds (not Expo Go) and EAS for build, submit and OTA. All shared logic lives in plain TypeScript packages.

## Consequences

- Easier: one language across app, web pages and backend functions. PowerSync and Supabase SDKs used as designed. No native code expected for the MVP.
- Harder: we track Expo SDK releases. We stay on SDK 58 for the beta unless a store rule forces a bump. Budget 1–3 days per upgrade afterwards.
- Next: week-one spike on a dev build with PowerSync + op-sqlite, Apple/Google native sign-in, and Hermes `Intl` (time zones, plural rules).
- Revisit if: PowerSync's RN SDK can't meet the offline acceptance tests, or animation quality blocks the "fun UX" goal after a prototype test.
