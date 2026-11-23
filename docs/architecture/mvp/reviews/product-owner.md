# 03 — Product owner review: MVP architecture, user-visible effects

- **Reviewer:** product-owner (agent) · **Date:** 2026-11-22 · **Issue:** #5
- **Inputs:** spec Decisions, `docs/specs/001-mvp/spec.md` (approved), `docs/architecture/mvp/mobile.md`,
  `docs/architecture/mvp/backend-sync.md`, `docs/architecture/mvp/platform-services.md`, ADR drafts 0001–0026.
- **Lens:** `ux-review` (user value, flow, copy, a11y, what architecture means for the owner) against
  `pet-os-context` (MVP ≤100 users, 1–3 builders, no guilt copy, pet first).
- **Evidence status:** everything below is "we think". No interview or prototype-test data exists
  yet (G1 interviews run Nov–Dec). Where a ruling hinges on a guess, it says what to watch in the beta.

## UX review: MVP architecture (mobile, backend/sync, platform services)

**Verdict: ship with changes.** The shape is right for a household at 7 am: offline-first ticks,
household-day maths, a server-owned streak, local reminders, a script-free care card, no visible
partner pushes. Eyup's change (dog streak includes walks) is applied consistently in all three
drafts. Nine must-fixes (mobile 4, backend 2, platform 3; M-4 and B-M2 are one issue seen
from two sides), all small, mostly where two drafts disagree in a way the owner would feel
(undo that silently comes back, a join flow that can delete pets or leave a household without
asking, no typable invite code).

### What works

- **Morning rush passes.** Today is the default tab on the current pet; a tick is one tap after
  launch, written locally, no spinner, no network wait (mobile §3.1). Sync state is a quiet line
  ("Saved on this phone — will sync"), never an error.
- **No error dialogs on conflicts.** Both offline acceptance cases resolve quietly by construction
  (backend §6.3 A/B). 4xx rejections are dropped from the queue without bothering the user.
- **Household day + DST** is owned in one place and fixture-tested on both sides. No DST-weekend
  streak loss.
- **Late ticks repair the streak** (backend §6.3 D), including refunding a paw pass. Owners who
  logged in a cellar are not punished.
- **First-day neutral** (a dog added at 21:00 doesn't start with a miss) — a small, kind rule.
- **Bilingual by data:** `template_key` + optional title, so a PL/EN household each see their
  own language. Plural check in CI.
- **Accessibility plumbing** lives in primitives (label required at type level, announce after
  tick, focus kept on the row, native true-modal sheets, contrast CI).
- **Consent** screen after account, all off, "Not now" equally prominent, nothing initialised
  before opt-in.
- **Notification permission asked in context**, never at launch; no "Mark done" on notifications
  (prevents double feeding from the lock screen). Right call.
- **Calm sheets.** I accept OS sheet timing instead of the canvas 220 ms (ADR 0002): native,
  familiar, true modal. Motion budgets still apply to tick, progress and celebration.

---

## Rulings on the questions raised

| # | Question | Ruling | Owning architect(s) |
|---|---|---|---|
| R1 | No ticking before sign-up | **Upheld.** Pet + routine (editable) visible pre-account; ticking needs an account. | Mobile, backend |
| R2 | Tick credit: first tapped vs first synced | **First tapped** (`client_at`, ADR 0014). The post-sync flip is silent. | Mobile (must align), backend |
| R3 | Rest days with no monthly limit | **Upheld, no limit.** Rest days bridge but never add, so there's nothing to game. | Backend, platform |
| R4 | Dog template: two "any time today" walks counting toward the streak | **Upheld** (Eyup's decision). Walk count editable in the preview; flag read-only in MVP. | Mobile, backend, platform |
| R5 | No visible "Partner fed Luna" pushes, silent sync only | **Upheld.** | Platform |
| R6 | Reminders follow household tz when a member travels | **Upheld for task times; quiet time follows the device.** | Platform |
| R7 | Care card shows today's done status without names | **Upheld,** with "marked done" wording, never "not done". | Platform (web copy), backend |
| R8 | One active household per user | **Upheld for MVP,** but leaving a household must never be silent. | Backend, mobile |
| R9 | Joining when you already have pets | **Bring pets by default; no delete option inside the join flow.** | Backend, mobile |
| R10 | Partners must be beta testers (TestFlight friction vs G1 ≥40%) | **Accept invite-only,** but add a typable code, a guided landing page, pair recruitment and a split G1 metric. | Backend, platform, mobile; Eyup |
| R11 | Neutral copy when the streak resets | **Required.** Inline, no modal, no push, best streak kept. | Mobile (copy keys), platform (events) |

Detail for each ruling:

**R1 — No ticking before sign-up.** The "aha" in the pet-first funnel is *seeing Burek's day laid
out*, not ticking one meal. Ticking without an account would create "You" ticks with no actor, a
merge path for events and attribution, and server-side anonymous users — real cost for a two-screen
funnel. Conditions: (a) the routine preview is editable (remove/add a walk) and reads like Today, so
the account step feels like "Save Burek's routine", not a wall; (b) if the account step fails
offline, the draft stays and the copy says "Connect to save — nothing is lost"; (c) a partner who
arrives through an invite never sees pet creation (see M-3). Watch in beta: drop-off between
routine preview and account.

**R2 — First tapped.** The person who actually fed Luna should get "Done by". `received_at` would
credit whoever found signal first, which is arbitrary from the owner's view. Accept the visible
flip from "Done by You" to "Done by Ana" after sync, but it must be **silent**: no animation, toast
or announcement for the person whose credit moved. The mobile draft currently implements *first
synced* (deterministic v5 id + `ON CONFLICT DO NOTHING`) — see M-1.

**R3 — Rest days, no monthly limit.** Because a rest day bridges but never extends the streak
(backend §5.1), unlimited rest days can't inflate a streak; they only protect one. A limit would
add a counter, an "out of rest days" state and guilt pressure — the opposite of the canvas. Keep
today + yesterday as the marking window. A rest day cancels that day's streak nudge (S-P3) but not
task reminders (the sick dog still eats). Watch: `rest_day_marked` per pet per month; if many pets
sit above ~8, look at the walk rule before adding a limit.

**R4 — Two any-time walks count.** Eyup set it ("dog streak should include walks"); all three
drafts apply it. UX conditions: (a) the routine preview shows the two walks with a one-tap remove,
so a garden dog or a once-a-day household fixes it before day one rather than after the first
miss; (b) "Counts toward the streak" is shown read-only in the task editor (mobile §3.5). The
backend's "editable per task" is a data capability, not a MVP control — no user toggle (S-B3);
(c) "any time today" walks still need sensible reminder times when turned on (S-P2); (d) progress
copy avoids jargon (S-M3). Watch: share of dogs that delete a template walk in week one, and
whether walk ticks come mostly from the non-creator (they should, it supports G1).

**R5 — Silent sync only.** "Partner fed Luna" pushes would be several notifications a day per
household against a one-nudge-a-day promise, and nobody asked for them. The value (no double
feeding) is delivered by Today's "Done by …" plus the silent push cancelling stale reminders.
Condition: reminder copy points to Today ("check Today") rather than commanding the action, because
silent pushes are best effort (S-P4).

**R6 — Household time zone.** The pet is at home; the at-home partner needs Warsaw times, and the
"day" must be one shared day per pet. A traveller receiving "08:00 Warsaw" reminders is mostly a
nudge they can switch off. But **quiet time is about the person's sleep**, so evaluate it in the
device's current zone; otherwise a member in New York is woken at 02:00 (S-P1). Show times in the
app with a small "Warsaw time" label when device tz ≠ household tz (S-M5).

**R7 — Done status on the care card, no names.** A sitter's first question is "was she fed this
morning?". Names add nothing for a sitter and leak who's home. Wording is the catch: sitters don't
tick (answer 2), so on a day the sitter is in charge every task stays unmarked all day. Never
"Not done", "Missed" or "Overdue"; use "Marked done" for done tasks and nothing (or "Not marked
yet") otherwise, plus one line: "The family marks tasks in the Pet OS app" (P-M2).

**R8 — One active household per user.** Fine for ≤100 Warsaw households; multi-household (adult
child helping parents' dog) is a later learning, not MVP work. But backend `accept_invite`
currently **silently leaves** a household that still has other members (§8.2 step 4). Leaving
people and pets behind must be an explicit, named confirmation (B-M2, M-4).

**R9 — Joining with pets.** Default: the joiner's pets come along (sole member), history and
streaks intact via `ON UPDATE CASCADE` — good. Remove `p_bring_pets = false` as "delete my old
household": deleting pets and their history must never be a side effect of accepting an invite
(B-M2, M-4). Likely real case: both partners installed separately and created the same dog. Offer
per-pet "Bring along" with a same-name hint ("Ana's household already has a dog called Luna — is it
the same dog?"); a pet left out is deleted only after an explicit, named confirmation (S-B2).

**R10 — Partners as beta testers.** On iOS the partner path today is: tap link → web page →
install TestFlight → open public link → install Pet OS → go back to the chat → tap the link again →
sign in. That is 7–8 steps and two installs, and it measures distribution friction, not care
pain — which is what G1 is meant to test. Accept the invite-only beta (Eyup's decision), and:
(a) add a short typable invite code — mobile expects one, backend returns only a 256-bit URL
token (B-M1); (b) the landing page is a per-platform, numbered guide ending with the code (S-P5);
(c) recruit beta households as pairs so both partners are testers from day one (Eyup, Q1); (d)
measure the funnel separately: invite created → landing opened → accepted, and read G1 primarily on
**invite created within 7 days**, with acceptance as a secondary number (P-M3). Invite validity of 7
days is enough; keep it.

**R11 — Neutral reset copy.** No "lost", "broke", "missed", no red, no sad pet, no push, no modal.
Inline on Today at next open: EN "New streak starts today · Best: 23 days", PL "Nowa seria zaczyna
się dziś · Najlepsza: 23 dni" (plural via i18n). Paw pass use is informative and quiet: "A paw pass
covered Tuesday". Don't announce "1 paw pass left" as a warning. Because a late sync can reverse a
reset (backend §6.3 D), a reset must not be a dramatic moment, and any reversal stays silent
(mobile §3.5 already says "server wins silently" — keep it). Owner: mobile for `streak.*` keys;
platform keeps `streak_reset` as an analytics event only.

---

## Findings by owning architect

### Mobile architect

| # | Severity | Issue | Why it hurts the user | Suggested change |
|---|---|---|---|---|
| M-1 | **MUST-FIX** | Ticks use deterministic `uuidv5(task, date)` + `ON CONFLICT DO NOTHING`, and undo = local DELETE (§3.4, ADR 0004/C-B4). Backend ADR 0014 makes ticks insert-only, random ids, undo = insert, and clients have **no DELETE grant**. | As written, an undo uploads a DELETE → `42501` → discarded → **the tick silently reappears** after sync. Credit also goes to first *synced*, not first *tapped* (R2). | Adopt ADR 0014: random UUIDv7 ids, `action: done/undo`, fold via `@petos/streak`. Drop C-B4's tick lines. |
| M-2 | **MUST-FIX** | Undo of someone else's tick is a one-tap action. | Bartek, on a stale screen, can untick Ana's breakfast; the dog gets fed twice — the core pain we exist to remove. | Own tick: instant undo. Another member's tick: one confirm, "Ana marked this done at 07:58. Mark as not done?". Backend §6.3 C asks for this too. |
| M-3 | **MUST-FIX** | The invite path for a brand-new partner is ambiguous: §4 step 3 still mentions "the draft pet (if any)" after an invite, which implies the onboarding funnel may run first. | Every extra screen before "you're in" costs G1. A partner should not be asked to create a dog that already exists. | `invite/[token]` without a session → "Join Ana's household" → sign in → consent → Today with the household's pets. No pet-new, no routine preview. Target ≤4 screens after install. |
| M-4 | **MUST-FIX** (shared with backend) | No confirm UI specified for leaving the current household on join (R8) and the join sheet offers discarding pets (R9). | Silent loss of a shared household or pet history. | Join sheet states the consequence by name: "You'll leave 'Kowalski home'. Burek stays there with Tomek." / "Burek comes with you, with his history." |
| S-M1 | SHOULD | Today "shows yesterday for late logging" (backend §5.4); mobile doesn't say how. | A permanent yesterday list doubles the morning screen. | A collapsed "Yesterday" row, shown only while yesterday has open streak tasks. |
| S-M2 | SHOULD | The account step can be offline. | A failed sign-in that looks like data loss kills trust at the first moment. | Keep the draft; copy "Connect to save Burek's routine — nothing is lost". |
| S-M3 | SHOULD | Progress label "streak tasks: 3 of 5". | Jargon; the owner thinks in "today's care", not task classes. | e.g. "3 of 5 done for the streak" / PL with plural forms; marker on counting rows, not colour alone. |
| S-M4 | SHOULD | Celebration de-dup is per device only. | Fine; just confirm the partner also sees a (smaller) milestone moment on their phone — celebrations are shared household wins. | Keep per-device flag; both members celebrate once each. |
| S-M5 | SHOULD | Times when device tz ≠ household tz. | A traveller sees "08:00" with no context. | Small "Warsaw time" label only in that case. |
| S-M6 | SHOULD | Household tz is not editable anywhere in the route tree. | A family relocating (or a wrong default at creation) has no way out. | Settings → Household → Time zone (members can already write it, backend §3). |
| — | Ruling | O6: claim `/c/*` as an app link? | — | **Agree with mobile: don't claim it.** See P-M1. |

### Backend/sync architect

| # | Severity | Issue | Why it hurts the user | Suggested change |
|---|---|---|---|---|
| B-M1 | **MUST-FIX** | `create_invite` returns only a 256-bit URL token; mobile and the landing page rely on a typable code. | Without deferred deep linking, a partner who installs via TestFlight/Play must find the chat and tap the link again; a code is the reliable fallback (R10). | Add `code`: 8 chars from an unambiguous alphabet, single use, 7 days, attempt rate limit in `accept_invite` (privacy reviewer to check strength). |
| B-M2 | **MUST-FIX** | `accept_invite` silently leaves a household that has other members, and `p_bring_pets = false` deletes the sole member's household with its pets and history. | Destructive side effects of tapping a friendly link. | Replace the boolean with an explicit, previewable choice: a read-only `preview_invite(token)` returns what will happen (household name, members, the caller's pets); `accept_invite` requires `p_confirm_leave` when others remain. Deleting pets is not a join option (see S-B2). |
| S-B1 | SHOULD | Credit by `client_at`. | — | **Confirmed (R2).** Keep the clamp to `now()`. |
| S-B2 | SHOULD | Duplicate pets when both partners pre-created the same dog. | Two "Luna"s on Today, two streaks. | Per-pet "Bring along"; a left-out pet is deleted only after a named confirmation; same-name + same-species hint. |
| S-B3 | SHOULD | §3.2 says `streak_critical` "can be edited per task later". | A per-task toggle in MVP would let owners shrink the streak until it means nothing, and adds a control nobody asked for. | Keep the flag as data; no client write path in MVP (trigger derives it from kind). Matches mobile §3.5. |
| S-B4 | SHOULD | Rest day rules. | — | **Confirmed (R3):** no monthly limit, bridges not extends, today + yesterday. |
| S-B5 | SHOULD | Removed member whose pets came in via "bring pets" loses access to them. | Rare but painful (a couple splitting). | No MVP build; question for Eyup (Q3). Removal copy stays neutral. |
| S-B6 | SHOULD | "Former member" label on anonymised ticks. | — | Fine. Keep it neutral; never "Deleted user". |

### Platform-services architect

| # | Severity | Issue | Why it hurts the user | Suggested change |
|---|---|---|---|---|
| P-M1 | **MUST-FIX** | M8 claims `/c/*` as a universal/app link for "own card preview". | A sitter who uses Pet OS for their own cat taps the card link and lands in the app, which can't show another household's card. Breaks the one job the card has. | Claim `/i/*` only. Owner preview opens the card in the in-app browser / system browser. |
| P-M2 | **MUST-FIX** | Care card done status wording (R7) is not specified; B4 just says `done: bool`. | "Not done" next to breakfast the sitter just served reads as an accusation, or as wrong data. | `web.careCard.*`: "Marked done" / no marker (or "Not marked yet"); one line explaining the family marks tasks in the app; never "missed/overdue". |
| P-M3 | **MUST-FIX** | G1 is read only from `household_invite_accepted`. | Tester friction (R10) depresses acceptance, so we could reject a real pain on distribution noise — a gate decision risk. | Report G1 as **invite created within 7 days** (intent) plus acceptance rate; add a privacy-safe count of `/i/` landing views (no IP, like the card `view_count`). Event plan already has `household_invite_created`; add the landing counter and the definition. |
| S-P1 | SHOULD | Quiet time evaluated in household tz (§3.2 rule 4 with §3.5). | A travelling member is woken at night. | Evaluate quiet time in the device's current zone; task fire times stay in household tz. One extra input to the planner + fixture. |
| S-P2 | SHOULD | "Any time today" reminders default to 18:00 per member. | Turning on reminders for both template walks gives "Morning walk" at 18:00 and two pings at once. | Template-level default remind times (e.g. morning walk 09:00, evening walk 19:00, carried as data on the template); member can change. |
| S-P3 | SHOULD | Planner rule 5 doesn't mention rest days. | A nudge on a day marked as rest feels like nagging. | Rest day = day complete for the nudge (fixture). Task reminders unaffected. |
| S-P4 | SHOULD | Example reminder text "Breakfast for Luna, 08:00". | With best-effort silent sync, a command-like reminder can still trigger double feeding. | Body ends with a pointer, e.g. "Breakfast for Luna · check Today" / PL equivalent; keep neutral. |
| S-P5 | SHOULD | `/i/:token` landing content. | The page carries the whole install burden. | Numbered steps per platform (TestFlight first on iOS; Play testing opt-in on Android), the invite code in large type with copy button, EN/PL, "Ana invited you to care for Luna" — first name only, no surname. |
| S-P6 | SHOULD | Streak nudge "offered during onboarding" (§3.1). | Onboarding is already welcome → pet → routine → account → consent; another ask now is premature. | Offer the nudge in context after the first completed day, with the pre-prompt. |
| S-P7 | SHOULD | Consent screen describes three switches in mobile, "two + one" in platform. | — | Same thing; ensure the one-line explanations are plain and tested in PL at 200%. |

### Cross-draft disagreements I rule on (user-facing only)

| Topic | Mobile | Backend | Platform | Ruling |
|---|---|---|---|---|
| Tick model / credit | v5 id, first synced, delete undo | events, first tapped | — | Backend (M-1, R2) |
| Care-card token storage | either | plaintext, re-share from any phone | hash only, rotate to re-share | **UX prefers plaintext** (re-sharing must not break the sitter's link). Privacy reviewer decides. |
| `/c/*` app link | don't claim | — | claim | Mobile (P-M1) |
| `streak_critical` editability | derived, read-only | editable later | reads flag | Read-only in MVP (S-B3) |

### Questions for Eyup

1. **Pair recruitment:** can we recruit beta households as pairs (both partners added as
   TestFlight/Play testers up front)? It's the cheapest fix for R10 and costs no code.
2. **G1 definition:** OK to read G1 on *invite created within 7 days* (≥40%) and report acceptance
   alongside, given tester friction?
3. **Pets brought into a household:** if that member is later removed, the pets stay with the
   household (MVP). Acceptable for the beta?
4. **Multi-pet mornings (design, not architecture):** with 2+ pets, ticking breakfast for each
   needs a pet switch per pet. The data model supports an "all pets" Today; worth testing in the
   prototype before we commit to per-pet only?
