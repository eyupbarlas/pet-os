# MVP UI design vs MVP architecture: alignment check

- **Status:** review (canvas updated; Eyup decided the extras on 2026-11-23)
- **Issue:** #7
- **Design:** canvas "Pet OS — MVP screens" (original style, playful motion), now 47 artboards
- **Ideas cut from the MVP:** separate canvas "Pet OS — Ideas (after the MVP)", https://claude.ai/artifact/98ut7y9abWpzKcBcK4HsLk
- **Checked against:** [spec 001](../specs/001-mvp/spec.md) (approved), [MVP architecture](../architecture/mvp/README.md) (26 ADRs, proposed)
- **Date:** 2026-11-23

## Summary

The canvas was drawn before spec 001 and the architecture, so it shows more product than the
MVP will build, and it lacks most of the screens the household, sync and sharing rules need.

- **Design ahead of the architecture (cut or park):** 9 groups, for example passwords, sitter
  ticking, care-card expiry, dark mode, the vet finder, the info library, data export, food
  run-out tracking and the weight chart.
- **Architecture ahead of the design (draw):** 12 screens or states, for example the
  display-name and consent steps, the join flow, the Household screen, the care-card list, the
  routine editor, "Done by" on Today, rest day, the yesterday row and the three web pages.
- **Rules that disagree:** 6 copy or rule fixes, for example the dog streak now includes walks
  and care-card sitters never tick.

Recommendation per row below. Rows marked **Mechanical** follow from decisions already made in
the spec or the ADRs and are fixed on the canvas in this pass. Rows marked **Eyup** change what
the MVP does, so they wait for an answer.

## A. Design shows things the architecture does not support

| # | Screen(s) | In the design | Architecture / spec | Recommendation | Type |
|---|---|---|---|---|---|
| A1 | O6 Email sign-up, L1 Log in, L2 Forgot password, T3 Account, S states, 7 Confirm email, Today banner | Email + password, password rules, reset link, "Set a password", "Confirm your email" banner on Today | Email sign-in is a **6-digit one-time code**, no passwords (ADR 0011, backend §7.1). Signing in with the code already confirms the email | Email sign-up and log in become "enter email → enter code". Remove Forgot password, password rules, the Today confirm banner and "Set a password". Reuse screen 7 as the code step | Mechanical |
| A2 | 6 Care card (web) | Sitter taps "Mark done", "[Owner] gets a little update", "Ticks will be sent when you're back online" | Card is **read-only**; it shows "Marked done" or nothing, never names (spec decision 2, ADR 0018) | Replace buttons with a quiet "Marked done" label and the line "The family marks tasks in the app" | Mechanical |
| A3 | 5 Share card, 6 Care card | "Link works: 24 h / dates / until I stop", "link works until 21 Nov" | Links **never expire**; the owner turns them off (decision 3) | Remove the expiry choice; say "Works until you turn it off" | Mechanical |
| A4 | 5 Share card | Section switches (routine, meds and allergies, personality, vet, your phone, keys and home notes) | Card content = today's routine, meds, feeding amounts, vet (one `show_vet` switch), up to 3 contacts, one note, language. Public-link warning: "Don't add door codes or your address" | Keep: vet switch, contacts ("Add me" + 2 more), one note, language. Remove the keys/home-notes row and add the public-link warning | Mechanical |
| A5 | 6 Care card, S states | "Hi, I'm Luna!" in the pet's voice, nearest 24 h clinic, microchip, page caches itself for offline use, "Get the app" | No first-person pet voice (spec need 6). Payload has no 24 h clinic or microchip. Page is `no-store`, no scripts, so no offline copy. Beta is invite-only | Neutral copy ("Luna's care card"). Drop the 24 h clinic, microchip, offline-cache state and the app promo. Add EN/PL toggle and the warning line in the footer | Mechanical |
| A6 | 3 Health, C5 Health, 9 Emergency vet | "Emergency? Find an open vet" with Google Places | Vet finder is **out of the MVP** (decision 1); no location access | Replace with "Call your vet" from the household's vet contact. Park artboard 9 | Mechanical |
| A7 | 10 Info library, 2 Profile | Breed guides, "Shih Tzu guides for Luna" link | **Out of the MVP** (decision 1) | Park artboard 10; remove the Profile link | Mechanical |
| A8 | T8 Download my data, T4 Delete, Settings | Data export screen, "Download my data first" | Export is **out** (spec out-of-scope, parked before public launch) | Park T8; remove the links | Mechanical |
| A9 | D1, D2, K (dark), T2 Settings theme | Dark Today, dark Profile, dark skeleton, Light/Dark/System theme | **Light only** in the MVP (spec; ADR 0007 `userInterfaceStyle: light`) | Park the dark artboards; remove the theme picker | Mechanical |
| A10 | O2 Pick your animal | Dog, cat, rabbit, bird, reptile, something else | **Dogs and cats only** | Show dog and cat only | Mechanical |
| A11 | O3, C1 Pet details | "Add a photo" | **No pet photos** (decision 4); initial or species icon | Remove "Add a photo"; show the species icon | Mechanical |
| A12 | O9 Invite family | "Help with care" vs "Just follow along" roles; `[yourdomain].app/join/Q8f2…` | One owner + members who all edit; no follow-only role (ADR 0019). Link is `healthypaws.io/i/<token>`, open 7 days, owner only | Remove the role choice; show the real link format and "Works for 7 days"; only the owner sees Invite | Mechanical |
| A13 | O7 Reminders permission, O8 All set | Permission asked during onboarding; "Reminders for walks, meals and meds" already set up | Reminders are **off per task** by default; permission is asked **in context** the first time one is turned on, never at launch (platform §3.4) | Move O7 out of onboarding and use it as the in-context pre-prompt; All set says "Turn on reminders for any task" | Mechanical |
| A14 | T7 Privacy choices, T2 Settings | Usage stats, news and offers, **personalised partner offers** | Three switches: usage stats (PostHog), **crash reports** (Sentry), product news. All off | Swap "personalised partner offers" for "Send crash reports" | Mechanical |
| A15 | T3 Account | "Signed in on 2 devices / Log out everywhere else", connect Google | Not in the architecture | Remove; keep name, email, sign-in method, log out, delete | Mechanical |
| A16 | 4 Food, C6 Food, 1 Today "Food runs out in 6 days", O7 sample | Portion per day, delivery log, "Remind me 5 days before", run-out card | `pet_place` holds the food's provider, name, link and a note. No portion, delivery or run-out data; spec need 10 has no reminder | Cut delivery log, run-out reminder and the Today run-out card. Keep "Luna eats …" + "Order on Psibufet" / "Open my shop" | **Eyup: cut** |
| A17 | 8 Grooming, 1 Today "Grooming due in 2 weeks" | Visit time (10:00), past visits, "every 8 weeks", reminder the evening before | `pet_place.next_visit_on` is a **date**, no history, no cadence, no server reminder (backend open question 5) | Keep "next visit" as a date; cut past visits, cadence and the evening-before reminder | **Eyup: cut** |
| A18 | 3 Health, C5 Health | Weight chart May–Nov, "Share full health summary" | `pet.weight_kg` is one value; no weight history; no summary export | Show current weight only; cut the share-summary button | **Eyup: cut** |
| A19 | 2 Profile, C4, O3, C1 | Sex, spayed, personality chips, allergies, microchip, walks/day, indoor | `pet` has name, species, breed, birth date, weight and free-text `care_notes` | Put allergies and quirks in "Care notes" (free text, also shown on the card). Cut sex/spayed/microchip/chips | **Eyup: cut** |

## B. Architecture needs screens or states the design lacks

| # | Needed by | What to draw | Recommendation |
|---|---|---|---|
| B1 | ADR 0005, mobile §4.1 | **Display-name step** "What should the household call you?" after sign-in (prefilled from Apple/Google) | New artboard O6b |
| B2 | Platform §4 | **Consent step** "Help us improve": 3 switches, all off, "Not now" as prominent, privacy link | New artboard O6c (reuse T7's layout) |
| B3 | Mobile §4.2–4.3, ADR 0019 | **Join flow**: "Sign in to join a household" → name → **join sheet** ("Join Ana's household (Ana, Bartek)", pets that come along, "You'll leave …", owner hand-over line) → consent → Today. Plus expired/full invite errors | New artboards J1–J2 |
| B4 | Mobile §10.0–10.2 | **Household screen**: owner view (invite, remove, rename, time zone, transfer, delete household, leave) and member view (read-only + Leave); "Owner" label; "Tomek is now the owner" banner; confirmations that name pets and the next owner | New artboard H1 (owner + member states) |
| B5 | Mobile §10.2 | **Replace care-card links?** sheet after removing a member; "Open invite links were turned off" banner | Add to H1 |
| B6 | Mobile §4.4 | **No household** screen (removed / left / household deleted): "Create a household" or "Join with a link" | Add to S states |
| B7 | Mobile §10.3 | **Care cards list** in Settings: pet, created, last opened, view count; Copy, Replace link, Turn off. "Needs a connection" when offline | New artboard; Settings row "Care card links" already exists |
| B8 | Spec need 4, mobile §2.3 | **Routine tab and task editor**: add, edit, reorder, pause, remove; timed or "any time today"; every N days; "Counts toward the streak" (read-only); **my reminder for this task** switch | New artboards R1, R2. Tab bar becomes Today · Routine · Health · Pet (Settings from Pet or a 5th tab, see C6) |
| B9 | Spec need 5, mobile §3.5 | **Attribution on Today**: "Done by Ana · 07:58" / "Done by You"; undo of someone else's tick asks "Ana marked this done at 07:58. Mark as not done?"; "Former member" | Edit Today (dog, cat) |
| B10 | Mobile §3.5–3.6 | **Yesterday row** (only while yesterday has open streak tasks), **Rest day** action for today, provisional streak copy "3 of 5 done for the streak", "A paw pass covered Tuesday" | Edit Today and Streak |
| B11 | Mobile §3.4, §5 | **Sync states**: "Waiting to sync" on a row (already in S), "Needs a connection" for online-only actions (invite, join, card create/turn off, delete), "You've been signed out" | Add to S states |
| B12 | Platform §8.3–8.6 | **Web pages** (EN/PL): care card "no longer available" (410), invite landing with TestFlight/Play steps and "Open this link again", expired invite, account-deletion explainer (`/en/delete-account`, `/pl/usun-konto`), privacy notice | New web artboards W1–W4 |
| B13 | Platform §3.1, §3.4 | **Streak nudge offer** after the first completed day (pre-prompt), quiet time in Settings | Add to Streak/Settings |

## C. Rules that disagree

| # | Where | Design says | Architecture / spec says | Fix | Type |
|---|---|---|---|---|---|
| C1 | T1 Streak, canvas notes | "A day counts when every meal and med is ticked" | Dog: meals + meds + **walks** (decision 6) | Update copy and notes; flame on walks too | Mechanical |
| C2 | T1, C7 Streak, notes | "Ticks from sitters on a care card count too" | Sitters don't tick | "Ticks from everyone in your household count" | Mechanical |
| C3 | T1, C7 Streak | Rest days "for vet or sitter days", no rule | Rest day for **today only**, from Today | "Mark today as a rest day from Today" | Mechanical |
| C4 | T4 Delete account | Deletes all pets and "your care circle's access to pets you own" | Pets belong to the household and stay with the others; your ticks stay as "Former member"; ownership passes on; last member deletes the pets. Path: Settings → Delete account → Confirm | Rewrite the "what happens" list with these three cases | Mechanical |
| C5 | O9 Invite, Profile "Invite a co-caregiver" | Anyone invites | Owner only | Show invite only to the owner; members see the circle read-only | Mechanical |
| C6 | Tab bar on all app screens | Today · Health · Food · [Pet] | Mobile routes: Today · Routine · Health · Pet · Settings; Food and Grooming live on Pet as "usual places" | Move Food/Grooming into Pet; add Routine tab. Settings stays behind the Pet tab's gear (keeps 4 tabs) | Mechanical (layout) |

## Decisions for Eyup

1. **A16–A19 (2026-11-23): cut for the MVP.** Food run-out and delivery log, groomer visit time,
   history and cadence, the weight chart, and pet sex, spayed, microchip and personality chips are
   off the MVP canvas. Allergies and quirks go into free-text care notes. Eyup asked to keep the
   original screens as ideas: they are on the "Ideas (after the MVP)" canvas, unchanged.

## What changed on the MVP canvas (2026-11-23)

- **Edited (28):** O2 dog or cat only; O3/C1 no photo, sex or spayed; O6 email code, no
  password; O6a code step; L1 log in with a code; O7 in-context permission; O8 copy; O9 owner-only
  link invite; Today and cat Today: no confirm-email banner, "Done by Ana · 07:58", yesterday row,
  rest day, walks count for the dog streak, "Coming up" without run-out; Profile/cat: care notes,
  no chips, no library link; Health/cat: "Call your vet", current weight only, no summary;
  Food/cat: no run-out ring, delivery log or reminder; Grooming: next visit date only; Share card:
  vet and contacts switches, note, language, warning, no expiry; Care card web: read-only "Marked
  done", neutral copy, no 24 h clinic, microchip or app promo; Streak/cat copy; Settings: no theme,
  nudge + quiet time, Household and Care card links rows, no export; Privacy choices: usage stats,
  crash reports, product news; Account: no password or devices; Delete account: household
  consequences; States: no household, needs a connection, link turned off.
- **New (7):** N1 your name, N2 consent, N3 join sheet, N4 household (owner view), N5 care card
  links, N6 edit a task (streak marker, my reminder, pause, remove), W web pages (invite landing,
  deletion explainer, privacy notice).
- **Parked (titles start with "Parked"):** forgot password, emergency vet, info library, data
  export, dark Today, dark Profile.
- **Canvas notes** updated: streak rules, sign-in, settings, partners, vet finder, info library.

## Follow-up (23 Nov, later)

- **C6 tab bar, done:** Today, Today (cat), Health, Health (cat), Profile, Profile (cat), Food,
  Food (cat), Grooming and Settings now show Today · Routine · Health · [Pet] · Settings. Food and
  Grooming highlight the Pet tab and open from Profile's "usual places"; Grooming's back button
  returns to the pet. The gear on Profile and the back button on Settings are gone, since
  Settings is a tab.
- **B8 Routine list, done:** new artboard N7 lists every task in Today's order with its time,
  repeat, streak flame, "my reminder" bell and "Paused" label. "+" opens a sheet (meal, walk,
  medicine, something else) that leads to the task editor (N6). "Reorder" switches each row to
  up and down buttons that announce the new position, so reordering works without dragging.
  N6's back button now returns to the Routine list.

## Still open on the canvas

- **B4 member view, B13 nudge offer, B11 "You've been signed out":** described in notes on N4,
  States and the platform design, not drawn as separate screens.
- Polish copy is not on the canvas; the JSON files will hold it.
