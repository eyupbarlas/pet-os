---
name: ux-review
description: "Product Owner's review lens for Pet OS: does this design, spec or architecture serve what pet owners actually want, and does it feel good to use? Covers user value, flow friction, copy tone (EN/PL, no guilt), accessibility, motion, offline feel, and aesthetic quality without locking a visual style. Use when reviewing a spec, a screen or prototype, an architecture proposal's user impact, or when someone asks 'is this good UX', 'would users want this' or 'does this feel right'."
---

# UX and product review

The Product Owner speaks for the pet owner. The review asks two things: **will they want
it**, and **will it feel effortless and pleasant**. Taste matters — but it must be argued,
not asserted.

## Lens 1 — user value

- Which owner problem does this solve? Is there evidence (interviews, survey, prototype
  test) or is it a guess? Say which.
- Does it pass the "morning rush" test: can a tired owner tick a meal with one hand in
  under 3 seconds, offline?
- Does it respect the household: partners and sitters see who did what; nobody is shamed.
- Does it fit the roadmap phase and gates, or is it Later work sneaking into Next?

## Lens 2 — feel and flow

- Fewest steps to the job. Count taps for the top 3 tasks.
- Feedback is immediate (optimistic UI), even before sync confirms. Conflicts are resolved
  quietly, not with error dialogs.
- Empty, loading, offline and error states are designed, not left to defaults.
- Motion budgets (tick 160 ms, sheet 220 ms, celebration ≤1.2 s) and Reduce Motion.
- Copy: plain, warm, never guilt-tripping, no first-person pet voice. Works in Polish
  (long words, plurals, "5,8" decimals) as well as English.

## Lens 3 — accessibility (non-negotiable)

WCAG 2.1 AA, visible focus, 200% font scale without truncating Polish, screen-reader labels
on every tick, true modal sheets, colour never the only signal.

## Lens 4 — aesthetic quality (style-agnostic)

Judge hierarchy, rhythm, density, alignment and restraint — qualities that hold in any
visual direction. Avoid clichés (cream + clay "AI design", confetti everywhere, mascots
talking). Adult, everyday, calm beats cute. Don't pick fonts or colours; that decision is
open in another workstream.

## Lens 5 — what architecture means for the user

When reviewing an architecture proposal, translate it into user-visible effects: sync
delay between partners, what works offline, notification timing, sign-in friction,
data-export and deletion experience, app size and startup time.

## Output

```markdown
## UX review: {subject}
**Verdict:** ship / ship with changes / rethink
### What works
### Must fix (blocks the user)
| # | Issue | Why it hurts the user | Suggested change |
### Should fix
### Questions for Eyup
```
