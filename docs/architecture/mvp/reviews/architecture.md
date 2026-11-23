# 03 — Architecture review: Pet OS MVP (phase 3)

- **Reviewer:** architecture-reviewer (agent) · **Date:** 2026-11-22 · **Issue:** #5
- **Read side by side:** the Decisions section of `docs/specs/001-mvp/spec.md`, `docs/specs/001-mvp/spec.md` (approved,
  answer 6 = dog streak includes walks), `docs/architecture/mvp/mobile.md` (C-B1–C-B9, C-P1–C-P10),
  `docs/architecture/mvp/backend-sync.md` (S1–S10, B1–B10 answers), `docs/architecture/mvp/platform-services.md`
  (M1–M10, B1–B9), ADR drafts 0001–0026, `pet-os-context`.
- **Nothing in the drafts or `docs/` was edited.**

## Architecture review: Pet OS MVP (mobile + backend/sync + platform services)

**Verdict: consistent with fixes.**

The stack, the ownership lines and most of the boundaries agree: one household time zone,
server-owned streak with a provisional phone value, local-first reminders, consent-gated SDKs,
a script-free Worker care card, no anonymous auth, a device draft for onboarding. The three
drafts disagree on the **wire contract**, though, and several of those disagreements would
**silently drop user data** because both sides agreed to discard rejected uploads without an
error (mobile §3.3, backend §6.2). Examples: mobile's generic `PUT → upsert` against backend's
column grants, mobile's random ids on rows backend keys deterministically, and mobile's queued
care-card insert against backend's RPC-only grants. None of this needs a redesign. It needs one
agreed table-by-table contract (this review proposes the winners) and the fixes below before
anyone writes a migration.

Design-time only: nothing here was run against a live Supabase or PowerSync instance.

---

## 1. Rulings on the known disagreements

### R1. Tick ids: deterministic UUIDv5 (mobile) vs random ids with an event fold (backend)

**Both models meet the spec acceptance** ("same task ticked by both offline → shows once,
credited to one person, no error"). Backend's objection ("a v5 id would silently drop the second
tick and make undo impossible") holds only under backend's own grants, which revoke `DELETE` on
`tick`. Mobile's model undoes with a `DELETE`. Combine the two drafts as written and **every undo
fails**: the `DELETE` gets `42501`, the connector discards it, and the tick comes back on the next
sync. That combination is the real bug.

| | Mobile: v5 id, one row per `(task, date, slot)`, undo = delete | Backend: random id, insert-only events, fold by `(client_at, id)` |
|---|---|---|
| Same task, both offline | Same id, `ON CONFLICT DO NOTHING`, first **uploader** credited | Two events, first **tapper** credited (by device clock) |
| Reading "is it done?" | `EXISTS` | Fold, in TS (Today, planner, provisional streak) **and** SQL (streak, care-card RPC, B10 views) |
| Undo races | Last **upload** wins | Last **tap** wins (by device clock; skew loses races, ADR 0014 "known edge") |
| Extra machinery | Unique key, `DELETE` grant + guard, `AFTER DELETE` triggers | `action` column, fold in 2 languages × 5 readers, `client_at` clamp, shared fold fixtures |
| Audit trail | No | Yes (not required by the spec) |

**Recommendation: adopt the mobile model (deterministic v5 id, one row per key).** It is the
smaller system for a 1–3 person team at ≤100 users. Every reader becomes "a row exists", the
platform planner's rule 3 ("skip if a tick exists") becomes correct as written, the clock-skew
edge case goes away, and the fold leaves the shared fixtures (the streak fixtures stay). "Credit
to the first uploader" satisfies "credited to one person". Changes, owned by **backend-sync**
unless noted:
1. `tick`: drop `action`, add `unique (task_id, local_date, slot)`, `id = uuidv5(NS_TICK, task_id|local_date|slot)` with the namespace and string format in the shared package. Rename `client_at` → keep as `done_at` or keep `client_at` (see R4) and keep the `least(…, now())` clamp only for display.
2. Grant `DELETE` on `tick` to members under RLS. Add a `BEFORE DELETE` guard that ignores deletes outside the open window (`RETURN NULL`). Add an `AFTER DELETE` streak-recompute trigger for past dates, and fire platform B3's "sync now" on delete too (platform B3 already says insert/delete).
3. Keep `tick_before_insert` (task/pet/household check, window, `actor_id := auth.uid()`). It runs before conflict detection, so the inserted row is always credited from the JWT.
4. Supersede ADR 0014 with "ticks are one row per task-day with a deterministic id". Mobile ADR 0004 stays.
5. **Mobile:** a local tick must be `INSERT OR IGNORE`-safe. A synced row with the same id may already exist locally if the screen rendered just before a checkpoint.

If Eyup prefers the event log (audit trail, first-tapper credit), then mobile switches to random
ids and undo-as-insert, and **platform** changes planner rule 3 to "folded state is done". Either
way, **one** ADR must win. Today 0004 and 0014 contradict each other.

### R2. Care-card links: claim `/c/*` as universal/app links (platform M8) or web only (mobile)

**Recommendation: web only (mobile).** The spec's user for `/c/*` is a sitter with no account.
A sitter or neighbour who has Pet OS installed for their own pets would be pulled into their own
app instead of the card, and the app has no screen for someone else's card. The owner can preview
the card in the browser (the app's share sheet can open it with `openBrowserAsync`).
**Owner: platform**: change M8 and the AASA/assetlinks to `/i/*` only; drop "/c/* (own card
preview)" from §8.2.

### R3. Care-card token: hashed (platform B4, ADR 0024) vs plaintext readable by members (backend ADR 0018)

**Recommendation: plaintext, member-readable (backend ADR 0018), with three guards.** The spec
needs "unguessable" and "turn off at any time", and both designs give that. A hash protects
against a database or backup leak, but the card shows a subset of data that the same leak already
exposes. A hash would also force "rotate to share again", which kills the link the sitter already
has. That is a worse UX for no real protection at this scale. Guards:
- RLS keeps the token readable by **active members only** (already true via the household stream), and `beforeSend`/log redaction strips `/c/<token>` everywhere (platform §6 and §8.3 already do this).
- **Removing a member doesn't revoke existing cards.** The removed member may have the link. The remove-member sheet should offer "Also make new care-card links" (rotate). **Mobile (UX) + backend** (`rotate_care_card_link` already exists).
- Privacy reviewer signs off (backend open question 5).

**Owner: platform**: update B4 (lookup by `token`, not `sha256`), §8.3 step 2 and the ADR 0024
consequence "only the hash is stored". Keep the Worker's ≥22-character format check; 256-bit
tokens pass it.

### R4. Field naming and other contract mismatches

**Backend owns the data model, so backend's names win** unless noted. Mobile's C-B1 and
platform's B1 must be rewritten to backend §3/§11 (singular tables: `household`, `household_member`,
`pet`, `task`, `tick`, `rest_day`, `streak_day`, `medication`, `health_record`, `vet_contact`,
`pet_place`, `care_card_link`, `reminder_pref`, `profiles`, `notification_settings`). Tick fields:
`actor_id` (not `done_by_user_id` / `done_by`) and `client_at` (not `done_at` / `created_at`).
The full list is in §2 and §3 below. Three of them lose data, so they are MUST-FIX (M-1, M-2, M-3).

### R5. Streak: provisional phone value vs server-owned; rest days with no monthly limit

**Server-owned stays (ADR 0016).** All three drafts agree on that, but they disagree on the details:
- **Rest-day semantics differ.** Mobile's `isDayComplete` treats a rest day as complete, so the provisional streak shows **+1**. Backend's rule makes a rest day **bridge without extending**. The phone would show 8, and after sync the server would say 7. **Adopt backend's rule.** Mobile changes `isDayComplete`: a rest day is not complete; it only protects the chain.
- **Scope of the provisional value.** Mobile computes `current_length + 1 if today complete`. Backend computes provisional for **today plus any days the server hasn't closed yet** (e.g. offline since yesterday). Mobile's rule is wrong when yesterday isn't closed. **Adopt backend's `provisionalStreak(lastStreakDay, openDays…)`** from one shared package.
- **Never show a drop from a provisional value** (mobile §3.5 already says so). Milestone celebrations may fire from the provisional value (mobile), and analytics milestone events come from server data (see P-3).
- **Rest days, no monthly limit: accept for the MVP, but allow marking for *today only*.** Rest days don't extend the streak, so unlimited rest days can't inflate the G3 "7-day streak" gate. Backend's "today and yesterday" window, though, lets a user turn yesterday's miss into a rest day after the fact. That gives unlimited paw passes and empties the spec's "max 2/month; the third miss resets" rule. Today-only removes that loophole with no counter. Track `rest_day_marked` (already in the event plan) to learn if a limit is needed. **Owner: backend** (window), **mobile** (UI); product owner adds one line to the spec.

---

## 2. Boundary mismatches

| # | Producer ↔ Consumer | Mismatch | Fix | Owner |
|---|---|---|---|---|
| 1 | Backend ticks (ADR 0014) ↔ Mobile ticks (ADR 0004) | v5 ids + undo = `DELETE` vs random ids + undo = insert; backend revokes `DELETE`, so every mobile undo is discarded | R1 | backend-sync (+ mobile R1.5) |
| 2 | Backend grants (§11) ↔ Mobile connector (§3.3) | Mobile maps every `PUT` to `upsert`. Backend allows plain `insert` only for `household`, `household_member`, `pet`, `task`, etc., and grants column-level `UPDATE` only (`household(name,timezone)`, `household_member(display_name)`). PostgREST's upsert is `ON CONFLICT DO UPDATE SET <all columns>`, which needs `UPDATE` on every column → `42501` → discarded → **the onboarding household never reaches the server** | Connector follows backend §6.2 table by table (insert / upsert / ignore-duplicates). Add a connector test per table against local Supabase | mobile |
| 3 | Backend deterministic ids ↔ Mobile id policy | Backend uses v5 ids for `rest_day`, `pet_place (pet_id,kind)`, `vet_contact (= household_id)`, `reminder_pref (user_id,task_id)`, `notification_settings (= user_id)`. Mobile generates UUIDv7 for all but ticks and rest days. Two members (or two devices) setting the groomer offline → `23505` on `unique(pet_id, kind)` → **silently discarded** | Mobile adopts backend's v5 list. Namespace constants and the exact key string (`a|b`) live in one shared package. Backend's server-side `streak_day` v5 uses `p_pet::text || d::text` (no separator), which must match or use `gen_random_uuid()` | mobile; backend (string format) |
| 4 | Backend care card (§9) ↔ Mobile care card (C-B1, C-B8) | Mobile creates cards with a **queued insert** (client token) and turns them off with a queued `update enabled`. Backend revokes `INSERT` and allows create/rotate/revoke only through online RPCs → the card is discarded and the sitter gets "no longer available" | Mobile uses `create_care_card_link` / `rotate_…` / `revoke_…` (online, "needs a connection"). Field mapping: `enabled/disabled_at` → `revoked_at`; `show_owner_contacts` → `owner_contacts jsonb` (empty = hidden); `show_notes` → `note` | mobile |
| 5 | Backend bootstrap (§8.1) ↔ Mobile C-B3 | Mobile expects a **server trigger** to add the creator as member. Backend expects the **client** to insert the bootstrap `household_member` row (RLS `can_bootstrap`), with no `RETURNING`. Neither does both, so the following `pet` insert fails RLS | Adopt backend's: the client inserts `household` (with `created_by = uid`) then `household_member`, then pet and tasks, in one transaction | mobile |
| 6 | Mobile upload error policy (§3.3) ↔ Backend S4 | Mobile discards on "permanent 4xx". PostgREST returns **401** for an expired JWT and 4xx for other transient states. **Discarding on 401 loses offline ticks** after a long offline stretch | Classify by SQLSTATE as backend S4 says (`22xxx`, `23xxx`, `42501` discard). Retry on 401 after a token refresh, on 408, 429 and 5xx, and on network errors | mobile |
| 7 | Backend `task` removal ↔ Mobile C-B1 | Mobile deletes tasks. Backend says "remove = `ends_on`" but its RLS pattern still grants `DELETE` on `task`, and `tick.task_id` is `ON DELETE CASCADE`, so a delete wipes ticks and can rewrite re-opened streak days | Backend revokes `DELETE` on `task` (or drops the delete policy). Mobile "remove" sets `ends_on = today-1` | backend-sync; mobile |
| 8 | Backend `profiles` SQL ↔ Platform B9 / Mobile C-P4 | Platform B9 has `consent_crash_reports`. Backend says "as specified", but the SQL sketch **omits the column** → the crash-consent sync fails | Add `consent_crash_reports boolean not null default false` | backend-sync |
| 9 | Backend `streak_day` ↔ Mobile `streaks` | Mobile expects one row per pet (`current_length, best_length, last_counted_date, paw_passes_used_month`). Backend writes one row per pet per day (`outcome, streak_after, passes_used_in_month`), with no best | Mobile reads the latest `streak_day` per pet. Best = `max(streak_after)` (local query) if the UI needs it | mobile |
| 10 | Backend streak rules ↔ Mobile `isDayComplete` | Rest day = complete (+1) vs bridge; provisional for today only vs for all unclosed days | R5 | mobile |
| 11 | Backend `task` ↔ Mobile `routine_tasks` / Platform planner input | `category`→`kind` (`other`→`custom`); `custom_title`→`title`; `schedule_kind`+`time_local`→`time_of_day` (null = any time); `repeat_every_days`→`every_n_days`; `start_date`→`anchor_date`; `feeding_amount`→`amount`; **`ends_on` missing** in mobile and in platform's planner input (backend flagged it) | Rename in mobile C-B1 and platform M1. Planner and `isDayComplete` honour `ends_on` | mobile; platform |
| 12 | Tick field names | `actor_id`/`client_at` (backend) vs `done_by_user_id`/`done_at` (mobile) vs `done_by`/`created_at` (platform B1, B5) | Backend names everywhere (R4) | mobile; platform |
| 13 | Tick open window | Mobile C-B5: today and yesterday, others rejected with 4xx. Backend: `today-2 … today+1`, others silently dropped | Backend's server window and silent drop stand. Mobile UI offers today and yesterday. Mobile C-B5 updated | mobile |
| 14 | Planner ↔ Backend `slot` | IDs `r:<taskId>:<localDate>:<slot>`: mobile says `slot = ""`, backend says `0` (smallint), platform types `slot: string` | `0`, smallint, everywhere | mobile; platform |
| 15 | Platform B3 trigger ↔ Backend B3 answer | Platform: tick insert **and delete**. Backend: insert only ("no deletes exist") | Follows R1: with v5 rows, insert + delete | backend-sync |
| 16 | Card RPC shape: Platform B4 ↔ Backend §9 ↔ Mobile C-B8 | Platform: one `pet`. Backend: `pets[]` (one link, many pets). Mobile: one `pet_id`, and **the Worker computes "today"** from raw tasks + ticks. Platform/backend: the **RPC computes "today"** and returns `done` flags | Single pet per link (the spec says "the pet's essentials"; the other two docs agree). The RPC computes today, reusing the streak SQL's due-set logic, so the Worker doesn't re-implement it. Mobile C-B8 updated | backend-sync (`pet_id`); mobile |
| 17 | Owner contacts on the card | Mobile: from `household_members.contact_phone` (a column backend doesn't have). Backend: `care_card_link.owner_contacts jsonb` typed per card | Backend's (per-card list, max 3). Drop `contact_phone` from mobile | mobile |
| 18 | Card language order | Platform: `?lang` → card `lang` → `Accept-Language`. Mobile: `?lang` → `Accept-Language` → `pl` | Platform's (the card stores `lang`) | mobile |
| 19 | Invite contract | Mobile: `create_invite → { url, code, expires_at }`, typable **code**, `accept_invite(token_or_code)`, separate `leave_household()`. Backend: `{ token, expires_at }`, no code, `accept_invite(p_token, p_bring_pets)`, leave = `remove_member(self)`, and "**flush the upload queue first**" | Drop the typable code for the MVP (backend's "install, then tap the link again" is enough for an invite-only beta). Mobile adds the "Bring your pets?" choice and waits for an empty CRUD queue before `accept_invite` | mobile |
| 20 | Apple token revocation | Mobile: `store_apple_auth_code(code)` once at sign-in. Backend: a fresh code from re-auth at deletion. Apple codes are short-lived, so a code stored at sign-in is useless unless exchanged at once for a refresh token that we then store | Backend's re-auth at deletion. Drop `store_apple_auth_code`. Check that the Apple sheet doesn't break "3 taps" (it's a system prompt; UX to confirm). **Web deletion can't revoke Apple tokens** (no code). Document it as accepted for the beta | mobile; backend-sync |
| 21 | `delete_account` | Mobile: an RPC `delete_account()`. Backend/platform: Edge Function `delete-account` with `{ apple_authorization_code? }` | `functions.invoke('delete-account', …)` as backend S9 says | mobile |
| 22 | Locale storage | Mobile: `user_settings.locale`. Backend: `profiles.locale` (`pl_PL`/`en_US`) plus auth `user_metadata.locale` for email | Drop `user_settings`. Use `profiles.locale` and `updateUser({ data: { locale } })` on change (backend B7) | mobile |
| 23 | `pet` lifecycle | Mobile: soft delete `archived_at`; `vet_contact_id` on pet; `birth_date_is_estimate`. Backend: hard delete (cascade), one `vet_contact` per household, `birth_date_estimated` | Backend's. Mobile ADR 0003 "archived pet fallback" becomes "deleted pet fallback" | mobile |
| 24 | `medication` / `health_record` / `pet_place` | `dose_text`/`active` vs `dose`/`starts_on`/`ends_on`; `date`/`next_due_date` vs `occurred_on`/`next_due_on`; `label`/`next_visit_at` (timestamp) vs `name`/`next_visit_on` (date) | Backend's. Product to confirm that a groomer visit is a date, not a time | mobile |
| 25 | Shared TS packages | Mobile: `@pet-os/domain` (`isStreakCritical`, `isDayComplete`, templates, `planNotifications`). Backend: `@petos/streak`, `@petos/shared`, `routineDefaults.ts` (`foldTicks`, `provisionalStreak`, namespaces). Template keys: `dog.meal.morning` vs `task.dog.walk.morning` | One package, `packages/domain`, owned by mobile, with backend and platform as reviewers of the streak, defaults, namespace and planner modules. One template-key format | mobile (owner); backend-sync, platform (contributors) |
| 26 | `streak_critical` editability | Mobile: derived from category, read-only for the user. Backend: per-task flag "editable later" | Mobile's for the MVP (no edit UI). Backend's seed trigger stays as the guard | — (consistent once noted) |

---

## 3. Findings by owning architect

### Mobile architect

| ID | Level | Finding | Fix |
|---|---|---|---|
| M-1 | **MUST-FIX** | Connector `PUT → upsert` for every table conflicts with backend's grants and loses the onboarding household (table row 2) | Per-table write map from backend §6.2; connector tests against local Supabase |
| M-2 | **MUST-FIX** | Random ids on rows that backend keys deterministically → silent `23505` discards (row 3) | v5 ids for `rest_day`, `pet_place`, `vet_contact`, `reminder_pref`, `notification_settings` from the shared namespace module |
| M-3 | **MUST-FIX** | Care-card create/turn-off as queued writes; the server accepts RPCs only (row 4) | Online RPCs with a "needs a connection" state |
| M-4 | **MUST-FIX** | Household bootstrap relies on a server trigger that backend doesn't build (row 5) | Client inserts the bootstrap `household_member` in the same transaction; no `RETURNING` |
| M-5 | **MUST-FIX** | "Permanent 4xx → discard" drops ticks on an expired JWT (row 6) | SQLSTATE-based classification; retry on 401/408/429/5xx |
| M-6 | **MUST-FIX** | Rest day counts as complete in `isDayComplete`; provisional ignores unclosed days (R5, row 10) | Backend's rules via the shared `provisionalStreak`; fixtures cover it |
| M-7 | **MUST-FIX** | No display-name step. "Done by Partner" needs `household_member.display_name`, but Apple returns a name only on first sign-in, email OTP returns none, and onboarding never asks. With R1, attribution is the core G1 signal | Onboarding or join step "What should the household call you?", prefilled from the provider, written to the member row (bootstrap insert / `accept_invite` param). Coordinate with backend (`accept_invite(p_token, p_bring_pets, p_display_name)`) |
| M-8 | SHOULD | Rename C-B1 to backend's model (rows 9, 11, 12, 13, 17, 18, 22, 23, 24); `task` removal = `ends_on` (row 7) | Rewrite C-B1 from backend §11 |
| M-9 | SHOULD | Invite: drop the typable code, add "Bring your pets?", flush the queue before `accept_invite` (row 19) | — |
| M-10 | SHOULD | Apple revocation and deletion call (rows 20, 21) | Re-auth at deletion; `functions.invoke('delete-account')` |
| M-11 | SHOULD | Local tick insert must tolerate an existing row with the same id (R1.5) | `INSERT OR IGNORE`-style local write in `data/mutations` |
| M-12 | SHOULD | Remove-member flow doesn't mention live care-card links (R3) | Offer "make new care-card links" after removal |
| M-13 | NICE | Shared package naming and template-key format (row 25) | `packages/domain` is the single home |

### Backend/sync architect

| ID | Level | Finding | Fix |
|---|---|---|---|
| B-1 | **MUST-FIX** | Tick model contradicts mobile ADR 0004. As drafted together, undo never works (R1, row 1) | Adopt R1 (v5 row, unique key, `DELETE` grant + window guard + `AFTER DELETE` recompute) and supersede ADR 0014. If Eyup picks the event log instead, mobile and platform change (R1 last paragraph) |
| B-2 | **MUST-FIX** | `profiles.consent_crash_reports` missing from the SQL (row 8) | Add the column |
| B-3 | **MUST-FIX** | `task` still has a `DELETE` policy while removal is `ends_on`; the tick FK cascades (row 7) | Revoke `DELETE` on `task` from `authenticated` |
| B-4 | **MUST-FIX** | Rest-day window "today and yesterday" turns misses into rest after the fact, which defeats "max 2 paw passes" (R5) | Rest-day insert and delete accepted for `today_local` only. Add a fixture |
| B-5 | SHOULD | Who creates the `profiles` and `notification_settings` rows is undefined. Mobile writes consent with `update` and assumes the row exists | `AFTER INSERT ON auth.users` trigger creates both rows (standard Supabase pattern), with `locale` from `raw_user_meta_data` |
| B-6 | SHOULD | `accept_invite` has no display name (M-7) | Add `p_display_name` |
| B-7 | SHOULD | RPC errors aren't a contract. Spec need 12 requires bilingual errors ("invite expired", "household full", "already a member", "link turned off") | Each RPC raises a stable code (`P0001` + `message = 'invite_expired'` …) that mobile maps to `app.error.*` keys. Add the list to §11 |
| B-8 | SHOULD | Care card multi-pet `pet_ids[]` goes beyond the spec and the other two drafts (row 16) | Single `pet_id`. Multi-pet becomes a later, additive change |
| B-9 | SHOULD | B3 "sync now" trigger must also fire on tick delete (row 15, follows R1) | — |
| B-10 | SHOULD | Apple revocation is impossible on the web path (row 20) | State it in §8.4 and the deletion page copy; accepted for the beta |
| B-11 | NICE | `streak_day.id` v5 on the server uses `pet||date` with no separator and needs `uuid-ossp` | Use `gen_random_uuid()` and upsert on `(pet_id, local_date)`, as the draft already allows |
| B-12 | NICE | `household.last_closed_date` syncs to every client | Harmless; or leave it out of the stream query |

### Platform-services architect

| ID | Level | Finding | Fix |
|---|---|---|---|
| P-1 | **MUST-FIX** | Card token hashed in B4 / §8.3 / ADR 0024 contradicts backend ADR 0018 (R3) | Plaintext lookup by `token`; update ADR 0024 consequences |
| P-2 | **MUST-FIX** | M8 and AASA/assetlinks claim `/c/*` (R2) | `/i/*` only |
| P-3 | SHOULD | Streak analytics events fired "from the device whose sync first observes the server change", with `$insert_id` cross-member dedupe (**unverified** for RN). Fragile, and duplicates backend B10, which derives the same G3 numbers from `streak_day` in SQL | Drop the `streak_day_completed`, `paw_pass_used` and `streak_reset` client events. Read G3 streak metrics from the B10 views (privacy reviewer confirms, as for G2 `view_count`). Keep `streak_milestone_reached` only if UX wants it |
| P-4 | SHOULD | Planner input uses `done_by`/`created_at`, `timing.type`, `slot: string`, and lacks `ends_on` (rows 11, 12, 14) | Use backend's names; `ends_on` honoured; `slot = 0` |
| P-5 | SHOULD | **Web deletion flow is heavier than the beta needs:** Turnstile, `deletion_request` table, two Edge Functions, a shared Worker secret and two emails, for ≤100 invite-only users. Google Play requires a web way to *request* deletion, not a self-serve one | MVP: an EN/PL page that explains the 3-tap in-app path and offers "email privacy@ from your account address". The team runs the same `delete-account` job by hand (runbook) within the stated time. Keep the automated flow as a "before public launch" item. That removes 2 functions, 1 table, Turnstile and a secret. Privacy reviewer to confirm Play acceptance |
| P-6 | SHOULD | Silent "sync now" push (ADR 0021): an Edge Function, `push_device`, a DB webhook or pg_net, debounce and receipts, all for **best-effort** delivery that iOS throttles. It's the largest platform moving part for the smallest guaranteed value | Keep it in the design, but build it **after** the first beta build. Ship with option A (reminders say "check Today"), and add the push if testers report stale reminders. If kept now, the week-1 iOS spike decides |
| P-7 | NICE | Send Email Hook for bilingual OTP is **unverified**; the fallback (Resend SMTP + one PL-then-EN template) has no code | Start with the fallback; move to the hook when a third language or a richer template is needed |
| P-8 | NICE | PowerSync free-plan inactivity deactivation ("1 week" vs "2 weeks", backend §2) is a beta risk in quiet weeks, and whether an uptime ping counts as activity is **unverified** | Ask PowerSync or test in week 1. Budget Pro ($49) if a deactivation hits testers |

---

## 4. Spec coverage

Every need maps to a design element. Gaps and partial coverage:

| Need / acceptance | Coverage | Gap |
|---|---|---|
| 1 Pet-first start | Mobile ADR 0005 + backend ADR 0017 | None (once M-1 and M-4 are fixed; otherwise acceptance 1 fails) |
| 2 Household, invite, remove, leave | Backend §8, mobile §4 | Display name (M-7); live card links after removal (M-12) |
| 3 Switch pet, stay in place | Mobile ADR 0003 | None |
| 4 Routine (add, edit, reorder, pause, remove, every N) | Backend §3.1, mobile §2.2 | Remove = `ends_on` (M-8, B-3) |
| 5 Ticks with attribution, offline | R1 | Undo broken as drafted (B-1); name source (M-7) |
| 6 Streak (walks for dogs, paw passes, rest, milestones, DST) | Backend §5, fixtures | Rest-day semantics and window (M-6, B-4). Walk support is consistent across all three (`streak_critical` seeded dog meal/med/walk, cat meal/med/water; template has two walks; planner reads the flag) |
| 7 Reminders, one nudge, quiet time | Platform ADR 0020 | `ends_on` in the planner (P-4) |
| 8 Care card | Backend §9, platform §8 | R2, R3, row 16 (single pet), M-3 |
| 9 Health basics | Backend `medication`/`health_record`/`vet_contact` | Field renames (row 24). No vaccination-due reminder; the spec doesn't ask for one |
| 10 Usual places | `pet_place` | Date vs time for groomer visits (row 24) |
| 11 Settings and privacy, 3-tap delete, web page | Mobile §9, platform §4, §8.4 | Apple re-auth vs "3 taps" (row 20); web page could be simpler (P-5) |
| 12 Bilingual incl. errors | ADR 0006, `i18n:check` | Server error codes aren't i18n keys yet (B-7) |
| Acceptance "same task both offline … no error" | R1 | Satisfied by either model; the drafts must pick one |
| Acceptance "DST weekend" | Fixtures 2027-03-28 / 2027-10-31 | None |
| Acceptance "no analytics before opt-in" | Unmounted SDKs (ADRs 0022, 0023) | None |
| G1 "% of ticks by non-creators" | `household.created_by` | `created_by` becomes NULL after the creator deletes their account. Acceptable |

---

## 5. Risks for a 1–3 person team (fit and over-engineering)

**Proportionate overall.** It's managed services everywhere, there's no self-hosting, about $35 a
month, and one TypeScript language plus SQL. These are the places where the drafts build more
than ≤100 invite-only users need, in order of what they'd save:

1. **Tick event log + fold in two languages** (B-1/R1). Removing it takes the fold out of five readers.
2. **Self-serve web deletion flow** (P-5): 2 Edge Functions, a table, Turnstile and a secret, replaced by a page plus a runbook.
3. **Silent push pipeline** (P-6): defer until testers show it's needed.
4. **Client streak analytics with cross-member dedupe** (P-3): the SQL views already give the number.
5. **Multi-pet care cards** (B-8) and the **typable invite code** (row 19): unasked features.

Without these cuts the team carries **~7 Edge Functions** (`delete-account`, `notify-household`,
`send-email`, `request-account-deletion`, `confirm-account-deletion`, plus mobile's
`store_apple_auth_code` and the Apple exchange) and **~12 vendor consoles**. With them it carries **2–3 functions**
(`delete-account`, optionally `send-email`, later `notify-household`).

Other risks:
- **Same rules in TS and SQL** (due-set, streak; the fold too if kept). The shared `streak-fixtures.json` run against both in CI is the right control. Make it a week-1 deliverable, not a later one.
- **Silent discard is the default failure mode.** That is right for "no one sees an error", but it hides contract bugs like M-1–M-4. Add: (a) a dev-build banner or log on every discarded transaction; (b) the connector test per table (M-1); (c) a count of discards in Sentry (consented) per table.
- **Partners must be TestFlight / Play testers** (mobile O8). This is the biggest G1 friction, and no architecture change fixes it. Eyup should decide on a public TestFlight link plus an open Google Group before the beta.
- **Week-1 spikes are many** (native ID-token sign-in, Hermes `Intl`/Luxon, op-sqlite on SDK 58, iOS silent push, Apple revocation, the Send Email Hook, PowerSync inactivity). Cutting P-6 and P-7 removes two of them.
- **Vendor facts:** most carry a source and the date 2026-11-22. The open ones are marked **unverified**: the iOS 64 pending-notification cap, Hermes `Intl`, `expo-background-task`, PostHog dedupe, the PowerSync DPA and inactivity, Better Stack commercial use, and `.pl` at Cloudflare Registrar. Supabase pricing comes "via the research report, early Nov 2026" without an exact date. Fine for the MVP.
- **No visual-style coupling found.** Tokens are semantic, and no colours or fonts appear in data or APIs.
- **Won't-do list respected.** No payments, no inventory, link-outs only, Poland only.

---

## 6. Missing or weak ADRs

| Item | Status | Action |
|---|---|---|
| Tick model | **Conflict**: 0004 (v5) vs 0014 (events) | Supersede one per R1 (backend-sync) |
| Care-card token storage | **Conflict**: 0018 (plaintext) vs the 0024 consequence (hash) | Amend 0024 (platform) |
| Universal-link scope (`/i/*` only) | No ADR; disagreement lives in M8 and §10 | One line in 0024 or 0008 (platform) |
| Shared `packages/domain` ownership (streak, defaults, namespaces, planner) | No ADR; three package names in use | Mobile's range 0001–0009 is full, so amend ADR 0008 (shared packages) to name the one package and its module owners |
| Upload write map and error classification | Split across mobile §3.3 and backend §6.2, inconsistently | Make it part of ADR 0012 (backend), referenced by 0004 |
| Rest-day rules (today only, bridge, no limit) | Product rule, not an ADR | Product owner adds it to spec need 6 |
| Apple token revocation (re-auth at deletion; none on web) | Partly in 0019 | Add to 0019 consequences |
| All 26 drafts | Have options, cost and lock-in tables; numbering stays in each range | — |

---

## 7. Must-fix summary (before phase 4 / any migration)

- **Mobile:** M-1 per-table write map (upsert vs grants), M-2 deterministic ids for the five keyed tables, M-3 care-card RPCs, M-4 client bootstrap member insert, M-5 SQLSTATE error classification (no discard on 401), M-6 backend's rest-day and provisional rules, M-7 display-name capture.
- **Backend/sync:** B-1 tick model per R1 (v5 row + `DELETE` grant + guards + `AFTER DELETE` triggers; supersede ADR 0014), B-2 `consent_crash_reports`, B-3 no `DELETE` on `task`, B-4 rest days today only.
- **Platform:** P-1 plaintext token lookup (amend B4/ADR 0024), P-2 claim `/i/*` only.
- **Eyup / product owner:** confirm R1 (v5 rows, first uploader credited), R5 (rest days today only, no monthly limit) and O8 (tester-join path for partners).

---

## Re-review (round 2) — 2026-11-22

Inputs: the revised `02_*_design.md` drafts (each with a Revision log), `docs/architecture/mvp/reviews/rulings.md`,
`docs/architecture/mvp/reviews/product-owner.md`, and ADR drafts 0001–0026 (including the renamed
`0014-tick-one-row-per-task-day.md` and `0025-transactional-email-resend-smtp.md`). I checked the
contract text itself, not only the revision logs.

**Final verdict: consistent. Two small fixes remain, both owned by mobile and both one-line
edits. Neither needs another review round.**

### My MUST-FIX items: all resolved
| Item | Status |
|---|---|
| M-1 per-table write map | Resolved: mobile §3.3 matches backend §6.2; one connector test per table |
| M-2 deterministic ids | Resolved: same v5 table and `|` key format in mobile `@petos/domain/ids`, backend §3 and ADR 0004 |
| M-3 care-card RPCs | Resolved: create, rotate and revoke are online RPCs; content changes stay queued updates (one signature nit, open item 1) |
| M-4 bootstrap member row | Resolved: the client inserts it, no server trigger (both drafts, ADR 0017) |
| M-5 error classification | Resolved in principle: 401, 408, 429, 5xx and network errors are retried. The discard list still differs (open item 2) |
| M-6 rest day and provisional streak | Resolved: a rest day bridges and adds no day; `provisionalStreak` covers every unclosed day |
| M-7 display name | Resolved: name step, `profiles.display_name`, bootstrap row, `accept_invite(p_display_name)` |
| B-1 tick model | Resolved: one row per task-day, v5 id, unique key, `DELETE` with a today/yesterday guard, `AFTER DELETE` recompute. ADR 0014 was rewritten with the event log recorded as the rejected option, so ADRs 0004 and 0014 now agree |
| B-2, B-3, B-4 | Resolved: `consent_crash_reports` added; no `DELETE` on `task`; rest days today only, enforced by the `rest_day_guard` trigger |
| P-1, P-2 | Resolved: plaintext 43-character token in B4, §8.3 and ADR 0024; app links cover `/i/*` only |

### Product owner's MUST-FIX items
- **Resolved:** M-2 (confirmation before undoing another member's tick), M-3 (an invited partner never sees pet creation), M-4 / B-M2 (`preview_invite`, a join sheet that names what happens, `p_confirm_leave`, no pet deletion during a join), P-M1 (`/i/*` only), P-M2 ("Marked done" or nothing, never "Not done"), P-M3 (G1 split into invite created ≤7 days and accepted, plus `record_invite_landing`).
- **Overridden by the orchestrator's rulings** and recorded in the drafts: M-1 (event log, first-tapper credit) was overridden by ruling 1, and B-M1 (typable code) by ruling 6. Both are listed as decisions Eyup can still reverse, and each draft's "if a ruling changes" table says what would move.

### Still open
1. **`create_care_card_link` signature (the known nit).** Mobile §10.3 and C-B7 still pass `(p_household_id, p_pet_id, p_lang)`. Backend's final signature is `(p_pet_id, p_lang)`, with the household derived from the pet; it is the same in ADR 0018. **Fix:** mobile drops `p_household_id`. Owner: mobile.
2. **Upload discard list: mobile and ADR 0004 vs backend and ADR 0012.** Backend discards an explicit list that **includes `P0001`**. Mobile and ADR 0004 discard only on classes `22`/`23` and `42501`, and **retry everything else**. Backend's `tick_before_insert`, and the `care_card_link` / `reminder_pref` guards, raise `P0001` (via `raise_app`). So under mobile's list, a cross-household tick would retry forever and **jam the upload queue**, which is exactly what ruling 14 forbids. **Fix:** mobile §3.4, C-B4 and ADR 0004 add `P0001` to the discard set, or simply point to ADR 0012's list as the single source. Owner: mobile.
3. Minor: mobile O3 still lists the `preview_invite` / `accept_invite` signatures as open, but backend §8.2 marks them **final**. Backend's `preview_invite` returns a superset of mobile's shape (`status`, `inviter_name`, `pet_names[]`, `my_current.outcome`), so this is compatible. Close O3 when item 1 is fixed.

### ADR contradictions
Only one is left: **ADR 0004 vs ADR 0012 on the discard list** (open item 2). Earlier conflicts are now consistent:
- 0004 / 0014 (tick model)
- 0018 / 0024 (token storage)
- 0008 (one `@petos/domain` package)
- 0020 / 0021 (push deferred)
- 0022 / 0023 (SQL gate metrics; crash reports off)
- 0016 / 0019 (rest day today only; Apple re-auth at deletion)
- 0025 (SMTP first)

### Fit for a 1–3 person team
The cuts landed. The MVP runs two Edge Functions (`delete-account`, `deletion-followup`). There is no silent push, no self-serve web deletion and no Turnstile. Ticks have no fold, care cards cover one pet, there's no invite code, and the gate metrics come from SQL. The new `deletion-followup` retry queue (privacy B5) is the one addition. It's small: one table, a daily cron job and a Vault secret. It's justified, because deletion has to finish even when PostHog, Resend or Apple is down.
