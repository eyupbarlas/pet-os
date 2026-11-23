# 0007 — Semantic design tokens + StyleSheet; no styling framework; light only

- **Status:** proposed
- **Date:** 2026-11-22 (reviewed in phase 3; no change)
- **Deciders:** Eyup
- **Related:** `pet-os-context` ("Architecture and specs must not depend on visual style … Theming is a token layer on top"); spec `docs/specs/001-mvp/spec.md` need 11 (light theme), accessibility acceptance (contrast AA, Reduce Motion); issue #5; draft §8

## Context

Two visual directions are still open (original vs "D · Everyday"). Swapping direction must not touch logic or component contracts. The MVP is light only (OS dark falls back to light). Contrast must meet WCAG 2.1 AA. Motion durations come from the canvas (tick 160 ms, progress 300 ms, sheet 220 ms, celebration ≤1.2 s). The web care card should share the same tokens.

## Options considered

| Option | Pros | Cons | Cost at MVP / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. `packages/tokens`: reference tokens per direction → semantic tokens; `useTheme()` + React Native `StyleSheet`; CSS custom properties generated for the web; CI contrast check on declared pairs | No extra runtime. Direction swap = one import. Same tokens on web. Contrast checked for any direction | We write a small `makeStyles` helper ourselves | $0 | Low |
| B. Tailwind-style (NativeWind) | Fast styling, familiar to web devs | Class names drift toward visual choices in components. Extra build plugin tied to SDK versions | $0 | Medium |
| C. Component kit (Tamagui, Gluestack) | Ready-made components and theming | Large dependency; visual opinions baked in; upgrade coupling with Expo | $0 | Medium–high |

## Decision

**Option A.** Components read **semantic** tokens only. Visual directions are reference-token files. Fonts, icons and motion durations are tokens too. App config sets `userInterfaceStyle: "light"`.

## Consequences

- Easier: the direction decision can land late without code churn; dark mode later is a second semantic map.
- Harder: we build a few primitives ourselves (Text, Button, Checkbox, ListRow, NumberField, Avatar).
- Revisit if a future team grows and wants a component kit, or when full dark mode is planned (Later phase).
