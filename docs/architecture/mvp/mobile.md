# 02 — Mobile architect: client architecture draft (MVP), revision 2

- **Author:** mobile-architect (agent)
- **Date:** 2026-11-22 (revision 2, after phase-3 reviews)
- **Inputs:** spec Decisions; `docs/specs/001-mvp/spec.md` (`approved`, answer 6 changed: **dog streak = meals + meds + walks; cat streak = meals + meds + fresh water**); `docs/research/stack-choice.md` (stack confirmed by Eyup: Expo, Supabase Frankfurt + Supabase Auth, PowerSync Cloud free plan, Expo push, Cloudflare for web pages, PostHog EU, Sentry EU, Resend); `pet-os-context`; `docs/architecture/mvp/backend-sync.md`; `docs/architecture/mvp/platform-services.md`; reviews `docs/architecture/mvp/reviews/architecture.md`, `docs/architecture/mvp/reviews/product-owner.md`, `docs/architecture/mvp/reviews/privacy-security.md`; **binding rulings** `docs/architecture/mvp/reviews/rulings.md`.
- **Issue:** #5 (architecture), spec issue #3
- **ADR drafts:** `docs/adr/0001`–`0009` (all `proposed`, revised in this round)
- **Sized for:** ≤100 users, 1–3 builders, invite-only beta. Anything "at scale" is a note, not a build item.
- **Naming:** backend's data model wins (ruling 13): singular tables (`household`, `household_member`, `pet`, `task`, `tick`, `rest_day`, `streak_day`, `medication`, `health_record`, `vet_contact`, `pet_place`, `care_card_link`, `reminder_pref`, `profiles`, `notification_settings`), tick fields `actor_id` and `client_at`.

Facts checked on 2026-11-22 via the `library-docs` fallback (WebSearch + WebFetch on official docs; Context7 was not available). Anything not confirmed from a primary source is marked **unverified**.

| Fact | Source (checked 2026-11-22) |
|---|---|
| Expo SDK 58 released 2026-10-15, React Native 0.88; Router loaders/SSR/middleware stable; web default `web.output: "server"`; `expo-updates` adds `updates.maxUpdatesToKeep` | https://expo.dev/changelog/sdk-58 |
| Expo Router v56 forked the React Navigation parts it needs; direct `@react-navigation/*` imports no longer work | https://expo.dev/blog/expo-router-v56-decoupling-from-react-navigation |
| Expo Router server adapters: EAS Hosting, Bun, Express, Netlify, Vercel. **Cloudflare Workers not listed** | https://docs.expo.dev/router/web/api-routes/ |
| PowerSync RN/Expo: `@powersync/react-native` + `@op-engineering/op-sqlite` (≥1.17.0) + `@powersync/react`; dev build required; connector = `fetchCredentials()` + `uploadData()` with `getNextCrudTransaction()` | https://docs.powersync.com/client-sdks/reference/react-native-and-expo |
| PowerSync local-only tables, `viewName` swap; switching local-only → synced **deletes its data** | https://docs.powersync.com/client-sdks/advanced/local-only-usage |
| i18next JSON v4 plural suffixes `_one/_few/_many/_other` via `Intl.PluralRules`; docs say Hermes needs a polyfill | https://www.i18next.com/plurals |

---

## 1. Framework recommendation

**Expo (React Native), SDK 58, TypeScript everywhere, Expo Router for navigation** (ADR 0001, 0002). One language for the app, the web pages, the shared domain package and the backend's Edge Functions.

- Managed native tooling (EAS Build/Submit/Update, config plugins) means close to zero hand-written native code.
- PowerSync's React Native SDK and supabase-js are TypeScript, so connector, auth and domain logic share one language.
- The care-card and info pages reuse the shared TS package without React Native Web (ADR 0008).
- Flutter loses on one-language-with-the-web and on PowerSync/Supabase TS reuse, not on quality. KMP and native cost two UI codebases.

Development builds (not Expo Go) from day one, because op-sqlite needs native code. Stay on SDK 58 for the beta; budget 1–3 days per later SDK upgrade.

## 2. App structure

### 2.1 Repository layout (one monorepo, pnpm workspaces)

```
apps/
  mobile/                 Expo app (iOS + Android), Expo Router
  web/                    Cloudflare Worker: care card, deletion info page, invite landing,
                          .well-known files (platform owns host/headers; §12)
packages/
  domain/  (@petos/domain)  The ONE shared TS package (ADR 0008). Pure TS, no React/RN.
     ids/                 UUIDv5 namespaces + key formats (tick, rest_day, pet_place,
                          reminder_pref); helpers for v7 ids          owner: mobile, reviewer: backend
     day/                 household local date, DST (Luxon)            owner: mobile, reviewer: backend
     routineDefaults/     species templates, template keys, streak_critical defaults
                                                                       owner: mobile, reviewer: backend
     streak/              dueSet, dayOutcome, provisionalStreak + streak-fixtures.json
                          (same fixtures the SQL tests run)            owner: backend, reviewer: mobile
     planner/             planNotifications (platform rules)           owner: platform, reviewer: mobile
     parse/               parseDecimal, input validators               owner: mobile
  i18n/    (@petos/i18n)  locales/en_US.json, locales/pl_PL.json, i18next setup, key types,
                          i18n:check script
  tokens/  (@petos/tokens) semantic tokens → TS theme + CSS variables; contrast check
supabase/                 Owned by backend-sync-architect
```

pnpm isolated installs: fall back to `node-linker=hoisted` if a native module misbehaves (**unverified** current Expo guidance; check at setup).

### 2.2 Mobile app modules (`apps/mobile/src`)

```
app/                      Expo Router routes (thin)
features/
  onboarding/             pet-first flow, draft store, display-name step, merge
  join/                   invite entry, preview + explicit join sheet
  today/                  today list, tick/undo (+ confirm for someone else's tick),
                          yesterday row, rest day, provisional streak, celebration
  routine/                task list, edit/reorder/pause/remove (ends_on), schedule editor
  health/                 medications (→ tasks), vet visits, vaccinations, vet contact
  places/                 pet places, link-outs (Psibufet, Booksy, own shop)
  household/              owner view (invite, remove, rename, time zone, transfer, delete) /
                          member view (read-only + Leave), replace-card-links sheet
  care-card/              create/replace/turn off (online RPCs), content editor, list
  settings/               language, reminders, quiet time, consent, care cards, delete account
  pets/                   pet profile, pet switcher sheet, current-pet store
data/
  powersync/              client schema, connector (write map + error classifier), provider
  queries/                typed SQL query hooks (all reads)
  mutations/              typed write functions (all local writes)
  rpc/                    online-only calls with "needs a connection" state
  auth/                   Supabase client, Apple/Google/email OTP, session + revocation handling
services/
  notifications/          permission, planner apply/reschedule
  analytics/              consent-gated PostHog wrapper
  errors/                 consent-gated Sentry wrapper + scrubbers
  links/                  deep-link parsing, outbound link-outs, in-browser card preview
ui/                       Token-only primitives (Text, Button, Checkbox, ListRow, NumberField, …)
```

Rule: `features/*` may import `data/*`, `services/*`, `ui/*`, `@petos/domain`, `@petos/i18n`. `ui/*` imports only `@petos/tokens` and React Native. `@petos/domain` imports nothing app-specific.

### 2.3 Navigation (Expo Router)

```
app/
  _layout.tsx                 Providers: ErrorBoundary(reportError) → I18n → Theme → Auth →
                              PowerSync → CurrentPet. Splash until auth, locale, consent known.
  (onboarding)/               No session
    welcome.tsx
    pet-new.tsx               name, species, breed?, birth date/age, weight
    routine-preview.tsx       editable default routine (remove/add a walk) from routineDefaults
    account.tsx               Apple / Google / email code
    name.tsx                  "What should the household call you?" (prefilled, required)
    consent.tsx               usage stats / crash reports / product news; all off
  i/[token].tsx               Invite entry (signed in or not); stores the token, routes to join flow
  (join)/                     Invite path; never shows pet screens
    account.tsx               "Sign in to join a household" (same sign-in component)
    name.tsx
    confirm.tsx               preview_invite → explicit join sheet (§4.3)
  (app)/                      Session + active household
    (tabs)/
      today/index.tsx
      routine/index.tsx, routine/[taskId].tsx
      health/index.tsx, health/med/[medId].tsx
      pet/index.tsx           profile + places + this pet's care card
      settings/index.tsx      incl. Household (owner controls or read-only + Leave), Care cards list, Delete account
    pet-switcher.tsx          formSheet
    task-edit.tsx             modal
    invite.tsx                formSheet (create + share link)
    care-card-share.tsx       formSheet (public-link warning)
    replace-card-links.tsx    formSheet (after removing a member)
    delete-account.tsx        modal
  no-household.tsx            Removed/left: "Create a household" or "Join with a link"
  +not-found.tsx
```

Sheets use native `formSheet`/`modal` presentations: true modals for VoiceOver/TalkBack, one dependency fewer. Sheet timing is the OS's, not the canvas's 220 ms (accepted by PO).

### 2.4 "Switch pet, stay in place" (spec need 3, ADR 0003)

- `useCurrentPet()` reads `currentPetId` from a small Zustand store, persisted per device per user. Pet-scoped screens derive queries from it.
- The switcher in every tab header opens `pet-switcher`. Choosing a pet sets the store; the route doesn't change.
- Detail screens tied to another pet's record pop to that tab's root (one hook, `usePetScopedRecord`).
- Notification taps carry `?pet=<id>`; the root layout applies it before navigating.
- If the current pet is **deleted** (pets are hard-deleted, backend model) or vanishes through sync, fall back to the first pet by `sort_order`; with none, show "add a pet".

## 3. Offline and local data

### 3.1 Principles

- **Offline is the normal state.** Every domain write goes to local SQLite first; PowerSync uploads it when online. The UI never waits for the network for ticks, edits or creates.
- **PowerSync's local SQLite is the single source of truth** (ADR 0004). No second client cache.
- **IDs:** UUIDv7 for ordinary rows. **Deterministic ids** (from `@petos/domain/ids`, one namespace constant per table, key parts joined with `|`) for the "one per key" rows, so offline creates by two members or two devices produce the same row:

| Table | Id |
|---|---|
| `tick` | `uuidv5(NS_TICK, task_id \| local_date \| slot)` (slot = `0`) |
| `rest_day` | `uuidv5(NS_REST_DAY, pet_id \| local_date)` |
| `pet_place` | `uuidv5(NS_PET_PLACE, pet_id \| kind)` |
| `reminder_pref` | `uuidv5(NS_REMINDER_PREF, user_id \| task_id)` |
| `vet_contact` | `= household_id` (one per household) |
| `notification_settings`, `profiles` | `= user_id` |

### 3.2 Reading

- `@powersync/react` `useQuery(sql, params)` re-runs when tables change, from local writes or sync. All SQL lives in `data/queries/*` as typed hooks; screens never write SQL. JSON columns (`owner_contacts`) are parsed in the query layer.
- "Today" is the **household's** date (`@petos/domain/day.localDate(now, household.timezone)`), never the phone's offset. `useHouseholdToday()` re-evaluates at household midnight and on foreground.
- When the device zone differs from `household.timezone`, times show a small "Warsaw time" label (PO S-M5).
- Sync status is a quiet line ("Saved on this phone — will sync"), never a blocking spinner, except the first sync on a new device after sign-in (`waitForFirstSync`, skeleton UI).
- Server schema changes are **additive** during the beta; the client schema is a view layer, so no SQLite migrations.

### 3.3 Writing: per-table write map (arch M-1, M-4)

`data/mutations/*` are the only writers, each one `db.writeTransaction(...)`. The connector's `uploadData()` maps each CRUD op **per table** (backend §6.2, ruling 1), never a blanket upsert:

| Table | PUT | PATCH | DELETE |
|---|---|---|---|
| `tick` | `upsert(row, { onConflict: 'id', ignoreDuplicates: true })` (the server's `tick_before_insert` trigger skips the duplicate and keeps the earliest `client_at`, so the first **tapper** is credited; Eyup 2026-11-23) | — | `delete().eq('id')` (undo; server guard ignores deletes outside the open window) |
| `rest_day` | `upsert(row, { onConflict: 'id', ignoreDuplicates: true })` | — | `delete().eq('id')` (today only) |
| `pet_place`, `vet_contact`, `reminder_pref`, `notification_settings` | `upsert(row, { onConflict: 'id' })` | `update(changed cols)` | — |
| `household` | `insert(row)` (no `.select()`, so no `RETURNING`) | `update({ name?, timezone? })` | — |
| `household_member` | `insert(row)` — **bootstrap row only** | `update({ display_name })` own row | — (RPC) |
| `pet`, `medication`, `health_record` | `insert(row)`; `23505` on `id` on retry = done | `update(changed cols)` | `delete().eq('id')` |
| `task` | `insert(row)`; `23505` on `id` = done | `update(changed cols)`; **remove = `ends_on = today - 1`** | never |
| `profiles` | — (row created by backend trigger) | `update(changed cols)` own row | — |
| `care_card_link` | never (RPC) | `update({ owner_contacts?, note?, lang?, show_vet? })` | never (RPC) |
| `invite`, `streak_day` | never | never | never |

PATCH sends only the columns PowerSync recorded as changed (`opData`), which matches backend's column grants. A connector test per table runs against local Supabase in CI.

**Household bootstrap (arch M-4, ruling via backend §8.1):** one local transaction inserts `household` (`created_by = uid`, `timezone` = device IANA zone or `Europe/Warsaw`), then the creator's `household_member` row (`user_id = uid`, `display_name` from the name step), then `pet` and `task` rows. PowerSync uploads in write order, so RLS sees the member before the pet. No server trigger is assumed.

**Local tick idempotency (arch M-11):** the tick mutation checks for an existing row with the deterministic id inside the transaction and does nothing if one exists (PowerSync tables are views, so `INSERT OR IGNORE` behaviour on them is **unverified**; the explicit check is safe).

### 3.4 Upload error classification (arch M-5, ruling 14)

| Error | Action |
|---|---|
| SQLSTATE class `22` (bad data), class `23` (constraint), `42501` (RLS denied, e.g. removed member), `P0001` (server guard raised, e.g. tick outside the window) | **Discard** that transaction (`complete()`), `reportError` (consented, no PII, table name + code only), dev builds show a banner and log it; the next sync restores server truth. Exception: `23505` on `id` for a retried insert counts as success. |
| HTTP 401 / JWT expired (`PGRST301`) | Refresh the session, then **retry** (throw). Never discard. |
| 408, 429, 5xx, network errors, anything unrecognised | **Retry** (throw; PowerSync backs off). |
| Auth refresh says the user is deleted or the refresh token is revoked | Stop uploading; run the "local wipe" (§9.4). |

Result: no user ever sees an upload error dialog, and offline ticks survive a long offline stretch.

### 3.5 Ticks (ruling 1)

- **One row per task per household day.** Tick = local insert `{ id = uuidv5(task_id|local_date|0), household_id, pet_id, task_id, local_date, slot: 0, actor_id: <me> (optimistic; server overwrites from the JWT), client_at: now }`.
- **Same task, both offline:** both phones create the same id; the server keeps one row and credits whoever **tapped first** (earliest `client_at`, capped at server time; backend §4, ADR 0014), and both phones receive that row on the next checkpoint. One tick, no error. `client_at` is the device time of the tap, set when the local row is written, never at upload. The flip from "Done by You" to "Done by Ana" is **silent** (no animation, toast or announcement).
- **Different tasks, both offline:** different ids, both survive; "Done by …" resolves `actor_id` → `household_member.display_name` (including former members); null or missing → "Former member"; `actor_id = me` → "You".
- **Undo = local DELETE**, offered for today and yesterday (the server window guard ignores older deletes). **Own tick:** instant undo. **Someone else's tick:** one confirmation, "Ana marked this done at 07:58. Mark as not done?" (PO M-2), to stop double feeding from a stale screen.
- **Yesterday:** a collapsed "Yesterday" row on Today, shown only while yesterday has open streak-critical tasks (PO S-M1). The server accepts `today-2 … today+1`; the UI offers today and yesterday only.

### 3.6 Streak on the client (arch M-6, ruling 2)

- The **server owns the streak** in `streak_day` (one row per pet per closed day: `outcome`, `streak_after`, `passes_used_in_month`). The app reads the latest `streak_day` per pet; best = `max(streak_after)` (local query).
- **Provisional value** = `@petos/domain/streak.provisionalStreak(lastStreakDay, openDays…)` over **every day the server hasn't closed yet** (e.g. offline since yesterday), using backend's rules and the shared `streak-fixtures.json`:
  - due set = non-paused, not-ended, due streak-critical tasks;
  - `complete` → +1; **rest day → bridges, adds nothing**; empty due set or the pet's first day → neutral; missed → paw pass if `< 2` this month, else reset.
- **Streak-critical (confirmed):** dog = meal, med, **walk**; cat = meal, med, water; litter and custom never. Set from `routineDefaults` when a task is created (backend trigger as guard); read-only in the MVP (no toggle). The task editor shows "Counts toward the streak".
- **Rest day (ruling 2):** "Rest day" action on Today for **today only**, no monthly limit, cancels today's streak nudge (not task reminders). Copy stays guilt-free.
- **Walks:** the dog template has two "any time today" walks; the routine preview offers one-tap remove so a garden dog or once-a-day household fixes it before day one. A dog that can't walk today is covered by a rest day or pausing the task.
- **Progress copy:** "3 of 5 done for the streak" (plural keys), plus a marker icon on counting rows, not colour alone (PO S-M3).
- **Never show a drop from a provisional value.** If the server disagrees after sync, the server value wins silently. Reset copy is inline and neutral at next open: "New streak starts today · Best: 23 days"; paw pass use: "A paw pass covered Tuesday". No modal, no push.
- **Milestones** (7/14/30/100) celebrate from the provisional value once per device per member (`celebrated:{userId}:{petId}:{milestone}:{streakStartDate}`). Reduce Motion → static, ≤1.2 s.

### 3.7 Device-local storage (AsyncStorage; not synced)

| Key | Purpose | Cleared on sign-out / deletion / wipe |
|---|---|---|
| Supabase session | supabase-js storage adapter (move to SecureStore before public launch, privacy M5 LATER) | yes |
| `consent.v1:<userId>` = `{ usageStats, crashReports, marketing, decidedAt, policyVersion }` | per-person consent (privacy M3) | yes |
| `locale.override` | language chosen before sign-in; after sign-in `profiles.locale` wins | no (device language preference, not personal data) |
| `currentPetId:<userId>` | pet switcher | yes |
| `onboarding.draft` | pre-account pet + routine | yes (after merge or discard) |
| `pendingInviteToken` | invite opened before sign-in | yes |
| `celebrated:*` | milestone de-dup | yes |

## 4. Onboarding, sign-in and joining (ADR 0005)

### 4.1 New owner (pet first)
1. `pet-new` → draft `{ pet, tasks }` with pre-generated UUIDv7 ids, saved to `onboarding.draft` on every step.
2. `routine-preview` reads like Today and is editable (remove/add a walk). No ticking before an account (PO R1 upheld).
3. `account` → Apple / Google / email code. Offline or failed: the draft stays, copy "Connect to save Burek's routine — nothing is lost" (PO S-M2).
4. `name` (arch M-7, ruling 12): "What should the household call you?", prefilled from Apple's full name (first sign-in only), Google's given name, empty for email; required, ≤60 chars. Written to `profiles.display_name` (PATCH) and used for the member row.
5. Merge:
   - **No household:** bootstrap transaction (§3.3) with the draft's pet and tasks.
   - **Existing household** (reinstall, second phone): wait for first sync; sheet "Add Burek to your household?" (Add / Discard draft).
6. `consent` (three switches, all off; crash reports off by default, ruling 10) → Today.

### 4.2 Invited partner (PO M-3)
`/i/<token>` opens the app (universal/app link). The token is saved to `pendingInviteToken` (survives the OTP app switch). If not signed in: `(join)/account` "Sign in to join a household" → `name` → `confirm` → `consent` → Today with the household's pets. **No pet creation and no routine preview.** Four screens after install. If the app wasn't installed, the web landing explains installing via the beta links, then "tap the invite link again" (no typable code, ruling 6).

### 4.3 Join sheet (PO M-4, ruling 11)
Before accepting, the app calls `preview_invite(p_token)` (online) and shows one sheet naming the consequences:
- Target: "Join Ana's household (Ana, Bartek)". Full or expired invite → bilingual error from the RPC's stable code.
- If the user is the **sole member** of a household with pets: "Burek and Mruczek come with you, with their history." Pets always come along; **the join flow never deletes pets**.
- If **others remain** in the user's current household: "You'll leave 'Kowalski home'. Burek stays there with Tomek." If `my_current.new_owner_name` is set (the user owns that household): add "Tomek becomes the owner."
- If the target already has a same-name, same-species pet: hint "Ana's household already has a dog called Burek. You can remove the duplicate after joining."
- The joiner always becomes a **member**, never the owner.
- Primary button "Join Ana's household"; secondary "Not now".
On confirm: require a connection, **flush the upload queue** (wait for an empty CRUD queue and a completed upload), then `accept_invite(p_token, p_display_name, p_confirm_leave)`. After success, wait for sync. If the user also had an onboarding draft, offer "Add Burek to Ana's household?". Duplicate same-name pets are left as two pets; the user can delete one from the pet profile with a named confirmation.

### 4.4 Removed or no household
When the user has no active `household_member` row after sync (removed, left, or the owner deleted the household): `no-household` screen with neutral copy, "Create a household" (pet-first, skipping sign-in) or "Join with a link".

## 5. State management (ADR 0004)

- **Domain data:** PowerSync SQLite + `useQuery`.
- **Session:** `AuthProvider` context over supabase-js auth state.
- **Small UI state:** Zustand (current pet, transient flags), persisted per user where noted.
- **Forms:** component state + validators from `@petos/domain/parse`.
- **Online RPCs:** `data/rpc/*` functions with a `useAsyncAction` hook (loading, "needs a connection", mapped error key). RPC errors come as stable codes (`P0001` + message key such as `invite_expired`, `household_full`, `already_member`, `link_revoked`, `not_owner`, `cannot_remove_self`, `owner_must_be_member`, `owner_must_transfer`) mapped to `app.error.*` i18n keys (arch B-7; backend owns the code list).

## 6. Internationalisation (EN/PL, ADR 0006)

- **i18next + react-i18next**, bundled `@petos/i18n/locales/en_US.json` and `pl_PL.json`; namespaces `app`, `notif`, `email`, `web` (shared with Worker and Edge Functions). Typed keys from `en_US.json`. Named interpolation only.
- **Polish plurals:** `_one`, `_few`, `_many`, `_other` (e.g. `"app.streak.days_one": "{{count}} dzień"`, `_few`/`_many`: `"{{count}} dni"`, `_other`: `"{{count}} dnia"`). `@formatjs/intl-pluralrules` force-polyfilled for `en` + `pl`. `i18n:check` in CI: key parity, required plural forms per language, matching variables, no empty strings.
- **Language:** default from `expo-localization` (`pl` → `pl-PL`, else `en-US`). Change in Settings → `i18n.changeLanguage()`, PATCH `profiles.locale` (`pl_PL`/`en_US`), `supabase.auth.updateUser({ data: { locale } })` (emails), re-plan local notifications. Sign-up passes `locale` in `signInWithOtp({ options: { data: { locale } } })`.
- **Numbers:** `parseDecimal` accepts exactly one `,` or `.` ("5,8" and "5.8" → 5.8), strips a trailing unit, rejects grouping. `NumberField` uses `decimal-pad`; display via `Intl.NumberFormat(locale)`; stored locale-free (`weight_kg`).
- **Dates:** Luxon in `@petos/domain/day` with DST fixtures (2027-03-28, 2027-10-31). Hermes `Intl` time-zone support **unverified**; week-one device test.
- **Text stored as data:** tasks carry `template_key` (backend format, e.g. `task.dog.walk.morning`) and nullable `title`; display `title ?? t(template_key)`. A PL/EN household sees each default task in their own language.
- **Long Polish words at 200 %:** no fixed-height text containers; dev toggle "pseudo-long" pads strings ~40 % with Polish diacritics.

## 7. Accessibility plumbing (WCAG 2.1 AA)

- Primitives own a11y: the tick is `accessibilityRole="checkbox"` with `checked` state and a label ("Breakfast, done by Ana at 7:58"); every interactive primitive requires a `label` prop at the type level.
- Announce after tick (`announceForAccessibility`); focus stays on the row (stable keys, no re-mount). The undo confirmation for someone else's tick is a native alert (screen-reader accessible).
- True modal sheets (native presentations); focus to title on open and back to the opener on close.
- Reduce Motion gates all animation; durations are tokens (tick 160, progress 300, sheet 220, celebration ≤1200 ms).
- System font scaling on; 200 % layout reviews. Visible focus from tokens (web `:focus-visible`).
- CI contrast check on declared token pairs (4.5:1 text, 3:1 large/UI). ≥44×44 pt targets.
- RN Testing Library queries by role/label; manual VoiceOver + TalkBack pass per release on the core flows (onboarding, join, tick/undo, care card share, delete).

## 8. Theming (tokens, light only, ADR 0007)

Reference tokens per visual direction → semantic tokens (`color.*`, `space.*`, `radius.*`, `type.*`, `motion.*`, `icon.species.*`). Components read semantic tokens only, via `useTheme()` + `StyleSheet`. Swapping direction = one import. `userInterfaceStyle: "light"`. `@petos/tokens` emits `theme.ts` (mobile) and `tokens.css` (web).

## 9. Auth, sign-out, deletion

### 9.1 Sign-in
- supabase-js session in AsyncStorage; `autoRefreshToken` tied to `AppState`.
- **Apple (iOS):** `expo-apple-authentication` → `identityToken` + nonce → `signInWithIdToken({ provider: 'apple', token, nonce })`. **No authorization code is sent or stored at sign-in** (privacy M3, arch row 20).
- **Google:** native Google Sign-In → `idToken` → `signInWithIdToken({ provider: 'google', token })` (**unverified** on RN with Supabase; week-one spike).
- **Email:** 6-digit OTP (`signInWithOtp` + `verifyOtp`).
- Official Apple/Google buttons only. No Apple sign-in on Android in the MVP.

### 9.2 PowerSync credentials
`fetchCredentials()` returns `{ endpoint: EXPO_PUBLIC_POWERSYNC_URL, token: session.access_token }`, refreshing the session first if it is near expiry.

### 9.3 Sign-out
`powerSync.disconnectAndClear()` → `supabase.auth.signOut()` → cancel all scheduled notifications → PostHog `optOut()/reset()` and unmount, `Sentry.close()` → remove all per-user keys (§3.7), including `consent.v1:<userId>` (privacy M3). Push-device unregistration is part of the deferred silent-push work (§13.2).

### 9.4 Local wipe when the user is gone (privacy M3)
If a session refresh fails because the user was deleted or the refresh token was revoked (e.g. the account was deleted from another device or by the web/manual route), the app runs the sign-out steps without server calls, wipes all per-user keys, and shows a neutral "You've been signed out" screen.

### 9.5 Account deletion (3 taps)
Settings → Delete account → Confirm. The confirmation says: "Your ticks stay in the household's history as 'Former member'. Your contact is removed from care cards." If the user owns a household with other members, it adds "Tomek becomes the owner." (next owner computed locally with backend's rule: the active member with the earliest `joined_at`); if they are the last member, "This also deletes Burek and his history." Apple users then see Apple's system re-auth sheet to get a fresh `authorizationCode` (UX to confirm it still reads as 3 taps). Then `supabase.functions.invoke('delete-account', { body: { apple_authorization_code? } })` (online; "needs a connection" otherwise) → local wipe (§9.4). The web route is an info page plus an email request handled by runbook (ruling 7); it cannot revoke Apple tokens (documented, accepted for the beta).

## 10. Household, care cards and privacy flows

### 10.0 Owner and members (2026-11-23, spec need 2, backend §8.5, ADR 0019)
- One **owner** per household: `isOwner = household.owner_id === me`. The member list shows an "Owner" label on that row. Nothing about ownership is stored on the phone beyond the synced `owner_id`.
- **Owner sees** Settings → Household with: Invite, Remove member, Rename, Time zone, Transfer ownership, Delete household, and Leave household.
- **Members see** a read-only Household screen (name, time zone, members with the owner marked) and **Leave household**. Owner-only controls are hidden, not disabled. Everything else (pets, routine, ticks, health, places, care cards) is equal for all members.
- If a member's stale screen still sends an owner-only change, the server rejects it (`42501` → discarded, or `not_owner` from an RPC → `app.error.not_owner`).
- When `owner_id` changes on sync (transfer, auto-transfer), a quiet banner says "Tomek is now the owner" (or "You're now the owner") once.

### 10.1 Invite (ruling 6; owner only)
`invite.tsx` (owner only) → `create_invite(p_household_id)` (online) → `{ token, expires_at }` → OS share sheet with `https://<domain>/i/<token>`. No typable code. Open invites sync to the owner only; the owner can revoke them (`revoke_invite`).

### 10.2 Remove, leave, transfer, delete (privacy M1, B2)
- **Remove member** (owner only, never self): `remove_member(p_member_id)`; `cannot_remove_self` is not reachable from the UI.
- **Leave household** (anyone): `leave_household(p_household_id)`. For the owner the confirmation names the next owner ("Tomek becomes the owner") or, if they are the last member, the pets that will be deleted. After success the phone shows `no-household` on the next sync.
- **Transfer ownership** (owner only): pick an active member → confirm "Make Tomek the owner? You'll stay a member." → `transfer_ownership(p_household_id, p_member_id)`.
- **Delete household** (owner only, online): `delete_household(p_household_id)`. The confirmation names the household, its pets and the other members: "This deletes Burek and Mila and their history for Tomek too." Care-card links die at once.
- `remove_member` and `leave_household` return `{ household_deleted, new_owner_member_id, open_invites_revoked, care_cards }`. After a removal: banner "Open invite links were turned off" when `open_invites_revoked > 0`; if `care_cards > 0`, sheet `replace-card-links`: "Replace care card links? The sitter will need the new link." **Replace** rotates each active card and offers to share; **Keep** closes. The removed member's own contacts are stripped from cards by the backend.

### 10.3 Care cards (ruling 3, 4, 5; arch M-3; privacy M2)
- **One pet per link.** Create from the pet tab: `create_care_card_link(p_pet_id, p_lang)` (online) → `{ id, token }`. **Replace link** = `rotate_care_card_link(p_id)`; **Turn off** = `revoke_care_card_link(p_id)`. All online, with a "needs a connection" state; an offline turn-off says it couldn't turn the link off.
- **Content editing** is a queued PATCH of `owner_contacts`, `note`, `lang`, `show_vet` (column grants). `owner_contacts` = `[{ user_id?, first_name, phone }]`, max 3; "Add me" pre-fills the current user with `user_id`, hand-typed neighbours have none.
- **Public-link warning** (privacy M2) on the share sheet and in the editor: "Anyone with this link can see this card. Don't add door codes or your address." (EN/PL).
- The token is 256-bit, stored plaintext and readable by active members (any member can copy the current link). It is never logged: the error and analytics scrubbers redact it (§13.2).
- **Preview** opens the card in the browser (`WebBrowser.openBrowserAsync`); `/c/*` is never an app link.
- **Settings → Care cards:** list of the household's cards with pet, created date, "last opened" (`last_viewed_at`) and open count (`view_count`), and actions Copy link, Replace link, Turn off.

### 10.4 Household time zone (PO S-M6)
Settings → Household → Time zone, **owner only** (PATCH `household.timezone`, IANA picker, default from device; same for Rename → `name`). Changing it applies to new ticks and the next close (backend rule).

## 11. Deep links

- Scheme `petos://` plus universal/app links on the web domain, claiming **`/i/*` only** (ruling 3, privacy M4).
- In-app routes by link: `/i/[token]`, `/today?pet=<id>` (notification taps), `/settings`.
- Care-card links (`/c/<token>`) are web-only.
- `.well-known/apple-app-site-association` and `assetlinks.json` are served by `apps/web`; mobile supplies team ID, bundle ID, SHA-256 cert fingerprints.

## 12. Release, build and OTA (ADR 0009)

- **EAS Build + Submit + Update.** Profiles `development` (dev client), `preview` (internal testers), `production` (TestFlight external + Play closed testing).
- Beta access for partners is handled by the beta landing page (public TestFlight link + Play closed-testing group), not by an app feature (ruling 6).
- `appVersionSource: "remote"`, auto-incremented build numbers.
- OTA: `runtimeVersion: { policy: "fingerprint" }`; JS fixes go to `preview` first, then `production`; roll back by republishing.
- `get_app_config()` at start: below `min_supported_version` → "please update"; `maintenance_message_key` → banner.
- Only public config in the app (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, `EXPO_PUBLIC_POWERSYNC_URL`, PostHog project key, `EXPO_PUBLIC_SENTRY_DSN`). Sentry auth token for symbol upload in EAS secrets.
- CI: typecheck, lint, unit tests (`@petos/domain` incl. shared streak fixtures, ids, day, parse), `i18n:check`, contrast check, connector tests per table against local Supabase, RN Testing Library. Maestro flows locally before each beta build (onboarding, join, offline tick → sync, undo, language switch, care card create/turn off, delete account).
- Privacy labels / Data safety inputs from the privacy reviewer (M6, LATER).

## 13. Contracts

### 13.1 With backend-sync-architect

**C-B1 — Local schema.** The PowerSync client schema mirrors backend §11 for the synced streams (`household_data`, `my_user`). Field names as backend:

| Table | Client reads | Client writes (queued) | Fields the client relies on |
|---|---|---|---|
| `household` | yes | bootstrap insert (server sets `owner_id = me`); PATCH `name`, `timezone` **owner only** | `id, name, timezone, owner_id, created_by` |
| `household_member` | yes (incl. former members) | bootstrap insert; PATCH own `display_name` | `id, household_id, user_id, display_name, joined_at, left_at` |
| `invite` | owner only (open invites) | never | `id, household_id, token, expires_at` |
| `pet` | yes | insert, PATCH, delete | `id, household_id, name, species, breed, birth_date, birth_date_estimated, weight_kg, care_notes, sort_order, created_at` |
| `task` | yes | insert, PATCH (remove = `ends_on`) | `id, household_id, pet_id, kind ('meal'\|'walk'\|'water'\|'litter'\|'med'\|'custom'), template_key, title, amount, streak_critical, time_of_day (null = any time), every_n_days, anchor_date, ends_on, paused, medication_id, sort_order` |
| `tick` | yes | insert, delete (undo) | `id (v5), household_id, pet_id, task_id, local_date, slot (0), actor_id, client_at` |
| `rest_day` | yes | insert, delete (today only) | `id (v5), household_id, pet_id, local_date, created_by` |
| `streak_day` | yes (read-only) | never | `pet_id, local_date, outcome, streak_after, passes_used_in_month` |
| `medication` | yes | insert, PATCH, delete | `id, household_id, pet_id, name, dose, notes, starts_on, ends_on` |
| `health_record` | yes | insert, PATCH, delete | `id, household_id, pet_id, kind ('vet_visit'\|'vaccination'), title, occurred_on, next_due_on, note` |
| `vet_contact` | yes | upsert (`id = household_id`) | `name, phone, address, notes` |
| `pet_place` | yes | upsert (v5 `pet_id\|kind`) | `household_id, pet_id, kind ('food'\|'groomer'), provider ('psibufet'\|'booksy'\|'custom'), name, url, next_visit_on, note` |
| `care_card_link` | yes | PATCH content only | `id, household_id, pet_id, token, owner_contacts, note, lang, show_vet, revoked_at, view_count, last_viewed_at, created_at` |
| `profiles` | own row | PATCH (`display_name`, `locale`, consent fields) | `id, display_name, locale, consent_usage_stats, consent_crash_reports, consent_marketing, consent_updated_at, consent_policy_version` |
| `notification_settings` | own row | upsert (`id = user_id`) | `quiet_start, quiet_end, nudge_enabled, nudge_at` |
| `reminder_pref` | own rows | upsert (v5 `user_id\|task_id`), PATCH | `user_id, task_id, household_id, enabled, anytime_remind_at` |

Requests to backend that follow from the rulings: `care_card_link.pet_id uuid` (single pet, ruling 5) instead of `pet_ids[]`; `tick` unique `(task_id, local_date, slot)`, `DELETE` grant with window guard and after-delete recompute, no `action` column (ruling 1); `rest_day` today only (ruling 2); `profiles` and `notification_settings` rows created by an `auth.users` trigger (arch B-5); no `DELETE` on `task` (arch B-3).

**C-B2 — Streams.** `household_data` for active members, `my_user` for own rows. Removal drops the bucket; the client routes to `no-household`.

**C-B3 — Bootstrap.** Client inserts `household` then its own `household_member` (RLS `can_bootstrap`) then pets and tasks, in one transaction, no `RETURNING`.

**C-B4 — Write map and errors.** As §3.3/§3.4; mirrors backend §6.2 and S4 (discard only on `22xxx`, `23xxx`, `42501`, `P0001`; retry 401 after refresh, 408, 429, 5xx, network). Backend ADR 0012 is the reference; mobile ADR 0004 points to it.

**C-B5 — Windows.** Server accepts ticks `today-2 … today+1` (silent drop outside) and tick deletes in the open window; UI offers today and yesterday. Rest days: today only.

**C-B6 — Shared domain package.** `@petos/domain` (single package, ADR 0008): `ids` (namespaces + `|` key format; backend uses the same strings in SQL where it computes ids), `day`, `routineDefaults` (template keys `task.<species>.<kind>.<variant>`), `streak` (`dueSet`, `dayOutcome`, `provisionalStreak`, `streak-fixtures.json` run against TS and SQL in CI; backend owns the rules).

**C-B7 — Online RPCs / Edge Functions the client calls** (names as backend; final signatures per backend's revised draft):
`create_invite(p_household_id)` and `revoke_invite(p_invite_id)` (owner only, `not_owner`), `preview_invite(p_token)` → `{ status, household_name, inviter_name, member_names[], pet_names[], full, my_current: { household_name, other_member_names[], pets[], outcome, new_owner_name } }`, `accept_invite(p_token, p_display_name, p_confirm_leave)`, `remove_member(p_member_id)` (owner only; `cannot_remove_self`), `leave_household(p_household_id)` (anyone; auto-transfer) → `{ household_deleted, new_owner_member_id, open_invites_revoked, care_cards }` (same shape from `remove_member`), `transfer_ownership(p_household_id, p_member_id)` (owner only; `owner_must_be_member`), `delete_household(p_household_id)` (owner only), `create_care_card_link(p_pet_id, p_lang)`, `rotate_care_card_link(p_id)`, `revoke_care_card_link(p_id)`, `get_app_config()`, Edge Function `delete-account` `{ apple_authorization_code? }`. Errors raise stable codes mapped to `app.error.*` in `en_US.json` / `pl_PL.json`, including the owner keys `not_owner`, `cannot_remove_self`, `owner_must_be_member`, `owner_must_transfer`.

**C-B8 — Auth.** Supabase JWT straight to PowerSync; `sub` = `auth.users.id` = `actor_id`/`user_id`. Apple/Google native ID tokens, email OTP with `locale` in user metadata. No Apple code at sign-in; a fresh code only at deletion.

**C-B9 — Care card read** (Worker, not app): `get_care_card(p_token)` computes today in the household zone and returns one pet, today's tasks with `done` (no names), meds, feeding, vet (if `show_vet`), owner contacts, note, `lang`.

### 13.2 With platform-services-architect

**C-P1 / C-P2 — Push device registration and the silent "sync now" push: deferred (ruling 8).** Not in the first beta build. Planned follow-up if testers report reminders for tasks already done: `register_push_device` / `unregister_push_device` (before session clear) and a `{ t: "sync" }` data handler that syncs and calls `rescheduleAll("push")`. The client keeps a stub entry point so adding it is a small change.

**C-P3 — Local reminders and nudge (= M1, M2).** Mobile hosts `services/notifications` (`applyPlan`, `rescheduleAll`); platform owns `@petos/domain/planner` rules and fixtures. Inputs from synced rows: `task` (incl. `ends_on`, `streak_critical`, `time_of_day`, `every_n_days`, `anchor_date`, `paused`), `tick` ("already done" = a tick row exists, ruling 1), `rest_day` (a rest day cancels that day's nudge), `reminder_pref`, `notification_settings`, `household.timezone`, the device's current zone (quiet time follows the device, PO S-P1), the provisional day status per pet. IDs `r:<taskId>:<localDate>:0`, `n:<localDate>`; DATE triggers; window `min(7 days, 56)`. Re-plan on start, foreground, sync touching those tables, language change, time-zone change. Reminder copy points to Today ("· check Today"), since without the silent push a reminder may fire after a partner ticked. The streak nudge is offered in context after the first completed day, not in onboarding (PO S-P6).

**C-P4 — Consent gate and analytics (= M5, M6; privacy M3).** Consent is **per person**: `consent.v1:<userId>`, loaded before the splash hides. Nothing is mounted before sign-in. After sign-in, `profiles.consent_*` wins; with no profile decision, show the consent screen. Three switches, all off (crash reports off by default, ruling 10). `PostHogProvider` mounted only when `usageStats`; `track()` typed from platform's event list (streak/G1/G3 numbers come from SQL aggregates, ruling 9; the client sends only consented product events). Cleared on sign-out and deletion.

**C-P5 — Error tracking: Sentry EU (= M7).** `Sentry.init({ sendDefaultPii: false, tracesSampleRate: 0, replay off, beforeSend, beforeBreadcrumb })` only when `crashReports`; `Sentry.close()` on opt-out/sign-out; no `setUser`. Scrubbers (privacy P3) remove `/c/<token>`, `/i/<token>`, `t=`, `access_token`, `refresh_token`, `Authorization` and query strings on HTTP breadcrumbs. PostHog screen events use route names, never URLs with tokens. All code calls `reportError`; direct `@sentry/*` imports are lint-banned outside `services/errors`.

**C-P6 — App config (= M10).** `get_app_config()` at start.

**C-P7 — Deep links (= M8, ruling 3).** `/i/*` only.

**C-P8 — Shared i18n (= M9).** `@petos/i18n` with `app/notif/email/web` namespaces; card copy "Marked done" or nothing, never "Not done", plus "The family marks tasks in the Pet OS app" (ruling 4; platform writes `web.careCard.*`).

**C-P9 — Web pages.** Platform owns the Worker, headers (`noindex, nofollow, noarchive`, generic title/OG, no `/c/` in robots.txt), the deletion info page and the invite landing. Mobile owns the shared packages the Worker imports. Card language: `?lang` → card `lang` → `Accept-Language`.

**C-P10 — Link-outs.** `services/links.openPartner(kind, url)`; consented `partner_link_tapped` event.

## 14. If a confirmed answer or ruling changes later

| Decision | What depends on it here | If it changes |
|---|---|---|
| 1. Vet finder + Info library OUT | No location permission, no content screens | Add `features/vet-finder` (on-tap location, list + directions, Places key proxied by an Edge Function) and `features/info`. ~2–4 weeks; core untouched. |
| 2. Care card read-only | Card is script-free HTML; ticks always have a signed-in `actor_id` | Token-scoped write RPC, a small form, a non-user actor; deterministic tick ids still work. |
| 3. Links don't expire | No expiry UI | Expiry picker + "expired" state; RPC already checks `expires_at`. |
| 4. No pet photos | Initial/species avatar | Image picker, on-device resize, upload queue, deletion; card would then need `token_hash` + rotate (privacy LATER note). |
| 5. Owner + members (changed 2026-11-23), cap 6 | `isOwner` gating in Household settings; owner copy in leave/delete/join | Back to equal rights → drop the gating and the transfer/delete screens; RPCs unchanged for members. |
| 6. Dog = meals + meds + walks; cat = meals + meds + water | `routineDefaults` flags, dog template walks, progress copy | Change one defaults table + data backfill of `streak_critical`. |
| 7. Invite-only beta | Profiles, landing page | Open beta → store listings, production privacy labels; deferred deep linking worth adding. |
| 8. G1 ≥40% invites created in 7 days | Nothing in the app (SQL aggregates) | Thresholds only. |
| Ruling 1 + Eyup 2026-11-23: v5 tick rows, first tapper credited | §3.3, §3.5, ADR 0004, planner "tick exists" | Event log → random ids, undo = insert `action: 'undo'`, fold in `@petos/domain/streak`, planner reads folded state. Contained in `data/mutations` + `streak`. |
| Ruling 2: rest days today only, no limit | Today's rest-day action | A limit adds a counter and "out of rest days" copy. |
| Ruling 5: one pet per card | Share UI on the pet tab | Multi-pet → pet picker on the share sheet; RPC `pet_ids[]`. |
| Ruling 6: no typable code | Join entry by link only | Add "Have a code?" field calling `accept_invite` with a code. |
| Ruling 8: silent push deferred | Reminder copy says "check Today" | Build C-P1/C-P2 (registration, data handler). |
| Ruling 10: crash reports default off | Consent defaults | One-line default change if the lawyer says strictly necessary. |
| Stack: PowerSync / Supabase Auth / Cloudflare / Sentry | §3, §9, ADR 0008, C-P5 | Swap behind `data/*`, `fetchCredentials`, Worker adapter, `reportError` respectively. |

## 15. Open questions

- **O1 (UX):** Tab set (Today / Routine / Health / Pet / Settings) is a placeholder; an "all pets" Today for multi-pet mornings is worth a prototype test (PO Q4). Data model supports it.
- **O2 (UX):** Does the Apple re-auth system sheet at deletion still read as "3 taps"?
- **O3 (backend):** Final signatures of `preview_invite` / `accept_invite` and the stable error-code list (C-B7).
- **O4 (week-one spikes, unverified):** native Apple/Google ID-token sign-in with Supabase; Hermes `Intl` time zones (Luxon) and `PluralRules`; op-sqlite with pnpm on SDK 58; `INSERT OR IGNORE` on PowerSync views (we avoid relying on it); PowerSync free-plan inactivity during quiet beta weeks.
- **O5:** iPad off (`supportsTablet: false`) for the beta. Reversible.

## 16. Revision log (round 2, 2026-11-22)

| Finding | Fix (section) |
|---|---|
| Arch M-1 blanket `PUT → upsert` | Per-table write map, connector tests per table (§3.3, C-B4) |
| Arch M-2 random ids on keyed rows | v5 ids for `rest_day`, `pet_place`, `reminder_pref`; `vet_contact = household_id`; `notification_settings = user_id`; namespaces in `@petos/domain/ids` (§3.1) |
| Arch M-3 queued care-card create/turn-off | Online `create/rotate/revoke_care_card_link` with "needs a connection"; content PATCH only (§10.3) |
| Arch M-4 creator membership via server trigger | Client bootstrap insert of `household_member` in the same transaction, no `RETURNING` (§3.3, C-B3) |
| Arch M-5 discard on any 4xx | Discard only on `22xxx`/`23xxx`/`42501`/`P0001`; retry 401 after refresh, 408, 429, 5xx, network (§3.4) |
| Arch M-6 rest day counted as complete; provisional only today | Backend rules via shared `provisionalStreak` over all unclosed days; rest day bridges without adding; today-only rest days (§3.6) |
| Arch M-7 no display name | `name` step in onboarding and join; `profiles.display_name`, bootstrap row, `accept_invite(p_display_name)` (§4) |
| Arch M-8..M-13 (SHOULD) | C-B1 rewritten to backend names; task remove = `ends_on`; join without code + queue flush; Apple re-auth at deletion + `functions.invoke('delete-account')`; local tick idempotency check; replace-links sheet; one `@petos/domain` package with module owners (§3.3, §4, §9.5, §10, C-B6) |
| PO M-1 tick model | Ruling 1 kept the v5 row model; Eyup (2026-11-23) chose first-tapper credit, done server-side by a trigger; silent credit flip (§3.5) |
| PO M-2 undo of someone else's tick | Confirmation "Ana marked this done at 07:58. Mark as not done?" (§3.5) |
| PO M-3 invited partner sees pet screens | Join path skips pet creation: sign in → name → join sheet → consent → Today (§4.2) |
| PO M-4 silent leave / pet deletion on join | `preview_invite` + explicit join sheet naming what's left and who stays; pets always come along, never deleted in the join flow (§4.3) |
| PO S-M1/S-M2/S-M3/S-M5/S-M6 | Yesterday row; offline account copy; "done for the streak" copy + marker; "Warsaw time" label; household time-zone setting (§3.2, §3.5, §3.6, §4.1, §10.4) |
| Privacy M1 live card links after removal | Replace-links sheet after removal + Settings → Care cards list with last opened, replace, turn off (§10.2, §10.3) |
| Privacy M2 public-link warning | Copy on share sheet and editor (§10.3) |
| Privacy M3 consent per device; deleted user's other devices; Apple refresh token | `consent.v1:<userId>`, cleared on sign-out/deletion, profile wins after sign-in; local wipe on revoked/deleted user; no Apple code at sign-in, fresh code at deletion (§3.7, §9) |
| Privacy M4 `/c/*` app link | `/i/*` only; card preview in the browser (§11) |
| Privacy B4 / P3 (shared) | `owner_contacts[].user_id` pre-fill for "me"; scrubber list in `services/errors` (§10.3, C-P5) |
| Ruling 4 card wording, plaintext 256-bit token | "Marked done" or nothing; token member-readable, scrubbed (§10.3, C-P8) |
| Ruling 5 one pet per card | `p_pet_id`, `care_card_link.pet_id` (§10.3, C-B1) |
| Ruling 6 no typable code | Removed; beta landing handles install (§4.2, §10.1, §12) |
| Ruling 7 web deletion | Info page + email runbook; Apple revocation not possible on that path (§9.5) |
| Ruling 8 silent push deferred | C-P1/C-P2 marked deferred; reminder copy "check Today" (§13.2) |
| Ruling 9 metrics from SQL | Client sends only consented product events (C-P4) |
| Ruling 10 crash reports off | Default off (§4.1, C-P4) |
| Ruling 13 field names | Backend names throughout; `user_settings` dropped for `profiles.locale` (§6, C-B1) |

## 17. Revision log (2026-11-23, owner role)

| Change | Fix (section) |
|---|---|
| Eyup: one owner + members replaces equal rights (spec need 2; backend §8.5, §18; ADR 0019) | `isOwner = household.owner_id === me`; owner-only Invite, Remove, Rename, Time zone, Transfer, Delete household; members get a read-only Household screen with Leave (§2.2, §2.3, §10.0, §10.4) |
| New RPCs | `leave_household`, `transfer_ownership`, `delete_household`; `remove_member` owner-only, no self; invites owner-only and synced to the owner only (§10.1, §10.2, C-B1, C-B7) |
| Owner leaving / deleting account / joining elsewhere | Confirmations name the next owner ("Tomek becomes the owner") or the pets deleted with the last member; join sheet uses `my_current.new_owner_name` (§4.3, §9.5, §10.2) |
| New error keys | `not_owner`, `cannot_remove_self`, `owner_must_be_member`, `owner_must_transfer` → `app.error.*` in both locale files (§5, C-B7) |

