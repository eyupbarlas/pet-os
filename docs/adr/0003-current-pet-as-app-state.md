# 0003 — Current pet is app state, not a route segment

- **Status:** accepted (Eyup, 2026-11-23)
- **Date:** 2026-11-22 (revised after phase-3 reviews)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` need 3 ("switch pets from anywhere and stay on the same place"), canvas rule "Pet switcher: same control on every screen … keeps you on the current screen", issue #5, draft §2.4

## Context

A household can have several dogs and cats. The switcher must sit on every screen and switching must not move the user. Notifications and deep links must still be able to open a specific pet.

## Options considered

| Option | Pros | Cons | Cost at MVP / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. Current pet in a small persisted store (`useCurrentPet()`); screens derive queries from it; links may pass `?pet=` to set it | Switching = one state change, the route stays put. One rule for detail screens (pop to tab root if the record belongs to another pet) | URL doesn't fully describe the screen (irrelevant on native) | $0 | Low |
| B. Pet in the route (`/pets/[petId]/today`, …) on every tab | URL describes the screen fully | Switching replaces routes on every tab stack. Back-stack behaviour gets confusing. Every screen needs the param | $0 | Low–medium |

## Decision

Keep the **current pet as app state** (Zustand store persisted per device and per signed-in user, cleared on sign-out). Pet-scoped screens read it. Deep links and notification taps set it via `?pet=<id>` before navigating.

## Consequences

- Easier: one switcher component on every tab header, with no route maths.
- Harder: detail screens must use the shared `usePetScopedRecord` rule. A deleted pet (pets are hard-deleted in the backend model) or one that vanishes through sync must fall back to the first pet by `sort_order`.
- Revisit if an owner web app (out of scope) needs shareable per-pet URLs.
