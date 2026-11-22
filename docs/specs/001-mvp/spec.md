# 001 — Pet OS MVP: shared daily care for dogs and cats

- **Status:** review
- **Issue:** #3
- **Owner:** Product Owner (agent)
- **Last updated:** 2026-11-07
- **Roadmap phase:** Next (MVP)

> **Scope note vs. roadmap:** the roadmap puts the emergency vet finder and Info library v1 in
> Next, and Next is ~2× team capacity. This spec moves both **out** of the first MVP so a 1–3
> person team can ship the core household + streak loop that gates G1/G3 measure. They stay
> on the roadmap for a follow-up spec. Eyup to confirm (Open question 1).

## Problem

Households with a dog or cat share care in their heads and in chat threads: "Did you feed
her?", "Was the pill this morning or tonight?", "When is the groomer?". When a sitter steps
in, instructions live in a long message. *We think* (to be confirmed by the 24 interviews,
G1) that the pain is double-feeding, missed meds and re-explaining routines — not a lack of
shops. This MVP exists to let ~100 real owners play with the loop and tell us if it sticks.

## Who has it

- **Owner** (creates the household) and **partner/family member** (invited, equal rights),
  both ticking care daily, often on the move and sometimes offline (walks, lifts, cellars).
- **Sitter** (neighbour, friend, paid sitter) who needs today's routine without an account.
- **Pets:** dogs and cats only. A cat's day (meals, fresh water, litter) differs from a dog's
  (meals, walks). Warsaw, Polish or English speakers, max ~100 users.

## Needs

1. **Pet-first start.** A new user can add their first dog or cat (name, species, optional
   breed, birth date/age, weight) and see a sensible routine *before* creating an account;
   the account step (Apple, Google, email) saves it.
2. **Household.** An owner can invite a partner by link; both see and edit the same pets,
   routine and history. Either can remove a member; members can leave.
3. **Pet profiles.** A household can hold several dogs and cats; the user can switch pets
   from anywhere and stay on the same place in the app.
4. **Daily routine.** Each pet has a routine started from a species default (dog: meals,
   walks; cat: meals, fresh water, litter) that the household can add to, edit, reorder,
   pause or remove. Tasks can be timed or "any time today", daily or every N days.
5. **Ticks with attribution.** Anyone in the household can tick a task done (and undo it);
   everyone sees who did it and when ("Done by Partner"). Ticks work offline and sync later.
6. **Streak.** A day counts when every meal and med is ticked (cat: meals + fresh water).
   Two automatic skip days ("paw passes") a month, user-marked rest days, milestones at
   7/14/30/100 days, celebrated playfully; no guilt copy, no first-person pet voice. "Day" is
   the household's local calendar day; household ticks count toward one shared streak per pet.
7. **Reminders.** Each member can turn reminders on per task, and gets at most one streak
   nudge a day; each person controls their own reminders and quiet time.
8. **Care card for a sitter.** An owner can share a link that shows, without an account,
   the pet's essentials: today's routine, meds and doses, feeding amounts, vet contact,
   owner contacts and notes. The owner can turn the link off at any time, and it cannot be
   guessed.
9. **Health basics.** Per pet: medications (name, dose, schedule → appear as routine tasks),
   vet visits and vaccinations (date, note, next due), and the household's own vet contact.
10. **Usual places.** Per pet: the chosen food (dog: "Order on Psibufet" link-out; cat or
    other: the owner's own shop link) and groomer ("Book on Booksy" link-out) with the next
    visit, which the owner logs by hand. No orders or bookings happen inside Pet OS.
11. **Settings and privacy.** Language EN/PL (defaults to the phone), theme follows the
    system's light setting, usage stats and marketing off until the user opts in, delete
    account in 3 taps in the app plus a public web page to request deletion.
12. **Bilingual.** Every user-facing text exists in English and Polish, including
    notifications, the care card and errors.

## How we'll know it works

Acceptance (must pass before the beta):
- [ ] A new user adds a dog, sees its default routine, then signs up; nothing entered is lost.
- [ ] Two household members, both offline, tick *different* tasks for the same pet; after both
      reconnect, both ticks show with the right names and the streak is correct.
- [ ] Both offline tick the *same* task; after sync it shows once, credited to one person,
      and no one sees an error.
- [ ] A day with all meals + meds ticked counts; a missed day uses a paw pass automatically
      (max 2/month); the third miss resets the streak with neutral copy.
- [ ] The day boundary follows the household's local time, including the DST change weekend.
- [ ] A sitter opens the care card on a phone browser with no account and sees today's
      tasks and meds; after the owner turns the link off it shows "no longer available".
- [ ] The partner invite works for an existing and a brand-new user; removing a member stops
      their access on next sync.
- [ ] Switching language EN↔PL changes all text with no English leftovers; Polish plural
      forms are correct (1 dzień / 2 dni / 5 dni); long Polish words don't truncate at 200%
      font size; "5,8" and "5.8" are both accepted as a weight.
- [ ] Accessibility: screen-reader labels on every control and tick; announced state after
      a tick; visible focus; sheets are true modals; celebrations respect Reduce Motion;
      contrast meets WCAG 2.1 AA.
- [ ] No analytics or session data leave the device before opt-in.
- [ ] Account deletion in 3 taps removes the user's data (household data stays with the other
      member, or is deleted if they were the last); the web page works without the app.
- [ ] Psibufet and Booksy links open the partner in the browser/app; nothing is purchased in-app.

What we want to learn (closed beta, ~100 users, consented stats only):
- **G1 — is care-tracking a real pain?** Share of households that invite a partner within 7
  days (target to set; *we think* ≥40%); ticks per active pet per day; % of ticks by
  non-creators.
- **G3 inputs — does the loop stick?** D30 retention (gate: ≥25%); % of active pets hitting a
  7-day streak (gate: ≥30%); paw-pass use; reminder opt-in and opt-out rates.
- **G2 early signal:** care cards created and opened by someone else.
- **Partner paths:** taps on "Order on Psibufet" / "Book on Booksy" per active household.
- Qualitative: a short in-app or interview check at week 2 and week 4.

## Constraints

- MVP size: max ~100 users. Simplest option that works; EU hosting when free, not a filter.
- Privacy basics: consent-gated stats, no secrets in the app, unguessable revocable links,
  account deletion. No location access in this MVP.
- EN/PL via one editable text file per language (`en_US.json`, `pl_PL.json`), translated
  in-house.
- iOS + Android + a small web front end (care card, deletion page). Sign in with Apple
  required on iOS; official Apple/Google sign-in assets only.
- Style-independent: nothing here depends on which visual direction wins.
- Won't-do respected: no payments, no inventory, no telemedicine, no social feed, Poland only.

## Out of scope (with reason)

| Candidate | MVP? | Reason |
|---|---|---|
| Emergency "nearest open vet" finder | **OUT** | Needs location consent, a paid maps API and key handling; the saved own-vet contact (Need 9) covers the beta. Next follow-up spec. |
| Info library v1 | **OUT** | Vet-reviewed, sourced content is an editorial project, not a build task; doesn't feed G1/G3. |
| Sitter time-limited accounts / sitter ticking | **OUT** | Care card link (read-only, revocable) is enough to test G2; caregiver roles add auth and permission work. |
| Pet photos | **OUT** | Upload, storage, moderation and deletion cost; pets use a name initial/species icon. |
| Data export | **OUT** | Context allows it after the MVP; deletion is in. |
| Full dark mode | **OUT** | Roadmap Later; no visual direction chosen. Light theme only (OS dark falls back to light). |
| Coins, achievements, avatar shop, AI avatar, AI portion advisor | **OUT** | Gated by G3; would muddy what the streak alone achieves. |
| Partner APIs, in-app ordering/booking, Allegro/Maxi Zoo, insurance | **OUT** | Link-outs only in MVP; integrations are Later. |
| Other species, multiple households per pet, web app for owners | **OUT** | Dogs + cats only; the web is for care cards and deletion. |

## Open questions

1. Do you agree to move the emergency vet finder and Info library out of the first MVP (to a
   follow-up release in Next)?
2. Should sitters be able to tick tasks on the care card (their ticks count toward the
   streak per the canvas rule), or is read-only enough for the beta?
3. Should the care card link expire on its own (e.g. after 14 days) or only when turned off?
4. Do you accept "no pet photos" in the MVP, or is a single profile photo a must for the fun?
5. Can more than two adults share a household (family of four), or cap it at owner + partner?
6. Are walks streak-critical for dogs, or only meals + meds as the canvas rule says?
7. Should the beta be invite-only (codes/TestFlight list) or open to anyone who finds it?
8. What target do you want for "partner invited within 7 days", so G1 has a pass/fail line?

## Decisions

None yet — ADRs from this spec go in `docs/adr/`.
