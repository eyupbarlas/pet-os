# 02 — Platform services design (MVP, draft, revision 2)

- **Author:** platform-services architect (agent)
- **Date:** 2026-11-22 (revision 2 after reviews `03_*` and rulings `docs/architecture/mvp/reviews/rulings.md`)
- **Input:** `docs/specs/001-mvp/spec.md` (status `approved`, Eyup 2026-11-22, with the confirmed
  answers in the Decisions section of `docs/specs/001-mvp/spec.md`). `docs/research/stack-choice.md`, with the stack
  Eyup confirmed: Expo, Supabase Frankfurt + Supabase Auth, PowerSync Cloud free, Expo push,
  Cloudflare for web pages, PostHog EU, Sentry EU, Resend. `pet-os-context`. Backend field names
  win (ruling 13).
- **Scope:** everything around the core: reminders and push, consent, analytics, error
  tracking, email, the web front end (care card, invite landing, deletion page, privacy
  notice), DNS, uptime, environments and secrets, config, cost. **Not in this MVP:** vet
  finder and maps (answer 1), payments, partner APIs.
- **ADR drafts:** `docs/adr/0020`–`0026`.

> Verification: vendor facts with a source were checked on 2026-11-22. Context7 was not loaded
> in this session, so the tools-registry fallback was used: WebSearch/WebFetch on vendor pages.
> Anything marked **unverified** was not confirmed from a primary source.

---

## 1. Summary

- **Reminders are local.** Each phone plans and schedules its own member's reminders and the
  daily streak nudge as one-shot local notifications.
  - Task times follow the **household's** time zone.
  - Quiet time follows the **device's** time zone.
  - No server is involved.

  ADR 0020.
- **No server push in the first beta build.** The silent "sync now" push is a **planned
  follow-up** (ruling 8). We build it only if testers report reminders for tasks that were
  already done. Until then, reminder copy says "check Today". ADR 0021.
- **Consent.** PostHog EU (usage stats) and Sentry EU (crash reports) each have their own
  switch. Both are **off by default** (ruling 10). Neither SDK is initialised until its switch is
  on, and consent belongs to the signed-in person, not the device. ADRs 0022 and 0023.
- **Gate metrics come from SQL aggregates** in a non-exposed `analytics` schema: G1, the G3
  streak numbers and G2 card views (ruling 9). PostHog only gets consented product events.
- **The web is a plain Cloudflare Worker.** It serves:
  - the care card (one pet per link, 256-bit plaintext token as in ADR 0018);
  - the invite landing page;
  - an EN/PL deletion **explainer** page (in-app path, or request by email, handled by a
    manual runbook; ruling 7);
  - the EN/PL **beta privacy notice**;
  - the app-link files, which claim `/i/*` only.

  It reads data through narrow anon RPCs only. ADR 0024.
- **Email goes through Resend**, set as Supabase's custom SMTP, with one bilingual PL-then-EN
  template per auth email (P-7). The in-app deletion job sends a bilingual "deleted" receipt.
  ADR 0025.
- **There is no feature-flag vendor.** An `app_config` RPC is the kill switch. ADR 0026.
- **Platform services cost about $0–3 a month** at ≤100 users. The whole stack is about $35 a
  month (§11).

## 2. Service map

| Role | Vendor / mechanism | Region | MVP cost (≤100 users) | Notes |
|---|---|---|---|---|
| Care reminders, streak nudge | `expo-notifications` **local** notifications | On device | $0 | §3 |
| Cross-member "sync now" push | **Expo Push**, a **planned follow-up**, not in the first beta build | US (Expo) | $0: "There is no cost associated with sending notifications through Expo push notification service" ([Expo push FAQ](https://docs.expo.dev/push-notifications/faq/), 2026-11-22) | §3.6 |
| Product analytics (consented product events) | **PostHog EU Cloud** | Frankfurt | $0: 1M events a month free, no card ([PostHog pricing](https://posthog.com/pricing), 2026-11-22) | §5 |
| Gate metrics (G1, G3 streak, G2 views) | **SQL views** in a non-exposed `analytics` schema (backend B10) | Frankfurt | $0 | Aggregates only. §5.2 |
| Error and crash tracking | **Sentry, EU org** (`@sentry/react-native` + Expo plugin) | Frankfurt (choose at org creation) | $0 on Developer: 1 user, 5k errors a month, 30-day lookback. Team is $26–29 ([Sentry pricing](https://sentry.io/pricing/), 2026-11-22) | Own switch, default off, no user identity. §6 |
| Feature flags | **None**; an `app_config` RPC | Frankfurt | $0 | §10 |
| Transactional email | **Resend** as Supabase custom SMTP, plus the API from `delete-account` | EU sending, US storage | $0: 3,000 a month, **100 a day**, 3 domains ([Resend pricing](https://resend.com/pricing), 2026-11-22) | §7 |
| Web front end | **Cloudflare Workers** (plain Worker + static assets) | Global edge | $0: 100k requests a day; static asset requests "free and unlimited" ([CF Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), 2026-11-22) | §8 |
| DNS, inbound email forwarding | **Cloudflare DNS + Email Routing** | Global | $0 (**unverified**) | `support@` and `privacy@` forward to the founders |
| Uptime | **Better Stack free**; fallback is a GitHub Actions cron | EU | $0 (commercial use **unverified**) | §9 |
| Consent-free crash baseline | App Store Connect / TestFlight crash reports, Play Console vitals | n/a | $0 | No SDK |

Compared with the research report: **Tolgee** is removed (in-house JSON), **Google Places** is
out of the MVP, and **Vercel** and **Turnstile** are not needed.

## 3. Notifications design

### 3.1 What notifies, and how

| Notification | Mechanism | Who | Default | Spec |
|---|---|---|---|---|
| Task reminder ("Breakfast for Luna, 08:00") | Local, one-shot per occurrence | Each member, per task they switched on | **Off** (spec: "can turn reminders on per task") | Need 7 |
| Streak nudge (at most 1 a day, covers all pets) | Local, one-shot per household day | Each member who enabled it | Off. Offered **in context after the member's first completed day**, with a pre-prompt (S-P6) | Needs 6, 7 |
| "Sync now" after another member's change | Remote, data-only Expo push | Other members' devices | **Planned follow-up**, not in the first beta build (ruling 8) | Supports needs 5, 7 |
| Visible "Partner fed Luna" | Not in the MVP | n/a | n/a | PO ruling R5 |

**Why local first.** Reminders must fire with no signal (walks, lifts, cellars), in local
time, and with no server cost or cron. ADR 0020.

### 3.2 Planning model: one pure function, re-run often

The planner lives in `packages/domain` (owner: mobile; platform reviews). It is pure,
deterministic and unit-tested with DST fixtures. Field names follow the backend schema
(rulings 1 and 13).

```ts
planNotifications(input: {
  now: Instant;                        // UTC instant
  householdTz: string;                 // household.timezone, e.g. "Europe/Warsaw"
  deviceTz: string;                    // device's current zone, for quiet time only (S-P1)
  locale: "en_US" | "pl_PL";
  pets: { id; name; species }[];
  tasks: { id; pet_id; kind; title: string | null; template_key: string | null;
           time_of_day: "HH:MM" | null;            // null = any time today
           every_n_days: number; anchor_date: LocalDate; ends_on: LocalDate | null;
           paused: boolean; streak_critical: boolean }[];
  ticks: { task_id; local_date: LocalDate; slot: 0; actor_id: string | null; client_at }[];
                                                    // ruling 1: one row per task per day; row present = done
  restDays: { pet_id; local_date: LocalDate }[];
  myReminderPrefs: { task_id; enabled: boolean; anytime_remind_at: "HH:MM" | null }[];
  mySettings: { quiet_start: "22:00"; quiet_end: "07:00"; nudge_enabled: boolean; nudge_at: "19:00" };
  provisional: { pet_id; todayComplete: boolean }[]; // from the shared provisionalStreak/isDayComplete
}): PlannedNotification[]   // { id, fireAt: Instant, titleKey, bodyKey, params, channel, data }
```

Rules the planner applies:

1. **Occurrences in household local time.** For each enabled task, walk the local dates in
   the window. Keep a date when all of these hold:
   - `date >= anchor_date`;
   - `(date - anchor_date) % every_n_days == 0`;
   - `ends_on` is null or `date <= ends_on`;
   - the task is not paused.

   Fire at `time_of_day`. For "any time today" tasks, fire at the member's
   `anytime_remind_at`. If that is null, use the **template's default remind time**: morning
   walk 09:00, evening walk 19:00, anything else 18:00. These defaults ship as data with the
   routine templates (S-P2). Convert local wall time to an instant **in `householdTz`**.
2. **DST.** Spring forward (a gap): shift to the first valid minute. Fall back (a fold): use
   the **first** occurrence. Day boundaries are household local midnight. Fixtures cover the
   last weekends of March and October in Europe/Warsaw.
3. **Already done.** Skip an occurrence when a `tick` row exists for
   `(task_id, local_date, slot = 0)`. Under ruling 1, an undo deletes the row, so the
   occurrence becomes plannable again.
4. **Quiet time is evaluated in the device's current zone** (S-P1, PO ruling R6). A task
   reminder whose fire instant falls inside the member's quiet window, read in `deviceTz`,
   moves to `quiet_end` if that is still the same **household** day. Otherwise it is dropped.
   A nudge in quiet time is dropped. Fixture: a member in New York, household in Warsaw.
5. **Streak nudge, at most one a day.** There is one candidate per household day, with the
   deterministic id `n:<localDate>`, at `nudge_at` (household time). It is scheduled only if
   at least one pet has open streak-critical tasks and the day is not complete.
   - Streak-critical: **dog meals + meds + walks; cat meals + meds + fresh water**
     (answer 6). It comes from `task.streak_critical`, which is read-only in the MVP.
   - **A pet with a rest day today counts as complete for the nudge** (S-P3). Task reminders
     are unaffected.
   - Copy is neutral, e.g. "Today's care for Luna is still open". No guilt and no
     first-person pet voice.
6. **Rolling window and the iOS cap.** Plan `min(7 days, 56 notifications)`, earliest first.
   iOS keeps at most 64 pending (Apple limit, **unverified** this session).
7. **Identifiers:** `r:<taskId>:<localDate>:0` and `n:<localDate>`.

`applyPlan(plan)` diffs against `getAllScheduledNotificationsAsync()`, cancels what is gone
and schedules what is new with **DATE triggers**. We use no repeating triggers.

**Re-plan triggers:**
- app start and foreground;
- after any sync batch touching `task`, `tick`, `rest_day`, `reminder_pref`,
  `notification_settings`, `pet` or `household`;
- app language change;
- device time zone change;
- a best-effort background task (`expo-background-task`, **unverified** for SDK 58);
- later, when the follow-up push exists, after a "sync now" push.

### 3.3 Text and language

Notification text comes from `notif.*` keys in `en_US.json` / `pl_PL.json`. It is rendered at
schedule time in the app language, with Polish plurals handled by the i18n library. Local
notifications may include pet and task names, which never leave the device. "Hide details on
lock screen" is a later candidate.

### 3.4 Permissions and channels

- Ask for the OS permission **in context**: the first time a reminder is turned on, or when
  the nudge is offered after the first completed day. Show a pre-prompt first. Never ask at
  launch. Android 13+ needs `POST_NOTIFICATIONS`.
- Android channels, with localised names: `care_reminders` and `streak_nudge`.
- **Do not request `SCHEDULE_EXACT_ALARM`.** Android 14+ denies it by default, and
  notifications then "arrive at an approximate time"
  ([expo-notifications](https://docs.expo.dev/versions/latest/sdk/notifications/),
  2026-11-22).
- A tap deep-links to Today for that pet. No "Mark done" action on the notification.

### 3.5 Household time zone vs the device's time zone

Task times and the day boundary follow the household zone. Quiet time follows the device
(§3.2 rule 4). When the device zone differs from the household zone, the app labels times
"Warsaw time" (mobile, S-M5).

### 3.6 "Sync now" push: planned follow-up (not in the first beta build)

**Status:** designed but not built (ruling 8). Build it after the first beta build, **only
if** testers report reminders for tasks that were already done. Until then:
- reminder copy says "check Today" and never "feed Luna now";
- the tap opens Today, which shows "Done by Ana";
- a removed member loses access on the next sync (the acceptance criterion).

When it is built:
- **Trigger:** `tick` insert **and delete** (ruling 1), and changes to `task`, `rest_day`,
  `household_member` and `care_card_link`. A DB trigger calls the Edge Function
  `notify-household` via pg_net. The secret it sends lives in **Supabase Vault**, never in a
  migration (P2). The function rejects any caller without it, using a constant-time compare.
- **Recipients come from the database only**, never from the request body. On member
  removal, compute recipients **before** `left_at` is applied, so the removed member's
  devices also sync.
- **Payload:** `{ "t": "sync" }`, data-only, no names, no IDs. Debounce: 1 push per device per
  2 minutes. On `DeviceNotRegistered`, delete the token.
- **Phone side:** sync, then re-plan. Best effort: iOS throttles silent pushes, and Android
  delays them in Doze.
- **Prerequisites:** `push_device`, the register/unregister RPCs, an Expo access token, and a
  week-1-style spike on iOS silent delivery. Contracts M3, M4, B2 and B3 are marked
  "follow-up".

## 4. Consent flow

**Principle:** nothing that reads device data for analytics or diagnostics is **initialised**
before opt-in. `defaultOptIn: false` exists in PostHog RN ("the SDK will not track until the
`optIn()` function is called", [PostHog RN docs](https://posthog.com/docs/libraries/react-native),
2026-11-22). Its opted-out disk behaviour is undocumented, so the client is **not mounted at
all** until consent is true, and `defaultOptIn: false` is a second guard. Sentry is not
initialised until its own switch is on.

**Flow**

1. Pet-first onboarding (need 1) collects **nothing**. No PostHog, no Sentry.
2. After the account step and the display-name step (ruling 12), show "Help us improve Pet
   OS". It has three switches, **all off by default**, each with one plain line (tested in
   Polish at 200% font size):
   - **"Share usage stats"** → PostHog.
   - **"Send crash reports"** → Sentry. Default **off** for the beta (ruling 10).
   - **"Product news by email"** → recorded only. Nothing in the MVP sends marketing.

   "Not now" is equally prominent. The screen links to the **beta privacy notice** (§8.5).
3. **Consent belongs to the person** (privacy M3):
   - Source of truth: `profiles.consent_usage_stats`, `consent_crash_reports`,
     `consent_marketing`, `consent_updated_at`, `consent_policy_version` (synced to the owner
     only).
   - Local cache: `consent.v1.<user_id>`, read synchronously at boot **only when a session
     exists for that user**.
   - **On sign-out and on account deletion:** stop the SDKs and clear the cache.
   - After sign-in, the profile value wins. With no profile decision, ask.
4. Usage stats on → mount `PostHogProvider`, then `identify(user.id)` (the Supabase UUID).
   Off → `optOut()`, `reset()`, unmount.
5. Crash reports on → `Sentry.init()`, and from then on at boot. Off → `Sentry.close()`, and
   no `init` on the next launch. Never `setUser`.
6. A new policy version re-asks once.
7. **Before consent**, errors are not sent anywhere. The baseline is TestFlight/App Store
   Connect and Play vitals. With about 100 invited testers, the team can simply ask people to
   turn crash reports on.
8. **Auth session** is strictly necessary. A push token (when the follow-up push exists) is
   strictly necessary for a feature the user asked for, and is registered after sign-in only.

**LATER [lawyer]:** is crash reporting strictly necessary under PKE art. 399? If yes, its
default becomes on. That is a one-line change.

## 5. Analytics

### 5.1 PostHog: consented product events only

Setup:
- `host: "https://eu.i.posthog.com"`; **autocapture of touches off**; **session replay off**;
  `captureAppLifecycleEvents: true` (product engagement, not gate metrics).
- Super properties: `app_version`, `platform`, `locale`, `env`. Person properties: `locale`,
  `household_size`, `pets_count`.
- **Never sent:** names, emails, free text, pet names, notes, meds, tokens.
- **Scrubbing (P3):**
  - Turn on "discard client IP data" in the project (**exact setting name unverified**).
  - Screen tracking sends **route names only** (e.g. `invite`, `today`), never URLs or
    params. That way `$current_url` and `$screen_name` cannot carry `/i/<token>` or
    `/c/<token>`.
  - A `beforeSend`-style property filter (or the wrapper) drops any property whose value
    matches the token patterns in §6.
- Use the one typed wrapper `track()`. A lint rule bans other imports of
  `posthog-react-native`.
- Dev builds never send.

| Event | Key properties | Used for |
|---|---|---|
| `signup_completed` | `method` (apple/google/email) | Funnel |
| `household_invite_created` | `household_id`, `days_since_household_created` | G1 support (primary G1 number is in SQL) |
| `household_invite_accepted` | `household_id`, `invitee_was_new_user`, `hours_since_invite` | G1 secondary support |
| `pet_added` | `species` | Funnel |
| `task_ticked` | `species`, `task_kind` (meal/walk/water/litter/med/custom), `by_household_creator`, `was_offline`, `source` (today/notification) | Tick behaviour (G1 ticks per pet are in SQL) |
| `task_unticked` | `task_kind`, `own_tick` (bool) | Quality, undo confirm (PO M-2) |
| `routine_edited` | `action` (add/edit/reorder/pause/remove), `task_kind` | Need 4 usage |
| `rest_day_marked` | — | Feature use |
| `notification_permission_result` | `granted`, `context` (reminder/nudge) | G3 reminder opt-in (product view) |
| `reminder_toggled` | `task_kind`, `enabled` | G3 reminder opt-in/out |
| `nudge_toggled` | `enabled` | G3 |
| `notification_opened` | `type` (reminder/nudge) | Reminder value |
| `care_card_created` / `care_card_revoked` | — | G2 support |
| `partner_link_tapped` | `partner` (psibufet/booksy/own_shop), `species` | Partner paths |
| `language_changed` | `to` | i18n |
| `streak_reset_seen` | — | Copy check (PO R11); optional |

**Removed** compared with revision 1 (P-3, ruling 9): `streak_day_completed`,
`streak_milestone_reached`, `paw_pass_used`, `streak_reset` and cross-member `$insert_id`
dedupe. These come from SQL now.

Volume: about 100 users × about 30 events a day is about 90k a month, against 1M free.

### 5.2 Gate metrics from SQL aggregates (backend B10, ruling 9)

These are views in an `analytics` schema. The schema is **not** in PostgREST's exposed schemas
and has **no** grants to `anon` or `authenticated`. Only the team queries them in the SQL
editor. Conditions from privacy R3:
- results are aggregates only;
- nobody looks at individual rows for metrics;
- nothing is joined with PostHog identities;
- results stay with the team;
- the privacy notice has one line about it.

| Metric | Definition | Source |
|---|---|---|
| **G1 primary** | % of households with **≥1 invite created within 7 days** of household creation. Target ≥40% | `invite`, `household` |
| G1 secondary | % of those invites **accepted** (within the 7-day validity) | `invite`, `household_member` |
| G1 funnel | invite created → **landing page opened** (`invite.landing_view_count > 0`) → accepted | `invite` (§8.3) |
| G1 | Ticks per active pet per day; % of ticks by non-creators (`actor_id` ≠ household creator) | `tick`, `household` |
| G3 | % of active pets reaching `streak_after >= 7` | `streak_day` |
| G3 | Paw-pass use per pet-month; streak resets | `streak_day` |
| G3 | **D30 retention**: share of members active in days 28–32 after joining ("active" = ≥1 tick that day, or a check-in if backend records one; open question 2) | `tick`, `household_member` (backend to confirm the activity signal) |
| G3 | Reminder opt-in: % of members with ≥1 `reminder_pref.enabled` or `nudge_enabled` | `reminder_pref`, `notification_settings` |
| G2 | Care cards created; % opened at least once (`view_count > 0`) | `care_card_link` |

PostHog's opt-in rate is itself reported from SQL: the share of users with
`consent_usage_stats = true`.

## 6. Error and crash tracking: Sentry EU

- **SDK:** `@sentry/react-native` with its Expo config plugin, in a **new EU org** (the region
  is chosen at creation). EAS builds upload Hermes source maps and native symbols.
- **Plan:** Developer (free): 1 user, 5,000 errors a month, 30-day lookback. Team is $26–29
  when a second builder needs access ([Sentry pricing](https://sentry.io/pricing/), 2026-11-22).
- **Consent-gated, default off** (§4, ruling 10).
- **Settings:** `sendDefaultPii: false`; **no `setUser`**; replay, profiling and tracing off
  (`tracesSampleRate: 0`). Server-side, turn on "prevent storing IP addresses" (**setting
  name unverified**).
- **Scrubber (P3).** `beforeSend` and `beforeBreadcrumb` apply one shared function,
  `scrubSensitive()`, also used by the PostHog wrapper and the Worker logs. It does the
  following:
  - Replace path tokens: `/c/<anything>` → `/c/[redacted]`, `/i/<anything>` → `/i/[redacted]`.
  - Strip the `t` query parameter (`?t=` / `&t=`) and the `token`, `code`, `access_token`
    and `refresh_token` parameters, including in URL fragments (Supabase auth redirects put
    tokens in `#access_token=`).
  - Drop `Authorization`, `apikey`, `Cookie` and `Set-Cookie` headers from request data.
  - On `http`/`fetch`/`xhr` breadcrumbs, drop the **whole query string and fragment** and
    keep only method, host, path (after token replacement) and status.
  - Drop `console` breadcrumbs' arguments beyond the message template, and drop navigation
    breadcrumbs' params.
  - Drop request bodies entirely.
  - Unit-test it with fixtures for each pattern.
- **Deletion:** no identity, so the deletion job does not call Sentry. Events age out at 30
  days.
- **Wrapper:** `reportError(err, ctx)` and a root `ErrorBoundary`. Both are no-ops while crash
  reports are off. A lint rule bans other `@sentry/*` imports.
- **Server side:** Edge Functions and the Worker log to Supabase and Workers logs, with the
  same redaction (§8.6).
- **Considered and not chosen:** PostHog error tracking (ADR 0023).

## 7. Transactional email (Resend)

| Email | Trigger | Sent by |
|---|---|---|
| Sign-in OTP, email change | Supabase Auth | **Resend as custom SMTP** in Supabase. One template per email type, **Polish first, then English**, in the same message (P-7) |
| "Your account was deleted" receipt | End of the `delete-account` job (in-app, or run by hand from the runbook) | `delete-account` Edge Function → Resend API. Text from `email.*` keys, in the user's `locale` |
| Partner invite | Not email; a share link | n/a |
| Web deletion confirmation | Not in the MVP (ruling 7). Requests arrive by email to `privacy@` | Human reply |

- The auth templates live in the Supabase config in git (`supabase/templates/*.html`). Their
  strings are copied from `email.*` keys by a small build script, so the JSON files stay the
  source. **Later:** move to the Send Email Hook (**unverified**) when a third language or
  richer templates are needed.
- No tracking pixels, and Resend's open/click tracking is off.
- **Domain:** `no-reply@mail.healthypaws.io`, with SPF, DKIM and DMARC (`p=none`) in Cloudflare DNS
  and the EU sending region. US storage goes under "before public launch".
- **Limit:** 100 a day on the free plan is plenty without a public form.

## 8. Web front end

### 8.1 Hosting choice

A **plain Cloudflare Worker** (TypeScript, optionally Hono). HTML is rendered on the server,
there is no client JS, and the inline CSS comes from the theme-token layer. Static assets are
served by Workers static assets. The alternatives (Expo Router web SSR, Supabase Edge
Functions, Vercel, Netlify) are compared in ADR 0024.

### 8.2 Routes

| Route | Purpose | Data |
|---|---|---|
| `/c/:token` | Care card, **one pet**, read-only, **web only** | RPC `get_care_card(p_token)` |
| `/i/:token` | Invite landing: app link target; fallback page with install steps | RPC `record_invite_landing(p_token)` (count only) |
| `/en/delete-account`, `/pl/usun-konto` | Deletion **explainer** (Google Play web URL). Polish slug: privacy P6 asks to confirm it with mobile | Static |
| `/en/privacy`, `/pl/prywatnosc` | **Beta privacy notice** (P5) | Static |
| `/en/terms`, `/pl/regulamin` | Beta terms (16+) | Static |
| `/.well-known/apple-app-site-association`, `/.well-known/assetlinks.json` | Universal links / App Links for **`/i/*` only** (ruling 3) | Static |
| `/robots.txt` | `User-agent: * / Allow: /`. **No `Disallow: /c/`**: crawlers must fetch the page to see `noindex` | Static |
| `/healthz` | Uptime | RPC `health()` |

### 8.3 Care card read path (aligned with ADR 0018)

1. Browser → `GET /c/:token`. The Worker checks the format: **exactly 43 base64url
   characters** (`gen_random_bytes(32)`, 256 bits). Anything else returns the generic 410
   page with no DB call.
2. The Worker calls `POST {SUPABASE_URL}/rest/v1/rpc/get_care_card` with the **anon/publishable
   key** and body `{ p_token }`.
   - The function is `SECURITY DEFINER` and looks up `care_card_link.token = p_token`. The
     token is **plaintext**, readable by active members through RLS, so any member can
     re-share it (ADR 0018).
   - It checks `revoked_at IS NULL`.
   - It selects **the one pet** with `pet.id = card.pet_id and pet.household_id =
     card.household_id` (privacy B1).
   - It computes "today" in the household time zone and increments `view_count`.
   - It returns NULL when the card is unknown or revoked.
3. **Copy for today's tasks (ruling 4, PO P-M2):**
   - A done task shows **"Marked done"**. A task that is not done shows **nothing**: never
     "Not done", "missed" or "overdue".
   - No names, no times of ticking.
   - One line under the list: "The family marks tasks in the Pet OS app."
   - Keys: `web.careCard.markedDone`, `web.careCard.marksExplainer`.
4. Language: `?lang=` first, then the card's `lang`, then `Accept-Language`. There is a
   language toggle.
5. A NULL result gives **410** with "This care card is no longer available" (EN/PL). The
   same page is used for malformed tokens.
6. **Headers:**
   - `Cache-Control: no-store`;
   - `X-Robots-Tag: noindex, nofollow, noarchive`, plus a matching
     `<meta name="robots" content="noindex, nofollow, noarchive">`;
   - `Referrer-Policy: no-referrer`;
   - `Content-Security-Policy: default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'`;
   - `X-Content-Type-Options: nosniff`.

   **No scripts, no cookies, no analytics.**
7. **Meta and Open Graph tags are generic** (privacy R2): `<title>` and `og:title` are "Pet OS
   care card" / "Karta opieki Pet OS". There is no description containing contacts, meds,
   notes or the pet's name, and no `og:image` with data. Chat apps fetch link previews, so
   meta tags must never carry card content.
8. Freshness: every request reads the DB.

The **public-link warning** on the share screen and card editor is mobile's (privacy M2): "Anyone
with this link can see this card. Don't add door codes or your address." The same line appears
in small print on the card page footer.

### 8.4 Invite landing (`/i/:token`)

- With the app installed, the universal or app link opens the app, which redeems the token
  (ruling 11 join flow).
- Without the app, the Worker serves a fallback page in EN/PL, with numbered steps per
  platform:
  - iOS: install TestFlight, then join with the public TestFlight link.
  - Android: join the Play closed-testing group, then install.
  - Then "Open this link again on your phone".
- There is **no typable code** (ruling 6), no inviter name and no pet name. The page shows no
  household data, so a leaked link reveals nothing.
- **Count only (PO P-M3):** the Worker calls `record_invite_landing(p_token)`, an anon
  `SECURITY DEFINER` RPC. It increments `invite.landing_view_count` when the invite is open
  and returns `{ open: boolean }`. It stores no IP and no user agent. A closed or expired
  invite shows "This invite has expired, ask for a new link". This adds a **fourth** anon RPC
  (backend: add it to the CI grant check).
- Headers are the same as the care card. Logs redact the path.

### 8.5 Beta privacy notice (P5)

`/en/privacy` and `/pl/prywatnosc` are one plain page each, not the lawyer-final version. They
are linked from the consent screen, the deletion pages, the invite landing, the app's Settings
and the TestFlight/Play test listings. Contents:
1. Who we are, with contact at `privacy@healthypaws.io`.
2. What data we use and why: account (email, display name), pets and care data, household
   membership and attribution, care-card contents.
3. **First-party aggregate metrics** from service data, with no consent needed, aggregates
   only (privacy R3).
4. **Opt-in** usage stats (PostHog EU) and crash reports (Sentry EU). Both off by default, and
   changeable in Settings.
5. Vendors and regions:
   - Supabase, Frankfurt;
   - PowerSync;
   - PostHog EU;
   - Sentry EU;
   - Resend (EU sending, **US storage**);
   - Cloudflare (global edge);
   - Expo push (US, only once the follow-up push ships);
   - Apple and Google (sign-in, app stores).
6. **A care card is public to anyone with the link** until a member turns it off.
7. What deletion removes and what stays: ticks stay in the household's history without your
   name, and household content stays with the other members. Your contact entries are
   removed from cards. Deletion takes up to 30 days for email requests.
8. Backup retention (Supabase backups, period per backend).
9. Your rights, and the right to complain to the **UODO** (Polish data protection authority).
10. Age: 16+.

### 8.6 Public deletion page (ruling 7: explainer + email + runbook)

`/en/delete-account` and `/pl/usun-konto` are static pages. They explain:
- **In the app:** Settings → Account → Delete account (3 taps; Apple users re-authenticate).
- **Without the app:** email `privacy@healthypaws.io` **from the address on your account** with
  the subject "Delete my account". We reply and delete within **30 days**, usually within a
  few days.
- What is deleted and what stays (same text as the privacy notice, point 7).

**Manual runbook** (in the repo with the other runbooks):
1. Check the sender matches an account email. If it doesn't, reply asking them to write from
   that address or use the app. Apple private-relay users can find the relay address in their
   Apple ID settings.
2. Run the same `delete-account` job for that user ID from an admin script. It uses the
   service-role key, from a founder's machine, never in CI.
3. Confirm by reply, and record the date in the deletion log (no content beyond user UUID and
   date).

There is no Turnstile, no `deletion_request` table, no request or confirm Edge Functions and
no Worker secret. The automated self-serve flow (revision 1 §8.4) is parked under "before
public launch". The privacy reviewer confirms the fit with Google Play's "request deletion"
web requirement.

### 8.7 Worker logging

Workers logs keep method, the redacted path (via the shared `scrubSensitive()`), status and
duration. No query strings, no headers, no bodies. `console.log` with request URLs is banned
by lint in the Worker.

## 9. DNS, uptime, ops

- **DNS:** Cloudflare (free).
  - Apex and `www` → Worker custom domain.
  - `mail.` → Resend SPF, DKIM and DMARC.
  - MX → Cloudflare Email Routing (`support@`, `privacy@` → founders).
  - Domain: a `.pl` or `.app` name, via a Polish registrar if Cloudflare Registrar doesn't
    sell it (**unverified**).
- **Uptime:** Better Stack free (commercial use **unverified**; fallback is a GitHub Actions
  cron every 30 minutes). Two checks: `GET /healthz` (Worker + DNS + Supabase) and the
  PowerSync service URL (path **unverified**).
- **PowerSync free-plan inactivity (P-8):** the free plan may deactivate an idle instance
  (backend §2 cites 1 or 2 weeks). Whether an uptime ping counts as activity is
  **unverified**. Ask PowerSync or test in week 1. Budget Pro ($49) if a deactivation hits
  testers.
- **Status pages:** subscribe to Supabase, PowerSync, Expo, Cloudflare, Resend and Sentry.
- **Spend guards:** Supabase spend cap on; PostHog free with no card; Resend free; no paid
  Cloudflare add-ons.
- **Runbooks (one page each):**
  - rotate a leaked key;
  - revoke all care cards for a household;
  - force an update via `app_config.min_supported_version`;
  - **manual account deletion** (§8.6);
  - **deletion follow-ups:** PostHog person deletion and the receipt email failing (§12.2 B5).

## 10. Environments, secrets, config

**Environments**

| | dev | preview (internal testers) | production |
|---|---|---|---|
| App | EAS channel `development` | EAS channel `preview` | EAS channel `production` (TestFlight external / Play closed testing) |
| Supabase | Local (`supabase start`) | Prod project | Prod project, Frankfurt |
| PowerSync | Local or free dev instance | Prod | Prod |
| Worker | `wrangler dev` | `*.workers.dev` | Custom domain |
| PostHog / Sentry | Disabled | Prod, `env=preview` | Prod, `env=production` |
| Resend | Test key | Prod key | Prod key |

There is no hosted staging. Migrations go through the Supabase CLI, applied by CI.

**Secrets**

| Secret | Lives in | Never in |
|---|---|---|
| Supabase URL, publishable/anon key, PowerSync URL, PostHog project key, Sentry DSN, EAS project ID | App build env (`EXPO_PUBLIC_*`). Public by design | — |
| Supabase URL + publishable key for the Worker | `wrangler` vars | — |
| Supabase service-role key | Edge Function secrets; a founder's password manager for the manual deletion script | App, Worker, git, CI |
| Resend API key and SMTP credentials | Supabase secrets / Auth SMTP settings | App, Worker, git |
| PostHog **personal** API key (person deletion) | Supabase secrets | App, git |
| Apple Sign-in key (revocation at deletion) | Supabase secrets | App, git |
| Sentry auth token (symbol upload) | EAS secrets | App bundle, git |
| **Secrets for functions not called with a user JWT** (today: the cron → `deletion-followup` call; later: `notify-household`, the Send Email Hook) | **Supabase Vault**, read by the SQL that calls `pg_net`. The function holds the same value as an Edge Function secret and compares it in **constant time**. Hooks use the Supabase hook signature instead | Migrations, git, logs |
| Later: Expo push access token | Supabase secrets | App |
| CI tokens (`EXPO_TOKEN`, `SUPABASE_ACCESS_TOKEN`, `CLOUDFLARE_API_TOKEN`) | GitHub Actions secrets | — |

**Rules:**
- Every Edge Function without a user JWT rejects callers without its secret or signature.
- No function logs request bodies, headers or query strings.
- Log lines pass through `scrubSensitive()` (§6), which redacts `/c/`, `/i/`, `t=`, `token`,
  `code` and auth tokens.
- Two admins on every vendor, 2FA everywhere, a shared password-manager vault, `.env*`
  gitignored, and secret scanning on.

**Feature flags: none.** `get_app_config()` (anon) returns `{ min_supported_version,
maintenance_message_key, push_sync_enabled }`. The last field stays `false` until the follow-up
push ships. ADR 0026.

## 11. Cost (monthly, USD)

| Item | ≤100 users (MVP) | ~10k users (what changes) |
|---|---|---|
| Expo push (follow-up) | $0 | $0 |
| PostHog (consented product events) | $0 | $0 under 1M events a month |
| Sentry EU | $0 (1 seat) | $26–29 (Team) |
| Resend | $0 | $20 (Pro) once over 100 a day |
| Cloudflare Workers, DNS, Email Routing | $0 | $0–5 |
| Better Stack | $0 | $0–30 |
| Domain | ~$1–3 | same |
| **Platform services subtotal** | **~$0–3** (+$26–29 if a second builder needs Sentry) | **~$50–90** |
| *Context:* Supabase Pro | $25 | $25–35 |
| *Context:* PowerSync | $0 (Pro $49 if inactivity bites, P-8) | $49 |
| *Context:* EAS | $0 | $19–199 |
| *Context:* Apple Developer ($99 a year) | ~$8 | ~$8 |
| **Whole stack** | **~$35/month** | **~$170–380/month** |

At scale we also add:
- the automated web deletion flow;
- the silent push, if not already built;
- Send Email Hook templates;
- DPAs and TIAs;
- hosted staging;
- Sentry Team.

## 12. Contracts

### 12.1 With the mobile architect

| # | Contract | Shape |
|---|---|---|
| M1 | **Local scheduling API** | `planNotifications(input)` per §3.2, in `packages/domain`. Backend field names. `ends_on` honoured. `slot = 0`. Row present = done (ruling 1). Rest day = complete for the nudge. Quiet time in `deviceTz`. Template default remind times. Plus `applyPlan` and `rescheduleAll(reason)`. IDs `r:<taskId>:<localDate>:0`, `n:<localDate>`. DATE triggers. Window `min(7d, 56)`. Platform owns the rules and the DST, travel and rest-day fixtures. |
| M2 | **Re-plan hooks** | App start/foreground; sync touching task/tick/rest_day/reminder_pref/notification_settings/pet/household; locale change; tz change; background task. |
| M3 | **Push token registration (FOLLOW-UP)** | Not in the first beta build. When built: after sign-in, `getExpoPushTokenAsync({ projectId })` with retry → `rpc('register_push_device', …)`; unregister on sign-out before clearing the session. |
| M4 | **Push handler (FOLLOW-UP)** | `{ t: "sync" }` → sync → `rescheduleAll("push")`. |
| M5 | **Consent gate** | `useConsent()` → `{ usageStats, crashReports, marketing, decidedAt, policyVersion }`, from the profile (source of truth) and the cache `consent.v1.<user_id>` (only with a session for that user). All default **false**. PostHog is mounted only if `usageStats`; `Sentry.init` only if `crashReports`. `setConsent()` writes the profile and the cache. **Sign-out and deletion:** close the SDKs and clear the cache. After sign-in, the profile wins; with no decision, ask. The screen follows the display-name step. |
| M6 | **Analytics wrapper** | `track(event, props)` typed from §5.1. Screen events use route names only. Values pass through `scrubSensitive()`. No streak events. |
| M7 | **Error tracking init** | `@sentry/react-native` + Expo plugin, EU DSN. `Sentry.init({ sendDefaultPii: false, tracesSampleRate: 0, beforeSend: scrubEvent, beforeBreadcrumb: scrubBreadcrumb })` behind M5. No `setUser`. `reportError()` + `ErrorBoundary`. `scrubSensitive()` lives in `packages/domain` with fixtures (§6). |
| M8 | **Deep links** | Universal and App Links for **`https://healthypaws.io/i/*` only**. Card links (`/c/*`) are **web only**; the owner's "preview" opens the system browser. The Worker hosts AASA and assetlinks; mobile supplies the team ID, bundle ID and cert fingerprints. |
| M9 | **i18n** | Shared `en_US.json` / `pl_PL.json` with `app.*`, `notif.*`, `email.*` and `web.*` namespaces. The Worker and the SMTP-template build script import them at build time. Includes `web.careCard.markedDone`, `web.careCard.marksExplainer` and the public-link warning `app.careCard.publicWarning`. |
| M10 | **App config** | `rpc('get_app_config')` at start; an update screen below `min_supported_version`. |
| M11 | **Privacy notice links** | The consent screen, Settings and the deletion-confirmation screen link to `/{en|pl}/privacy`/`prywatnosc` in the app language. Delete-account copy includes "Your ticks stay in the household's history without your name". |

### 12.2 With the backend/sync architect

| # | Contract | Shape |
|---|---|---|
| B1 | **Data for reminders and nudges** | `household.timezone`. `task(pet_id, kind, title, template_key, time_of_day, every_n_days, anchor_date, ends_on, paused, streak_critical)`, with `streak_critical` derived from kind and species and read-only for clients (dog meal/med/walk, cat meal/med/water). `tick(task_id, local_date, slot=0, actor_id, client_at)`, one row per task per day; undo = DELETE (ruling 1). `rest_day(pet_id, local_date)`, today only (ruling 2). `reminder_pref(user_id, task_id, enabled, anytime_remind_at)` and `notification_settings(id=user_id, quiet_start, quiet_end, nudge_enabled, nudge_at)`, owner-only, v5 ids. The routine templates carry `default_remind_at` for "any time" tasks. |
| B2 | **Push device registry (FOLLOW-UP)** | `push_device`, `register_push_device` / `unregister_push_device`, RLS owner-only. Only when the push is built. |
| B3 | **"Sync now" trigger (FOLLOW-UP)** | `tick` insert + delete; changes to task, rest_day, household_member, care_card_link; also from `remove_member`, `leave_household`, `transfer_ownership`, `delete_household` and `accept_invite`. pg_net → `notify-household` with a **Vault-stored secret**. Recipients come from the DB, computed before `left_at`. Not in the first beta build; not counted in the Edge Function list. |
| B4 | **Care-card read** | `get_care_card(p_token text) returns jsonb`, `SECURITY DEFINER`, EXECUTE for `anon`. Looks up **plaintext** `care_card_link.token = p_token` (256-bit, 43 base64url characters, ADR 0018) with `revoked_at IS NULL`. **One pet:** `care_card_link.pet_id`, checked against `household_id` (privacy B1). Returns `{ lang, pet: { name, species, breed?, age_text?, weight? }, today: [{ title, template_key, time?, kind, done: bool }], meds: [{ name, dose, schedule_text }], feeding: [{ title, amount }], vet?: { name, phone, address? }, owner_contacts: [{ first_name, phone }] (≤3, no user_id in output), note, household_today }`. "Today" is computed in the household tz, reusing the streak SQL's due-set. `done` has no names. Side effect: `view_count += 1`, `last_viewed_at = now()`. NULL for unknown or revoked. |
| B5 | **Deletion job** | Edge Function `delete-account`: user JWT (in-app), or called by the founders' admin script with the service role (manual runbook). Data steps are backend's, including stripping the user's `owner_contacts` entries from cards (privacy B4) and revoking open invites on removal or leaving (privacy B2). Platform steps: PostHog person deletion and the bilingual "deleted" receipt via Resend; **the email is read before the auth user is deleted**. **Postgres + Auth deletion is the commit point.** A failed external step writes `deletion_followup(user_id, step, attempts, last_error_at)` (no other PII; the receipt step keeps the email until it is sent, then nulls it). The daily cron retries via the `deletion-followup` function (Vault secret, constant-time compare). After the 3rd failure the founders get an alert. Sentry: no call. Idempotent; returns `{ status: "deleted" }`. |
| B6 | **Web deletion request** | **Removed from the MVP** (ruling 7). No `deletion_request` table and no request/confirm functions. The manual runbook uses B5. |
| B7 | **Auth emails** | OTP. Resend as custom SMTP; templates in `supabase/templates/` (PL then EN). The app sets `locale` in the sign-up metadata, used by the B5 receipt. |
| B8 | **Ops and anon RPCs** | `health()`, `get_app_config()`, `get_care_card()`, and **new** `record_invite_landing(p_token) returns jsonb { open }`, which increments `invite.landing_view_count` (new column, `int not null default 0`). No IP or user agent. These four are the **only** anon-executable functions (CI check). |
| B9 | **Consent fields** | `profiles.consent_usage_stats`, `consent_crash_reports`, `consent_marketing` (all `boolean not null default false`), `consent_updated_at`, `consent_policy_version`. Owner-only stream. |
| B10 | **Analytics views** | `analytics` schema, not exposed, no grants to `anon`/`authenticated`. Views per §5.2: G1 primary (invite created ≤7 days), G1 secondary (accepted), landing funnel, ticks per active pet, % non-creator ticks, 7-day streak %, paw passes, D30 (backend defines the activity signal), reminder opt-in, card views. |

## 13. Open questions

1. **Deletion-page slugs:** `/en/delete-account` and `/pl/usun-konto` (proposed). Mobile and
   platform must agree before the Play listing (privacy P6).
2. **D30 "active" signal:** a tick is enough for owners. A member who only reads Today would
   not count. Should backend record a daily check-in (`household_member.last_seen_date`)?
3. Domain name and TLD.
4. Is Better Stack's free plan OK for commercial use?
5. Week-1 checks: the PostHog person-deletion endpoint (else delete by hand within 30 days);
   PowerSync inactivity behaviour.
6. **LATER [lawyer]:** crash reporting as strictly necessary.

**Before public launch (parked):**
- DPAs and TIAs: PostHog, Sentry, Resend, Expo, Cloudflare, Better Stack.
- Sub-processor list and an Art. 30 record.
- Lawyer-final privacy notice.
- DMARC to `quarantine`; Sentry IP storage confirmed off.
- Resend log retention and deletion.
- The **automated web deletion flow** (Turnstile, `deletion_request`, request/confirm
  functions, per-address throttling).
- Skip unfurler user agents in `view_count` and `landing_view_count`.
- Lock-screen detail hiding.

## 14. If Eyup's answers change

| Confirmed answer (2026-11-22) | If it changes later | What changes here |
|---|---|---|
| 1. Vet finder and Info library out | **Pulled into the MVP** | Google Places API (New) via an Edge Function proxy (key server-side); location permission on tap; a list view with Maps links (EEA terms); a budget alert; events without coordinates. About +$0–35 a month. New ADR. |
| 2. Care card read-only | **Sitters tick** | `POST /c/:token/tick` → RPC `care_card_tick` (rate-limited per token). Minimal JS or a form POST, with the CSP adjusted. The `tick.actor_id` actor becomes a "card". Push follow-up becomes more valuable. The card copy may then show who marked it. |
| 3. Links don't expire | **Auto-expire** | Use `expires_at` in the RPC check; the Worker shows "expired" as distinct from "turned off". |
| 4. No pet photos | **Photo in** | A signed Storage URL in the RPC; CSP `img-src`; deletion removes objects; the OG image stays generic. |
| 5. More than 2 adults, cap 6 | **Owner + partner only** | No structural change. |
| 6. Dog = meals + meds + walks; cat = meals + meds + fresh water (**already applied**) | **Walks dropped, or litter added** | Only the species defaults that set `streak_critical`. The planner reads the flag. |
| 7. Invite-only beta (TestFlight + Play closed testing) | **Open beta** | Build the automated web deletion flow and Turnstile; lawyer-final privacy notice and terms; DPAs and TIAs before the beta; budget Resend Pro; name an uptime on-call; store privacy labels. The `/i/` landing switches to store links. |
| 8. G1 target ≥40% | **Different number** | Only the threshold in the `analytics` G1 view. |
| Rulings 1, 3, 4, 5, 6, 7, 8 | **Eyup overrides one** | Ruling 1 (tick events instead of rows): planner rule 3 becomes "folded state is done". Ruling 3: add `/c/*` to the app links (not advised). Ruling 4 (hashed token): B4 looks up `sha256`, and sharing becomes rotate-to-share. Ruling 5 (multi-pet cards): B4 returns `pets[]`. Ruling 6 (typable code): the landing page shows the code. Ruling 7 (self-serve deletion): restore the revision-1 §8.4 flow. Ruling 8 (push now): build §3.6. |
| Stack: Sentry EU | **Dropped later to cut a vendor** | PostHog error tracking behind the same `reportError` and scrubber. About a day. |
| Stack: Cloudflare Workers | **Replaced** | Hono runs on Netlify or Vercel. DNS stays. |

## 15. Revision log (revision 2, 2026-11-22)

| Finding | Source | Fix |
|---|---|---|
| P-1 / P1 / ruling 4 | arch, privacy | B4, §8.3 and ADR 0024: plaintext 256-bit token lookup (`token = p_token`), exactly 43 characters, aligned with ADR 0018 |
| P-2 / P-M1 / M4 / ruling 3 | arch, PO, privacy | M8, AASA and assetlinks claim `/i/*` only; cards are web only; owner preview opens the browser |
| P1 (R2) | privacy | `noarchive` in the header and meta; generic `<title>`/OG; `robots.txt` without `Disallow: /c/` (§8.2, §8.3) |
| P-M2 / ruling 4 | PO | "Marked done" or nothing; never "Not done"; no names; an explainer line (§8.3) |
| Ruling 5 / row 16 | arch | One pet per card (`pet_id`), checked against `household_id` (B4) |
| P2 | privacy | Non-JWT function secrets in Vault, constant-time compare, recipients from the DB; log redaction of `/c/`, `/i/`, `t=` (§8.7, §10, B3, B5) |
| P3 | privacy | Full `scrubSensitive()` list for Sentry, PostHog and logs (§5.1, §6, M6, M7) |
| P4 | privacy | `consent_crash_reports` listed in B9 (backend adds the column) |
| P5 | privacy | EN/PL beta privacy notice with the required contents (§8.5, M11) |
| Ruling 10 / R4 | privacy | Crash reports default off (§4) |
| M3 (consent part) | privacy | Consent keyed to the person; cleared on sign-out and deletion; the profile wins after sign-in (§4, M5) |
| P-M3 / ruling 6 | PO | G1 split: invite created ≤7 days (primary) + accepted (secondary); `/i/` landing view count via `record_invite_landing` (§5.2, §8.4, B8) |
| P-3 / ruling 9 | arch | Streak/G1/G3 from SQL `analytics` views; client streak events and `$insert_id` dedupe removed (§5) |
| P-5 / ruling 7 | arch | Web deletion = EN/PL explainer + email request + manual runbook. Turnstile, `deletion_request`, two functions and the Worker secret removed (§8.6, B6) |
| P-6 / ruling 8 | arch | Silent push deferred to after the first beta build; kept as a planned follow-up (§3.6, M3, M4, B2, B3, ADR 0021) |
| P-7 | arch | Start with Resend SMTP + PL-then-EN templates; hook later (§7, B7, ADR 0025) |
| P-4 / rows 11, 12, 14 | arch | Planner input uses backend names, `ends_on`, `slot = 0`, row-present = done (§3.2, M1, B1) |
| P-8 | arch | PowerSync inactivity risk noted, with a week-1 check and a Pro budget (§9) |
| B4, B5 (platform parts) | privacy | Contacts stripped from cards on deletion (backend); deletion follow-up table, retries and alert (B5, runbook) |
| S-P1 | PO | Quiet time in the device's zone (§3.2 rule 4, fixture) |
| S-P2 | PO | Template default remind times for "any time" walks (§3.2 rule 1) |
| S-P3 | PO | Rest day = complete for the nudge (§3.2 rule 5) |
| S-P5 / ruling 6 | PO | Landing page with numbered install steps per platform, EN/PL, no code and no names (§8.4) |
| S-P6 | PO | Nudge offered after the first completed day (§3.1) |
| S-P7 | PO | One consent screen, three switches, plain lines tested in PL at 200% (§4) |
| Ruling 12 | arch M-7 | Consent screen follows the display-name step (§4) |
| P6 (slugs) | privacy | `/pl/usun-konto` proposed; open question 1 |

## 16. Sources (checked 2026-11-22)

- Expo push FAQ: <https://docs.expo.dev/push-notifications/faq/>
- expo-notifications API: <https://docs.expo.dev/versions/latest/sdk/notifications/>
- PostHog React Native: <https://posthog.com/docs/libraries/react-native>
- PostHog RN error tracking: <https://posthog.com/docs/error-tracking/installation/react-native>
- PostHog pricing: <https://posthog.com/pricing>
- Sentry pricing: <https://sentry.io/pricing/>
- Resend pricing: <https://resend.com/pricing>
- Cloudflare Workers pricing: <https://developers.cloudflare.com/workers/platform/pricing/>
- Research report: `docs/research/stack-choice.md` (Nov 2026)
