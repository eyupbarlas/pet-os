# 0002 — Expo Router for navigation, native sheets for modals

- **Status:** proposed
- **Date:** 2026-11-22 (revised after phase-3 reviews)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (needs 3, 11; accessibility acceptance), issue #5, draft `docs/architecture/mvp/mobile.md` §2.3, §10

## Context

The app needs tabs, stacks, modal sheets that are **true modals** for screen readers (canvas a11y rule, spec acceptance), and deep links for invites (`/i/<token>`) and notification taps (`/today?pet=<id>`). Universal/app links claim `/i/*` only; care-card links `/c/*` stay web-only (orchestrator ruling 3). The team is 1–3 people, so navigation config should be little code with typed routes.

Facts (checked 2026-11-22): Expo Router v56 forked the parts of React Navigation it uses; direct `@react-navigation/*` imports no longer work and a codemod moves them to `expo-router/react-navigation` (https://expo.dev/blog/expo-router-v56-decoupling-from-react-navigation). SDK 58 made Router loaders/SSR stable (https://expo.dev/changelog/sdk-58). We don't use the web side; see ADR 0008.

## Options considered

| Option | Pros | Cons | Cost at MVP / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. Expo Router (file-based) + native stack presentations (`formSheet`, `modal`) for sheets | Deep links for free from the file tree; typed routes; maintained with the SDK. Native sheets are real modals for VoiceOver/TalkBack, and that's one dependency fewer | Router API changes with SDK releases. Sheet animation timing is the OS's, not the canvas's 220 ms | $0 | Medium: routes are files; moving to plain navigation is mechanical |
| B. React Navigation directly (config-based) | Mature, explicit | More wiring for deep links. Now diverges from what Expo ships and documents | $0 | Medium |
| C. Expo Router + JS bottom-sheet library | Exact control of motion (220 ms) and snap points | Modal semantics, focus trapping and back-button handling become our job. Extra native dependency | $0 | Low–medium |

## Decision

Use **Expo Router** for all navigation and **native stack presentations** (`formSheet`/`modal`) for every sheet (pet switcher, task edit, invite, care-card share, replace care-card links, delete account). The undo confirmation for another member's tick is a native alert.

## Consequences

- Easier: deep links and notification taps map to routes with no extra code. Screen readers treat sheets as modals without custom code.
- Harder: we accept OS sheet timing instead of the canvas's 220 ms; UX review should confirm. Router upgrades come with SDK upgrades.
- Next: route tree as in the draft §2.3; `ui/Sheet` handles focus on open/close.
- Revisit if native sheets can't meet a must-have interaction from the chosen visual direction (e.g. custom snap points), then consider option C for that one sheet.
