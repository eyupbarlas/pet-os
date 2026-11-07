---
name: pet-os-context
description: "The Pet OS product brief every agent needs before designing, specifying or reviewing anything: who the app is for, what is in and out of scope, the roadmap phases and gates, the UX rules from the design canvas, and the hard constraints (EN/PL, GDPR, 1–3 builders, iOS + Android + small web). Load it whenever you work on Pet OS architecture, specs, UX, privacy or stack choices, or when you need to check an idea against scope, the won't-do list or the gates."
---

# Pet OS — product context

Load this before any Pet OS work so every agent argues from the same facts. The live
sources of truth are outside the repo; this file is a working summary. When it disagrees
with a live source, the live source wins and this file should be updated.

- Roadmap (Option A, live Claude Doc): https://claude.ai/artifact/WwFYe63B2CHstF8G4L1P1c
- Design canvas, original look: https://claude.ai/artifact/DpMEnVH3hzgEGMpCohmd5F
- Design canvas, direction "D · Everyday": https://claude.ai/artifact/VEVykNuWgwwf7iapCxkJyj
- Board: https://github.com/users/eyupbarlas/projects/8 (issues in this repo)

Which visual direction wins is still Eyup's call. **Architecture and specs must not depend
on visual style** — no colours, fonts or illustration choices baked into data, APIs or
component contracts. Theming is a token layer on top.

## Thesis

Build around the **pet** (profile, routine, health, caregivers), not around services.
Food and grooming plug in through partners. The pet profile and the shareable care card
become the trust layer for a later vetted walker/sitter marketplace (Option B).

## Hard constraints

- 1–3 builders. Prefer managed services and boring tech; every extra moving part is a cost.
- iOS + Android from one cross-platform codebase, plus a small web front end (public care
  cards, account-deletion page required by Google Play).
- Polish + English from day one. Test long Polish words and Polish plural forms.
- Auth: Apple, Google, email. Sign in with Apple is mandatory on iOS if Google is offered.
- GDPR/EU: analytics, session replay and marketing are **off by default** and consent-gated.
  Account deletion in 3 taps plus a web page. Data export.
- Warsaw first, Poland only for now.
- Fun UX is a requirement, but plain copy: no guilt, no first-person pet voice.

## Won't do (yet)

Horses and farm animals; own inventory or logistics; **taking payments for services**;
worker payouts; telemedicine; social feed; markets outside Poland.

## Phases and gates

- **Now (Nov–Dec 2026):** design done, prototype test, 24 owner interviews, tech foundation.
  Partners: Psibufet (dog food) and Booksy (grooming) as **link-outs only**, owners log
  deliveries and appointments by hand.
- **Next (Jan–Apr 2027):** MVP + closed beta, 100–300 Warsaw owners, dogs + cats.
  Includes the emergency "nearest open vet" finder (location asked on tap only; Google
  Places API (New) Nearby Search, `veterinary_care`, open now; directions via a Google Maps
  URL; denied location falls back to a Maps search) and Info library v1 (breed-aware,
  vet-reviewed, cites sources, never presented as vet advice). Next is ~2× team capacity —
  flag scope risk.
- **Later (May–Dec 2027):** coins/achievements/avatar shop (earn-only coins, never sold,
  daily cap, no leagues, no paid streak repair), full dark mode, lightweight species (fish,
  rabbits, birds, hamsters), monetization test (premium vs affiliate), AI avatar from pet
  photo (photos deleted after generation, moods can be turned off), AI portion advisor
  (range, vet overrides), insurance via a licensed broker (referral only), Allegro and Maxi
  Zoo shopping links, Option B pilot, public launch in Poland.
- **Gates:** G1 (Dec 2026) owners confirm care-tracking pain AND ≥1 food + ≥1 grooming
  partner path. G2 before Option B: care cards get shared, owners ask for help unprompted.
  G3 before coins: D30 ≥25%, ≥30% of active pets hit a 7-day streak, avatar builder used.

## Core domain

household → pets (per species) → routine (tasks), care events (ticks), streaks,
caregivers (owner, partner, sitter with limited/time-boxed access), care-card links,
"usual places" per pet (chosen food, groomer + next visit), avatar config.

## UX rules from the canvas (style-independent)

- **Streak:** a day counts when every meal and med is ticked (cat: meals + fresh water).
  2 automatic skip days ("paw passes") a month, rest days, max 1 nudge a day, no guilt
  copy. Family and sitter ticks count. Milestones at 7/14/30/100 days. "Day" means the
  household's local calendar day.
- **Today** shows who did what ("Done by Partner/You").
- **Pet switcher:** same control on every screen, opens a "Your pets" sheet, keeps you on
  the current screen.
- **Motion:** tick 160 ms, progress 300 ms, sheet 220 ms, celebration ≤1.2 s; respect
  Reduce Motion.
- **Accessibility:** WCAG 2.1 AA, visible focus ring, focus management on tick, true modal
  sheets, 200% font scale, accept "5,8" decimals (Polish locale).
- **Settings:** theme follows System; marketing and usage stats off by default; delete
  account in 3 taps + web deletion page.
- Onboarding is pet first, account second.
- Official Apple/Google sign-in assets only.
