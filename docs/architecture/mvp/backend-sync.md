# Backend and sync design — Pet OS MVP (revised draft)

- **Author:** backend-sync-architect (agent) · **Date:** 2026-11-22 · **Issue:** #5
- **Revision:** phase 4. This revision applies `docs/architecture/mvp/reviews/rulings.md` and the backend MUST-FIX
  items from `docs/architecture/mvp/reviews/architecture.md`, `docs/architecture/mvp/reviews/privacy-security.md` and
  `docs/architecture/mvp/reviews/product-owner.md`. The revision log is in §17.
- **Revision 2026-11-23 (owner role):** households now have one **owner** plus members (spec need 2,
  decision 5). See §8.5 and §18.
- **Inputs:** spec `docs/specs/001-mvp/spec.md` (approved 2026-11-22), `docs/research/stack-choice.md`,
  the Decisions section of `docs/specs/001-mvp/spec.md` (confirmed answers), `pet-os-context`, and the mobile and platform drafts.
- **Confirmed stack (Eyup):** Supabase Pro in Frankfurt with Supabase Auth (no Clerk),
  PowerSync Cloud free plan, Expo, Expo push, Cloudflare for web pages, PostHog EU, Resend.
- **ADR drafts:** `docs/adr/0010`–`0019` (§15).

`unverified` means the fact was not confirmed from a primary source in this session.

---

## 1. Summary

- **Hosting.** One Supabase project in Frankfurt (`eu-central-1`) runs Postgres, Auth, pg_cron and
  **two** small Edge Functions (`delete-account`, `deletion-followup`). The business logic is plain SQL: RLS, a few
  `SECURITY DEFINER` RPCs and one streak function. PowerSync Cloud runs in the EU region
  (AWS `eu-west-1`, Ireland) on the free plan.
- **Data scope.** Every row carries `household_id`. RLS and sync then reduce to one rule:
  "rows of the households I'm an active member of". **RLS is on for every table**, Supabase's
  default grants are revoked, and every grant is explicit. A CI check fails if this drifts.
- **Ticks.** There is **one row per task per household day** (ruling 1). The id is
  deterministic: `uuidv5(task_id|local_date|slot)`. The row has a unique key. An undo is a
  `DELETE`, allowed only for today and yesterday. When two people tick the same task, the first
  upload is credited and the second is a silent no-op.
- **The day.** A "day" is the household's local date, from an IANA zone stored on the household
  (default `Europe/Warsaw`). The phone stamps `local_date` with that zone, and the server only
  does date arithmetic, so DST can't shift a day.
- **Streaks.** The server owns the streak. pg_cron closes each household day every 15 minutes and
  writes `streak_day` rows, which sync down. A late tick, a late undo or a rest-day change
  re-opens the last two days. The phone runs the same rules for every day the server hasn't
  closed yet, and both sides are tested against one fixture file.
- **Streak-critical tasks.** `task.streak_critical` is a per-task flag. A trigger seeds it from
  species defaults (dog: meal, med, walk; cat: meal, med, water). Users can't edit it in the MVP.
- **Rest days.** A rest day can be set only for **today**. There is no monthly limit. A rest day
  keeps the streak alive but adds no day (ruling 2).
- **Auth.** Sign-in is required before any data reaches the server. Onboarding keeps a draft on
  the device (mobile ADR 0005). The phone inserts the household and then the creator's own
  `household_member` row in one transaction. RLS allows that row only as a bootstrap (matches
  mobile C-B3).
- **Owner.** Each household has exactly one owner, `household.owner_id` (NOT NULL). Only the owner
  can invite, remove members, rename or delete the household, and transfer ownership. Every member
  can see and edit all pets, routines, ticks, health records and care cards. Any member can leave.
  When the owner leaves or deletes their account, ownership passes automatically to the
  longest-standing active member (§8.5).
- **Joining.** Joining is a **preview, then an explicit confirmation**. The pets of a sole member
  come along with their history. Joining never deletes pets. Leaving a household that still has
  members is named in the confirmation, and the RPC enforces it. There is no typable invite code.
- **Care card.** A care card covers **one pet**. Its token is 256-bit plaintext, readable only by
  members. The card is public and read-only through one anon RPC. Contacts are tagged with the
  member's `user_id` and are stripped when that member leaves, is removed or deletes their
  account. Removing a member also revokes the household's open invites.
- **Deletion.** The Postgres and Auth deletion is the commit point. After it, the external steps
  (PostHog, the receipt email, Apple token revocation) go into a follow-up queue and are retried
  daily. On the web, deletion is a page plus a manual runbook (ruling 7).
- **Out of the MVP.** The silent "sync now" push is deferred to after the first beta build
  (ruling 8). §12 keeps it as a planned follow-up.

---

## 2. Platform and hosting

| Piece | Choice | Cost (≤100 users) | Region | Notes |
|---|---|---|---|---|
| Database, Auth, cron, Edge Functions | **Supabase Pro** | $25/month | Frankfurt (`eu-central-1`) | Pro is needed for daily backups and to avoid pausing. Use local `supabase start` for development. ADR 0010. |
| Login | **Supabase Auth** (Apple and Google with native ID token, email one-time code) | Included | Frankfurt | Anonymous sign-in is off. ADR 0011, 0017. |
| Offline sync | **PowerSync Cloud, free plan** | $0 (2 GB synced per month, 50 peak concurrent clients) | EU (`eu-west-1`) | Pro is "from $49/month" ([pricing](https://powersync.com/pricing.md), 2026-11-22). The region can't be changed after creation ([cloud instances](https://docs.powersync.com/configuration/powersync-service/cloud-instances.md)). Free instances are deactivated after inactivity: the pricing page says both "1 week" and "2 weeks". ADR 0012, 0013. |
| Server jobs | **pg_cron** (+ pg_net for one call) | Included | Frankfurt | 2 jobs (§10). |
| Edge Functions (MVP) | **`delete-account`** (user JWT, or the service role for the runbook) and **`deletion-followup`** (cron retry). Platform may add `send-email` | Included | Frankfurt | `notify-household` is deferred (§12). The web deletion flow is manual (ruling 7). |
| File storage | **None in the MVP** | — | — | No photos (confirmed answer 4). |

**Lock-in.** Data lock-in is low because it is plain Postgres. Auth is medium: users and identities
live in `auth.*`. PowerSync is medium: the sync config and the client connector are specific to
PowerSync, but the server data model is not.

---

## 3. Entity model

Conventions:

- **Ids.** Every synced table has a `uuid` primary key named `id`, because PowerSync requires it.
  Ids are random (UUID v7 from mobile is fine) except for these **deterministic UUID v5** ids. Their
  namespace and key-string format live in one shared module (`packages/domain/ids.ts`), with
  `|` as the separator:

| Table | Deterministic id | Why |
|---|---|---|
| `tick` | `v5(NS_TICK, task_id + '|' + local_date + '|' + slot)` | One row per task per day (ruling 1) |
| `rest_day` | `v5(NS_REST, pet_id + '|' + local_date)` | One per pet per day |
| `pet_place` | `v5(NS_PLACE, pet_id + '|' + kind)` | One food place and one groomer per pet |
| `reminder_pref` | `v5(NS_REMIND, user_id + '|' + task_id)` | One per user per task |
| `vet_contact` | `= household_id` | One per household |
| `notification_settings`, `profiles` | `= user_id` | One per user (created by the auth trigger) |

  When two members create "the same" row offline, they generate the same id, so the second
  upload becomes an upsert or a no-op instead of a duplicate-key error.

- **Household consistency.** Every pet-scoped table carries both `pet_id` and `household_id`. A
  composite FK `(pet_id, household_id) → pet(id, household_id) ON UPDATE CASCADE ON DELETE
  CASCADE` prevents cross-household references and lets a pet move to another household with
  one `UPDATE` (§8.3). Other cross-table ids that don't have a composite FK (`tick.task_id`,
  `task.medication_id`, `reminder_pref.task_id`) are checked by a `BEFORE INSERT OR UPDATE`
  trigger, which requires the same `household_id` (privacy B1).
- **Server-set attribution.** `*_by` attribution columns (`tick.actor_id`, `rest_day.created_by`,
  `household.created_by`, `care_card_link.created_by`) are set by triggers from `auth.uid()`.
  Values sent by the client are ignored (privacy B6).
- **Timestamps and dates.** `created_at` and `updated_at` are `timestamptz`, and a trigger sets
  `updated_at`. Plain `date` columns are in the **household** calendar.
- **Names.** Names are singular, except `profiles`, which follows the Supabase convention.
  Backend names win (ruling 13).

| Table | Purpose | Key fields | Written by (client) | Synced to |
|---|---|---|---|---|
| `profiles` | One row per auth user, created by trigger | `id = user_id`, `display_name`, `locale` (`en_US`/`pl_PL`), `consent_usage_stats`, `consent_crash_reports`, `consent_marketing`, `consent_updated_at`, `consent_policy_version` | Owner (update) | That user |
| `notification_settings` | Nudge and quiet time, created by trigger | `id = user_id`, `quiet_start`, `quiet_end`, `nudge_enabled`, `nudge_at` | Owner (update) | That user |
| `household` | The sharing unit | `name`, `timezone` (IANA), **`owner_id`** (NOT NULL), `created_by`, `last_closed_date` (server-only, not synced) | Insert (bootstrap; `owner_id` forced to the creator). **Owner** updates `name`/`timezone`. `owner_id` changes only through RPCs | Members |
| `household_member` | Who is in the household (no `role` column: the owner is `household.owner_id`) | `household_id`, `user_id`, `display_name`, `joined_at`, `left_at`, `removed_by` | Own `display_name` only. Rows are created by trigger or RPC | Members (former members too, for names) |
| `invite` | Partner invite link | `household_id`, `token` (256-bit), `expires_at` (+7 days), `accepted_by`, `accepted_at`, `revoked_at`, `landing_view_count` | RPC only (owner) | **Owner only** (open invites) |
| `pet` | Dog or cat | `name`, `species`, `breed`, `birth_date`, `birth_date_estimated`, `weight_kg`, `care_notes`, `sort_order` | Members (insert/update/delete) | Members |
| `task` | Routine item | `pet_id`, `kind`, `template_key`, `title`, `amount`, `streak_critical` (trigger-seeded), `time_of_day` (null = any time), `every_n_days`, `anchor_date`, `ends_on`, `paused`, `medication_id`, `sort_order` | Members (insert/update; **no delete**) | Members |
| `tick` | Task done on a day | `task_id`, `pet_id`, `local_date`, `slot`, `actor_id`, `client_at`, `received_at` | Members (insert; delete only for today/yesterday) | Members |
| `rest_day` | Rest day | `pet_id`, `local_date`, `created_by` | Members (insert/delete, **today only**) | Members |
| `streak_day` | Server verdict per pet per closed day | `pet_id`, `local_date`, `outcome`, `streak_after`, `passes_used_in_month` | **Server only** | Members |
| `medication` | Health basics | `pet_id`, `name`, `dose`, `notes`, `starts_on`, `ends_on` | Members | Members |
| `health_record` | Vet visit or vaccination | `pet_id`, `kind`, `title`, `occurred_on`, `next_due_on`, `note` | Members | Members |
| `vet_contact` | The household's own vet | `id = household_id`, `name`, `phone`, `address`, `notes` | Members (upsert) | Members |
| `pet_place` | Usual food place and groomer | `pet_id`, `kind` (`food`/`groomer`), `provider` (`psibufet`/`booksy`/`custom`), `name`, `url`, `next_visit_on`, `note` | Members (upsert) | Members |
| `care_card_link` | Sitter card, **one pet** | `pet_id`, `token`, `owner_contacts jsonb [{user_id?, first_name, phone}]`, `note`, `lang`, `show_vet`, `revoked_at`, `expires_at` (unused), `view_count`, `last_viewed_at` | Created, rotated and revoked by RPC. Members update content columns | Members |
| `reminder_pref` | Per-user, per-task reminder | `user_id`, `task_id`, `household_id`, `enabled`, `anytime_remind_at` | Owner (upsert) | That user |
| `deletion_followup` | Retry queue for external deletion steps | `user_id` (no FK), `step`, `payload` (short-lived), `attempts`, `next_attempt_at`, `last_error_at`, `done_at` | Server only | Not synced |
| `app_config` | Kill switch and minimum app version (platform B8) | single row | Us, through SQL | Not synced (RPC) |

`push_device` (platform B2) is **deferred** together with the silent push (§12).

### 3.1 Task schedule model

- **One task = one occurrence a day.** "Breakfast" and "Dinner" are two tasks. A twice-daily pill
  is two tasks linked to one `medication`. `slot` stays in the tick key and is always `0` in
  the MVP.
- **Due on local date `d`** when all of these hold: `anchor_date <= d`, `ends_on` is null or
  `ends_on >= d`, `paused = false`, and `(d - anchor_date) % every_n_days = 0`.
- **Remove** a task by setting `ends_on = today - 1`. Clients have **no `DELETE`** on `task`
  (architecture B-3), so ticks and re-opened streak days can never be wiped by a delete. A task
  goes away only with its pet or its household.
- **Medication courses.** The app writes the medication and its linked task or tasks in one
  local transaction.
- **Labels.** The display label is `title ?? t(template_key)`. One template-key format is used,
  e.g. `task.dog.walk.morning`, and it is owned by `packages/domain` (mobile owns the package).

### 3.2 Streak-critical flag (confirmed answer 6)

| Species | Streak-critical kinds (seed) | Not critical |
|---|---|---|
| Dog | `meal`, `med`, `walk` | `custom` |
| Cat | `meal`, `med`, `water` | `litter`, `custom` |

A `BEFORE INSERT` trigger on `task` sets `streak_critical` from `(pet.species, kind)` and ignores
the value the client sends. Clients have no `UPDATE` grant on the column (architecture S-B3, PO
R4: the flag is read-only in the MVP). If the rule changes later, a one-off `UPDATE` and the seed
table change. Closed days stay frozen.

---

## 4. Ticks: one row per task per household day (ADR 0014)

### 4.1 Shape

```
tick(id uuid pk = v5(NS_TICK, task_id|local_date|slot)
     household_id, pet_id, task_id,
     local_date date,           -- household date the tick is FOR
     slot smallint default 0,
     actor_id uuid → auth.users ON DELETE SET NULL,   -- set from the JWT by trigger
     client_at timestamptz,     -- device time of the tap, clamped to <= now(); shown as "at 07:58"
     received_at timestamptz default now(),
     unique (task_id, local_date, slot))
```

"Is it done?" is answered by whether a row exists, in every reader: Today, the reminder planner
(platform rule 3 as written), the streak SQL, the care-card RPC and the analytics views. Ticks
are never folded.

### 4.2 Writes

| Action | Client (local) | Upload | Server |
|---|---|---|---|
| Tick | `INSERT OR IGNORE` with the v5 id. A synced row with the same id may already be local | `upsert(row, { onConflict: 'id', ignoreDuplicates: true })` → `ON CONFLICT DO NOTHING` (needs only `INSERT`) | `BEFORE INSERT` sets `actor_id`, clamps `client_at`, checks the task, pet and household, and checks the window. A row that already exists makes the insert a no-op, so the **first upload keeps the credit** |
| Undo | `DELETE` by id. If the tick is **another member's**, the app asks first: "Ana marked this done at 07:58. Mark as not done?" (PO M-2). Undoing your own tick is instant | `delete().eq('id', id)` | RLS `DELETE` for members. `BEFORE DELETE` silently ignores the delete (`RETURN NULL`) unless `local_date >= today_local - 1`. `AFTER DELETE` recomputes the streak if `local_date < today_local` |
| Re-tick after an undo | `INSERT` with the same id | Queue is `DELETE` then `PUT` | The row is deleted, then inserted again with the new actor |

- **Insert window:** `today_local - 2 … today_local + 1` (server slack). Rows outside it are
  dropped silently (`RETURN NULL`), and the next sync removes them locally. The phone UI
  offers **today and yesterday**.
- **Delete window:** `today_local - 1 … today_local`. A delete outside it is ignored silently,
  and the next sync restores the row locally.
- There is no `UPDATE` grant on `tick`.

### 4.3 Credit and races (ruling 1: whoever syncs first)

- **Same task ticked offline by two people.** The first upload creates the row. The second is
  `DO NOTHING`. After the checkpoint, PowerSync replaces the second phone's local row with the
  server row, so "Done by You" quietly becomes "Done by Ana". There is no error and no
  animation (PO R2: any flip is silent).
- **Undo against tick.** The last upload wins. This is deterministic and explainable at this scale.
- **Device clock skew** no longer affects state. `client_at` is used only for display.

This ruling overrides the PO's "first tapped" preference (PO R2). It is listed for Eyup as a
confirmable decision (§14 Q1).

---

## 5. Streaks (ADR 0016)

### 5.1 Rules

For pet `p` on household date `d`:

1. **Due set:** the streak-critical tasks due on `d` (§3.1), with slot 0.
2. **Day outcome,** checked in this order:
   - `neutral`: the due set is empty.
   - `complete`: a `tick` row exists for every due `(task_id, d, 0)`.
   - `rest`: a `rest_day` row exists for `(p, d)`.
   - `neutral`: `d` is the pet's first day and it isn't complete, so a pet added at 21:00 doesn't
     start with a miss.
   - otherwise `missed`.
3. **Chain,** carried forward from the previous closed day:
   - `complete` adds 1.
   - `rest` and `neutral` keep the streak (they bridge it, but don't extend it).
   - `missed` with `passes_used_in_month < 2` becomes `paw_pass`. The pass count goes up by 1 and
     the streak is unchanged.
   - `missed` with 2 passes already used sets the streak to 0. This is the third miss of the
     month, and the app shows neutral copy (PO R11).
   - Passes reset on the 1st of each household-calendar month.
4. **Today is never closed.** The shown number is the provisional value (§5.2).
5. Milestones (7/14/30/100) are a client-side view of `streak_after` crossing a threshold.

**Rest days (ruling 2, architecture B-4):** a `rest_day` insert or delete is accepted only when
`local_date = today_local`. There is no monthly limit. Because a rest day can't be added after
the fact, a miss can't be turned into a rest day, and the "max 2 paw passes" rule keeps its
meaning. A fixture covers this.

### 5.2 Where it runs

| Who | What | When |
|---|---|---|
| **Server (authoritative)** | `streak_recompute(pet_id, from_date)` (PL/pgSQL). It walks `from_date … today_local-1`, upserts `streak_day`, is idempotent, and takes an advisory lock per pet | pg_cron every 15 min (`streak_close_due_days`). `AFTER INSERT/DELETE` on `tick` and `rest_day` for dates before today |
| **Phone (provisional)** | `packages/domain/streak`: `dayOutcome`, then `provisionalStreak(latestStreakDay, openDays[])`. It applies the **same** rules to every day after the last synced `streak_day` up to today (offline across midnight included). Rest is a bridge, not +1. "Best" is `max(streak_after)` from local rows. The shown value never drops below the last confirmed one until the server says so, and any reversal is silent | On every local change |
| **Shared fixtures** | `streak-fixtures.json`: DST weekends, month boundaries, the third miss, a rest day today, an attempt to set a rest day for yesterday (rejected), a late tick, a late undo, and two days left open offline. CI runs them against the TypeScript and the SQL. **Week-1 deliverable** | CI |

### 5.3 Household local day and DST (ADR 0015)

- `household.timezone` is IANA. It defaults to the device zone at creation, else `Europe/Warsaw`,
  and a trigger validates it against `pg_timezone_names`. Members can change it (Settings →
  Household → Time zone, PO S-M6). A change applies from the next tick and the next close.
- **Client:** `local_date = formatInZone(now, household.timezone, 'yyyy-MM-dd')`, using Luxon
  or a Temporal polyfill. Hermes `Intl` timeZone support is `unverified`.
- **Server:** `today_local = (now() AT TIME ZONE timezone)::date`. Only `date` arithmetic is used.
- **Spring forward, Sun 2027-03-28.** A tick at 00:30 local is 23:30 UTC on 27 March. It is
  stamped `2027-03-28`. The day is closed at 22:00 UTC on 28 March, which is local midnight CEST.
- **Fall back, Sun 2027-10-31.** A tick at 23:30 CET (22:30 UTC) is stamped `2027-10-31`. The day
  is closed at 23:00 UTC.

### 5.4 Open window and late changes

- A day closes 0–15 minutes after household midnight.
- These all call `streak_recompute(pet, that_day)`, which recomputes that day and the later
  closed days (at most 2 rows):
  - a late tick (allowed back to `today-2`),
  - a late undo (allowed back to `today-1`),
  - a rest-day change (today only, so it only affects a day that isn't closed yet).
- The recompute uses the current task configuration, which is acceptable. Older days are frozen.

---

## 6. Sync: PowerSync streams and the upload path

### 6.1 Sync Streams (edition 3; check exact syntax at build time)

```yaml
config:
  edition: 3

streams:
  household_data:
    auto_subscribe: true
    with:
      my_households: >
        SELECT household_id FROM household_member
        WHERE user_id = auth.user_id() AND left_at IS NULL
    queries:
      - SELECT id, name, timezone, owner_id, created_by, created_at, updated_at FROM household WHERE id IN my_households   # no last_closed_date
      - SELECT * FROM household_member WHERE household_id IN my_households
      - SELECT id, household_id, token, created_by, created_at, expires_at FROM invite   # owner only
          WHERE household_id IN (SELECT id FROM household WHERE owner_id = auth.user_id())
            AND accepted_at IS NULL AND revoked_at IS NULL
      - SELECT * FROM pet            WHERE household_id IN my_households
      - SELECT * FROM task           WHERE household_id IN my_households
      - SELECT * FROM tick           WHERE household_id IN my_households
      - SELECT * FROM rest_day       WHERE household_id IN my_households
      - SELECT * FROM streak_day     WHERE household_id IN my_households
      - SELECT * FROM medication     WHERE household_id IN my_households
      - SELECT * FROM health_record  WHERE household_id IN my_households
      - SELECT * FROM vet_contact    WHERE household_id IN my_households
      - SELECT * FROM pet_place      WHERE household_id IN my_households
      - SELECT * FROM care_card_link WHERE household_id IN my_households

  my_user:
    auto_subscribe: true
    queries:
      - SELECT * FROM profiles              WHERE id = auth.user_id()
      - SELECT * FROM notification_settings WHERE id = auth.user_id()
      - SELECT * FROM reminder_pref         WHERE user_id = auth.user_id()
```

- The pattern (a membership CTE with `auth.user_id()`, plus `auto_subscribe`) follows the
  PowerSync examples ([examples](https://docs.powersync.com/sync/streams/examples.md),
  2026-11-22). Column lists and the extra predicate on `invite` are `unverified`. If either isn't
  supported, filter or ignore the column on the client.
- **The streams are a second authorisation layer** that doesn't go through RLS (privacy R7). They
  must select the same rows as the RLS policies, and RLS test 2 (§11.6) checks that.
- **Removal:** setting `left_at` stops the CTE from returning that household. PowerSync then drops
  the bucket and its local rows on the next sync.
- Volume is about 3k ticks per pet per year, and the full history is synced. Add a history window
  before scale (LATER).

### 6.2 Upload map (contract with mobile; architecture rows 2–4, 7)

The connector writes through supabase-js with the user's JWT. **The PUT mapping is per table**,
and a generic `PUT → upsert` would break the column grants.

| Table | PUT | PATCH | DELETE |
|---|---|---|---|
| `tick` | `upsert(ignoreDuplicates)` | — (no grant) | `delete` (window-guarded) |
| `rest_day` | `upsert(ignoreDuplicates)` | — | `delete` (today only) |
| `pet_place`, `vet_contact`, `reminder_pref` | `upsert(onConflict: 'id')` (full update grant) | `update` | — |
| `household` | `insert` | `update` (`name`, `timezone` only) | — |
| `pet`, `medication`, `health_record` | `insert` | `update` | `delete` |
| `task` | `insert` | `update` (not `streak_critical`) | — (use `ends_on`) |
| `profiles`, `notification_settings` | — (created by the auth trigger) | `update` | — |
| `household_member` | `insert`: bootstrap row only (§8.1) | `update` (own `display_name`) | — (RPC) |
| `care_card_link` | — (RPC) | `update` (`owner_contacts`, `note`, `lang`, `show_vet`) | — (RPC) |
| `invite`, `streak_day` | — | — | — |

- **Error classification (ruling 14).** Some errors are permanent. For these the connector
  **discards** the transaction, logs it (a dev-build banner, plus a per-table count in consented
  error tracking), and continues. Everything else is **retried**. A 401 is retried after
  `refreshSession()`.

| Discard (permanent) | Retry |
|---|---|
| `23502`, `23503`, `23505`, `23514`, `22001`, `22003`, `22007`, `22008`, `22P02`, `42501`, `P0001` | HTTP 401, 408, 429, 5xx, network errors, and any other code |

- **Order:** PowerSync uploads in local write order. A connector test per table runs against local
  Supabase in CI (owner: mobile).

### 6.3 Conflict handling: worked examples

Household: Ana and Bartek, in `Europe/Warsaw`, with dog Burek. Tasks: `breakfast`, `walk_am`,
`pill_am`, all streak-critical. Date: Wed 2027-02-10.

**A. Both offline, different tasks (acceptance 2).**
- At 07:50 Ana ticks `breakfast`. Its id is `v5(breakfast|2027-02-10|0)`.
- At 07:55 Bartek ticks `pill_am`, a different id.
- At 08:10 both phones reconnect. Both inserts land, and the server sets each `actor_id` from the
  JWT.
- Both phones then show "Breakfast — Done by Ana" and "Pill — Done by Bartek". The provisional
  streak is 2 of 3 on both.

**B. Both offline, same task (acceptance 3).**
- At 07:58 Ana ticks `breakfast`. At 08:03 Bartek ticks `breakfast`. Both get the **same** id.
- Bartek reconnects first, so his row is inserted with `actor_id = Bartek`. Ana's upsert is
  `DO NOTHING`, with no error.
- After the checkpoint, Ana's phone shows the server row: "Done by Bartek, 08:03". It shows once,
  credited to one person, and the change is silent.

**C. Undo against tick.** At 07:00 Ana ticks `walk_am`, and it syncs. At 07:30 Bartek is online,
sees the tick and taps it. He gets a confirm ("Ana marked this done at 07:00. Mark as not
done?"), confirms, and the `DELETE` lands. Ana's phone has been offline since 07:05 and still shows
done. If she does nothing, her next sync shows it open. If she re-ticks offline at 07:40, her
`PUT` uploads after Bartek's delete, so the task is done again and credited to Ana. The last upload
wins.

**D. Late tick after the day closed.** At 23:40 Bartek ticks `pill_am` for 2027-02-10 while offline.
At 00:05 the server closes the 10th as a `missed` day, which uses a paw pass. At 07:30 on the 11th
Bartek's phone syncs. The tick is in the window, so `AFTER INSERT` runs `streak_recompute(Burek,
2027-02-10)`. The 10th becomes `complete`, and the pass is refunded by the chain.

**E. Late undo.** At 08:00 on the 11th Ana undoes yesterday's `pill_am`. That is within `today-1`,
so the `AFTER DELETE` recompute turns the 10th back into `paw_pass`. Ana's phone shows this
provisionally, and the server confirms it.

**F. Removed member offline.** Bartek is removed at 09:00. At 09:05 he ticks offline. On reconnect
the insert fails with `42501` and is discarded. A `DELETE` would match no rows and do nothing. His
sync then drops the household.

**G. Task ended while ticked offline.** The tick is stored but isn't in the due set, so the streak
is unaffected.

**H. Delete outside the window,** for example a phone that was offline for three days and undoes an
old tick. The server ignores it silently, and the next sync restores the row locally.

**I. Concurrent edits** (pet name, task time). The last write per column wins, because a PATCH
sends only the changed columns.

---

## 7. Auth (ADR 0011, 0017)

### 7.1 Providers

- **Apple** (required on iOS): native `expo-apple-authentication` returns an ID token, which is
  sent with a nonce to `signInWithIdToken`.
- **Google:** native Google Sign-In returns an ID token for `signInWithIdToken`.
- **Email:** a one-time code (`signInWithOtp` / `verifyOtp`). There are no passwords.
- **No anonymous sign-in** (ADR 0017). It is turned off in the project.

### 7.2 Flow

1. **Onboarding draft.** The pet and its tasks are kept in device storage, with pre-generated ids.
   No server rows exist yet (mobile ADR 0005).
2. **Sign in.** Pass `options.data = { locale, display_name? }`. The `AFTER INSERT ON auth.users`
   trigger creates `profiles` (with `locale` and `display_name` from `raw_user_meta_data`) and
   `notification_settings` (architecture B-5).
3. **Display-name step** (architecture M-7, ruling 12): "What should the household call you?". It
   is prefilled from Apple, Google or the email's local part, and written to `profiles.display_name`
   with a queued `update`. The same name goes into the bootstrap member row, or into
   `accept_invite(p_display_name)`.
4. **Write the draft:**
   - **New user with no household:** in one local transaction, insert `household` (with `timezone`),
     then **the creator's own `household_member` row** (`user_id = uid`, `display_name`), then `pet`
     and the `task`s (matches mobile C-B3). PowerSync uploads in write order, so RLS sees the member
     before the pet. No `RETURNING`.
   - **Existing user with a household:** "Add Burek to your household?" Yes inserts the pet and
     tasks. No discards the draft.
   - **Arrived through an invite:** go to §8.2. Invited new users never see pet creation (PO M-3).
     A draft that already exists is offered after joining.
5. **Session.** supabase-js refreshes the token, and `fetchCredentials()` returns the current
   one. If a refresh fails because the user was deleted or revoked, run `disconnectAndClear()`
   and clear local storage (privacy M3, owned by mobile).
6. **Sign out.** Run `disconnectAndClear()`, then `signOut()`.

### 7.3 Roles and authorisation matrix

Each household has exactly one **owner** (`household.owner_id`) and any number of **members**, up
to 6 in total. Sitters use the card only.

| Action | Signed in, no household | Owner | Member | Former member | Card viewer (`anon`) | Service role / postgres |
|---|---|---|---|---|---|---|
| Create a household (becomes owner) | ✓ | ✓ | ✓ | ✓ | ✗ | ✓ |
| Read household data | ✗ | ✓ | ✓ | ✗ | One-pet subset via `get_care_card` | ✓ |
| Write pets, tasks, health, places, vet | ✗ | ✓ | ✓ (no task delete for either) | ✗ | ✗ | ✓ |
| Insert or delete ticks, set rest days | ✗ | ✓ | ✓ (windows apply) | ✗ (42501 / no-op) | ✗ | ✓ |
| Write `streak_day` | ✗ | ✗ | ✗ | ✗ | ✗ | functions only |
| Create, rotate or revoke a care card | ✗ | ✓ | ✓ | ✗ | ✗ | — |
| **Rename the household, change its time zone** | ✗ | ✓ | ✗ | ✗ | ✗ | — |
| **Create or revoke an invite; see open invites** | ✗ | ✓ | ✗ | ✗ | ✗ | — |
| **Remove another member** | — | ✓ | ✗ | ✗ | ✗ | — |
| **Transfer ownership** | — | ✓ | ✗ | ✗ | ✗ | — |
| **Delete the household** | — | ✓ | ✗ | ✗ | ✗ | — |
| Leave the household | — | ✓ (auto-transfer) | ✓ | ✗ | ✗ | — |
| Preview or accept an invite | ✓ | ✓ (confirm-leave; auto-transfer) | ✓ (confirm-leave) | ✓ (if valid) | ✗ | — |
| Delete own account | ✓ | ✓ (auto-transfer) | ✓ | ✓ | ✗ | executes |

The time zone is owner-only as a household setting. If Eyup wants members to change it, that is a
one-line policy change.

**Enforcement:**
- RLS is on for every table.
- Policies use `household_id IN (SELECT private.my_household_ids())`.
- Grants are explicit (§11.1).
- RPCs check `auth.uid()` inside the function. Owner-only RPCs check
  `household.owner_id = auth.uid()` and raise `not_owner` otherwise.
- The `household` update policy is `owner_id = auth.uid()`.
- `anon` can execute exactly four functions: `get_care_card`, `record_invite_landing`, `health`
  and `get_app_config`.

---

## 8. Household lifecycle

### 8.1 Create (offline-capable, right after sign-in)

1. The client inserts `household`. The `BEFORE INSERT` trigger sets `created_by := auth.uid()` and
   **`owner_id := auth.uid()`**, so the creator is the owner, and validates the time zone.
2. The client inserts its own `household_member` row. RLS policy `member_bootstrap` accepts it only
   when all of these hold:
   - `user_id = auth.uid()`;
   - the household's `owner_id = auth.uid()`;
   - the household has **no member rows yet**.

   The check runs in `private.can_bootstrap`, a `SECURITY DEFINER` function, because the caller
   can't see the household through RLS yet. Every other join goes through `accept_invite`.
3. The rest of the transaction (`pet`, `task`) then passes RLS.

The connector must not request `RETURNING` on these inserts. Nothing else selects them before the
member row exists.

### 8.2 Invite and join (online; ruling 6 and 11, PO B-M2/M-4)

1. **Create (owner only).** `rpc('create_invite', { p_household_id })` returns `{ token, expires_at }`. The app
   shares `https://<domain>/i/<token>`. The token is 256-bit, valid for 7 days, single use and
   revocable (`revoke_invite`). There is no typable code (ruling 6). Install friction is handled by
   the beta landing page (platform).
2. **Open.** The link opens the app through an app link (`/i/*` only, ruling 3), or the landing page
   if the app isn't installed. The landing page's Worker calls the anon RPC
   `record_invite_landing(p_token)`. It returns `{ open: bool }` and increments
   `invite.landing_view_count` only for an open invite. Nothing else is stored, and nothing else is
   returned: no household or inviter names (platform B8). If the user isn't signed in yet: "Join Ana's household" → sign
   in → display name.
3. **Preview.** `rpc('preview_invite', { p_token })` is read-only and authenticated. **Final
   signature** (it superset-matches mobile C-B6: `household_name`, `member_names[]`, `full`,
   `my_current`):
   ```
   preview_invite(p_token text) returns jsonb
   { status: 'ok' | 'invite_expired' | 'invite_revoked' | 'invite_used' | 'invite_not_found' | 'already_member',
     household_name, inviter_name, member_names[], pet_names[],
     full: bool,                                    -- true when 6 active members already
     my_current: null | { household_name,
                          other_member_names[],     -- empty if the caller is the sole member
                          pets: [{ id, name, species }],
                          outcome: 'pets_come_along' | 'leave_pets_stay',
                          new_owner_name: null | text } }  -- set when the caller owns a household that others stay in
   ```
   `accept_invite(p_token text, p_display_name text, p_confirm_leave boolean) returns jsonb { household_id }`
   is also **final**, with the error keys in §11.5.
4. **Confirm sheet** (mobile copy, naming everything):
   - `pets_come_along` (the caller is the sole member): "Burek and Mila come with you, with their
     history."
   - `leave_pets_stay` (others remain): "You'll leave 'Kowalski home'. Burek stays there with Tomek."
     If `new_owner_name` is set, add: "Tomek becomes the owner."
   - If the target already has a pet with the same name and species, show a hint: "Ana's household
     already has a dog called Burek. You can remove the duplicate after joining." The join never
     deletes pets (PO R9). A duplicate is removed later as an ordinary, named pet deletion.
5. **Accept.** First flush the upload queue (an empty CRUD queue). Then call
   `rpc('accept_invite', { p_token, p_display_name, p_confirm_leave })`. It runs in one transaction:
   - Lock the invite and re-check the status.
   - Check the cap: fewer than **6** active members.
   - If the caller has a current household:
     - **Sole member:** `UPDATE pet SET household_id = target`. The composite FKs cascade to tasks,
       ticks, rest days, streak days, medications, health records, places and **care cards**, so
       sitter links keep working. The `vet_contact` moves if the target has none, and is otherwise
       dropped. The old household (now empty of pets) and its invites are deleted.
     - **Others remain:** if `p_confirm_leave` is not true, raise `confirm_leave_required`.
       Otherwise run the same steps as `leave_household` (§8.3) on the old household, including the
       automatic ownership transfer.
   - Upsert the member row with `p_display_name` as a **member** of the target (never its owner),
     reactivating a former row if there is one. Mark
     the invite accepted. Return `{ household_id }`.
6. **Next sync.** The partner sees the household's pets on Today.

**MVP rule:** a user has one active household. This is enforced by `accept_invite`, not by a
constraint, because bootstrap must stay offline-capable.

### 8.3 Remove and leave (online)

- `rpc('remove_member', { p_member_id })` is **owner only**. It rejects the owner's own row
  (`cannot_remove_self`): an owner leaves with `leave_household`.
- `rpc('leave_household', { p_household_id })` is for **any member**. If the caller is the owner,
  ownership first passes to the longest-standing active member (§8.5). If no other member remains,
  the household is deleted.

Both run in one transaction that:

1. sets `left_at` (and `removed_by` for a removal);
2. **revokes every open invite of the household** (privacy B2);
3. **strips that user's entries** (`user_id` match) from `owner_contacts` on all of the household's
   cards (privacy B4);
4. deletes the household if no active member remains.

Both return `{ household_deleted, new_owner_member_id, open_invites_revoked, care_cards: n }`. The app uses this to offer
"Replace care card links? The sitter will need the new link." (Replace rotates, Keep does nothing;
privacy M1, owned by mobile.) The removed member's row stays, so their name stays on past ticks, and
rejoining reactivates it. The removed member loses access on their next sync.

### 8.4 Account deletion (ADR 0019)

**In the app (3 taps).** Apple users also get the system re-auth sheet, which supplies a fresh
`authorizationCode`. Then the app calls
`functions.invoke('delete-account', { body: { apple_authorization_code? } })`. The function:

1. Reads the email (for the receipt email). If an Apple code was given, it exchanges the code for
   tokens. This must happen within minutes, because the code is short-lived. Apple refresh tokens
   are never stored long term (privacy R8).
2. **Commit point.** In one transaction, `select private.delete_user_data(uid)` then
   `auth.admin.deleteUser(uid)`. `delete_user_data`:
   - deletes each household where the user is the **last** active member (cascading everything);
   - in every other household the user **owns**, transfers ownership to the longest-standing active
     member (§8.5);
   - strips the user's `owner_contacts` entries from cards in every household they belong to;
   - deletes every `household_member` row of the user (former rows too), so the name is gone
     everywhere;
   - enqueues `deletion_followup` rows (`step`): `posthog_person` (payload `{}`; the PostHog
     distinct id is the UUID), `receipt_email` (payload `{ email, lang }`), and `apple_revoke`
     (payload `{ refresh_token }`) if step 1 got one.

   FK effects of deleting the auth user: `profiles`, `notification_settings` and `reminder_pref`
   **cascade**. `tick.actor_id`, `rest_day.created_by`, `household.created_by`,
   `household_member.removed_by`, `invite.created_by`/`accepted_by` and
   `care_card_link.created_by` are set to **NULL**, so other members see "Former member" on past
   ticks.
3. Tries each follow-up at once and marks the successes `done_at`, clearing the payload.
4. Returns `{ status: "deleted" }`. The app runs `disconnectAndClear()` and signs out.

**Retry (privacy B5).** A daily pg_cron job calls the Edge Function **`deletion-followup`**
(platform's name) through pg_net, with a secret kept in **Supabase Vault** (never in git; privacy P2). The function compares
the secret in constant time. Rows with `attempts < 5` are retried with backoff. On the **third**
failure, the founders are emailed (no PII, only the UUID and kind). Payloads are cleared on
success, and in all cases after 7 days: a receipt or Apple revocation that couldn't be sent within
7 days is dropped and noted in the runbook. The 7-day payload is the only PII the queue holds.
PostHog deletion needs no payload. If the PostHog endpoint can't be automated (week-1 spike), the
runbook deletes by hand within 30 days.

**On the web (ruling 7).** An EN/PL page explains the in-app path and offers "email privacy@ from
your account address". The runbook:

1. Verify that the request came from the account's email.
2. Run the founders' admin script. It calls `delete-account` with the service-role key and
   `{ user_id }`, the same job as in-app (platform B5). The function accepts `user_id` only when the
   caller's role is `service_role`. Fallback if the function is down: run
   `select private.admin_delete_user('<uuid>')` in the SQL editor (it runs `delete_user_data`, then
   `delete from auth.users`, and enqueues the PostHog follow-up).
3. Reply to the user by email.

The web path **can't revoke the Apple token**, because there is no fresh code. This is accepted for
the beta and written on the page (architecture B-10).

**What stays:** household data that other members still use (pets, tasks, notes, and ticks with
the name removed), and card contacts typed by hand for third parties (a neighbour). Copy for the
page (PO2): "Your ticks stay in the household's history as 'Former member'. Your contact is removed
from care cards."

---

### 8.5 Ownership: transfer, auto-transfer, deleting the household (2026-11-23)

- **Model.** `household.owner_id uuid NOT NULL → auth.users ON DELETE RESTRICT`. One NOT NULL column
  means **exactly one owner by construction**. A `role` column would need a partial unique index (at
  most one) plus a deferred constraint trigger (at least one). The RLS check is simply
  `owner_id = auth.uid()`. The app shows "Owner" by comparing `household.owner_id` with
  `household_member.user_id`. The old `household_member.role` column is dropped.
- **DB invariants:**
  1. `owner_id` is set to the creator on insert.
  2. Clients have **no** `UPDATE` grant on `owner_id`.
  3. A `BEFORE UPDATE OF owner_id` trigger requires the new owner to be an active member of the
     household.
  4. A `BEFORE UPDATE OF left_at` / `BEFORE DELETE` trigger on `household_member` raises
     `owner_must_transfer` if the row is the current owner's. Cascades from a household delete are
     exempt (`pg_trigger_depth() > 1`). So the owner is always an active member.
  5. `ON DELETE RESTRICT` on `owner_id` is a safety net: an auth user can't be deleted while they
     still own a household.
- **Next owner.** `private.next_owner(p_household, p_excluding_user)` returns the active member with
  the earliest `joined_at`, with ties broken by `id`. It is used by `leave_household`, by
  `accept_invite` (when it leaves the caller's old household) and by `delete_user_data`. If it
  returns no one, the household is deleted. The transfer is silent apart from the result field;
  mobile shows "Tomek is now the owner" on the next sync.
- **`transfer_ownership(p_household_id, p_member_id)`** (owner only) hands ownership to another
  active member. The former owner stays a member.
- **`delete_household(p_household_id)`** (owner only, online) deletes the household. FK cascades
  remove its pets, routines, ticks, streak days, health records, places, care cards (the links die
  at once and show "no longer available"), invites, reminder preferences and member rows. Pets
  belong to the household, so they go too. The other members' phones drop everything on the next
  sync and show the no-household screen. The app's confirmation names the household, the pets and
  the other members ("This deletes Burek and Mila and their history for Tomek too"). Nothing goes
  into `deletion_followup`, because no account is deleted.

## 9. Care card (ADR 0018)

- **One pet per link** (ruling 5): `care_card_link.pet_id` has a composite FK to
  `pet(id, household_id)`. This makes cross-household scope impossible by construction (privacy
  B1). `get_care_card` also joins on `p.household_id = card.household_id` as defence in depth.
- **Create** (online): `rpc('create_care_card_link', { p_pet_id, p_lang })` returns `{ id, token }`.
  The token is `gen_random_bytes(32)`, base64url, exactly **43 characters**.
  - **Rotate:** `rotate_care_card_link(p_id)` returns the new token, and the old link dies.
  - **Turn off:** `revoke_care_card_link(p_id)` (online, so the owner knows the link is really off).
- **Contacts:** `owner_contacts` holds at most 3 entries of `{ user_id?, first_name, phone }`. The
  app prefills "me" with `user_id`. Hand-typed entries have no `user_id` and stay until edited. A
  trigger validates the shape: `user_id`, if present, must be an active member of the household.
- **Token:** plaintext and readable only by active members, through RLS and the stream (ruling 4,
  privacy R1). It is never sent to PostHog or Sentry, and logs show `/c/<redacted>` (platform P3).
  Anyone who receives a link must be able to re-share it without breaking the sitter's copy.
- **Expiry:** none (confirmed answer 3). The column `expires_at` exists and is already checked.
- **Read:** the Worker calls `get_care_card(p_token)` with the publishable/anon key (`SECURITY
  DEFINER`, `search_path = ''`). For an unknown, revoked or expired token it returns **NULL** (the
  same response in all three cases). Otherwise:
  ```
  { lang, household_today: 'YYYY-MM-DD',
    pet: { name, species, breed?, age_years?, weight_kg?, care_notes? },
    today: [{ template_key, title?, kind, time_of_day?, amount?, marked_done: bool }],
    meds: [{ name, dose?, notes? }],           -- medications active today
    feeding: [{ template_key, title?, amount }],
    vet: { name, phone, address? } | null,     -- if show_vet
    owner_contacts: [{ first_name, phone }],   -- user_id stripped
    note? }
  ```
  - The Worker shows "Marked done" or nothing. Never "Not done" (ruling 4, PO R7). Names are never
    returned.
  - Side effect: `view_count += 1` and `last_viewed_at = now()`. No IP or user agent is stored.
- **Web page details** (platform): `noindex, nofollow, noarchive`, generic meta and Open Graph
  tags, no `Disallow: /c/` in robots.txt, and a public-link warning on the share screen and in the
  card editor (mobile). Card links are web-only, and app links claim `/i/*` only (ruling 3).

---

## 10. Server jobs (pg_cron)

| Job | Schedule | What it does |
|---|---|---|
| `streak_close_due_days()` | `*/15 * * * *` | For each household where `last_closed_date < today_local - 1`: run `streak_recompute` for each pet from `last_closed_date + 1`, then set `last_closed_date`. |
| `deletion-followups` | daily 03:10 UTC | Calls `net.http_post` to the Edge Function `deletion-followup` with the Vault secret (§8.4). |

Not here:
- Reminders and the streak nudge are local on the phone (platform ADR 0020).
- The silent push is deferred (§12).
- Care cards don't expire.
- Expired invites are kept. They are tiny, useless once expired, and needed for the G1 views.

---

## 11. First-cut SQL schema sketch

> A sketch for review, not a migration. Supabase installs `pgcrypto` in the `extensions` schema.
> The exact role names that Supabase's default privileges are set for (`postgres`,
> `supabase_admin`) are `unverified`. Check them with `\ddp` on the project.

### 11.1 Schemas, default privileges, helpers

```sql
create schema if not exists private;      -- NOT in the Data API's exposed schemas
create schema if not exists analytics;    -- NOT exposed; no grants to anon/authenticated
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Privacy B3: stop Supabase's default grants from re-appearing on new objects.
alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema private
  revoke execute on functions from public, anon, authenticated;
alter default privileges for role postgres in schema analytics
  revoke all on tables from public, anon, authenticated;
revoke all on schema analytics from public, anon, authenticated;
-- (After creating everything below, a final sweep repeats the revokes and then applies §11.5 grants.)

create or replace function private.my_household_ids()
returns setof uuid language sql stable security definer set search_path = '' as $$
  select m.household_id from public.household_member m
  where m.user_id = (select auth.uid()) and m.left_at is null
$$;

create or replace function private.today_local(p_household uuid)
returns date language sql stable security definer set search_path = '' as $$
  select (now() at time zone h.timezone)::date from public.household h where h.id = p_household
$$;

create or replace function private.new_token()            -- 256 bits, base64url, 43 chars
returns text language sql volatile set search_path = '' as $$
  select rtrim(translate(encode(extensions.gen_random_bytes(32), 'base64'), '+/', '-_'), '=')
$$;

create or replace function private.raise_app(p_code text)  -- stable error codes (architecture B-7)
returns void language plpgsql as $$
begin raise exception using errcode = 'P0001', message = p_code; end $$;

grant usage on schema private to authenticated;            -- needed for policy evaluation
grant execute on function private.my_household_ids() to authenticated;
```

### 11.2 Tables

```sql
-- per-user ------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  locale text not null default 'pl_PL' check (locale in ('pl_PL','en_US')),
  consent_usage_stats   boolean not null default false,
  consent_crash_reports boolean not null default false,       -- architecture B-2 / privacy P4
  consent_marketing     boolean not null default false,
  consent_updated_at timestamptz,
  consent_policy_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.notification_settings (
  id uuid primary key references auth.users(id) on delete cascade,
  quiet_start time, quiet_end time,
  nudge_enabled boolean not null default false,
  nudge_at time not null default '19:00',
  updated_at timestamptz not null default now()
);

-- household -----------------------------------------------------------------
create table public.household (
  id uuid primary key,
  name text check (char_length(name) <= 60),
  timezone text not null default 'Europe/Warsaw',
  owner_id uuid not null references auth.users(id) on delete restrict,  -- exactly one owner (§8.5); set by trigger, changed by RPC only
  created_by uuid references auth.users(id) on delete set null,   -- set by trigger
  last_closed_date date,                                          -- server-only, not synced
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.household_member (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text check (char_length(display_name) <= 60),
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  removed_by uuid references auth.users(id) on delete set null,
  unique (household_id, user_id)
);
create index on public.household_member (user_id) where left_at is null;
create index on public.household_member (removed_by);
create index on public.household (owner_id);

create table public.invite (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references public.household(id) on delete cascade,
  token text not null unique default private.new_token(),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_by uuid references auth.users(id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  landing_view_count int not null default 0           -- platform B8 / PO P-M3; no IP, no UA
);
create index on public.invite (household_id);

-- pets and routine ----------------------------------------------------------
create table public.pet (
  id uuid primary key,
  household_id uuid not null references public.household(id) on delete cascade on update cascade,
  name text not null check (char_length(name) between 1 and 40),
  species text not null check (species in ('dog','cat')),
  breed text check (char_length(breed) <= 60),
  birth_date date,
  birth_date_estimated boolean not null default false,
  weight_kg numeric(5,2) check (weight_kg > 0 and weight_kg < 150),
  care_notes text check (char_length(care_notes) <= 2000),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, household_id)
);
create index on public.pet (household_id);

create table public.medication (
  id uuid primary key,
  household_id uuid not null, pet_id uuid not null,
  name text not null check (char_length(name) <= 80),
  dose text check (char_length(dose) <= 80),
  notes text check (char_length(notes) <= 500),
  starts_on date not null, ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.medication (pet_id, household_id);
create index on public.medication (household_id);

create table public.task (
  id uuid primary key,
  household_id uuid not null, pet_id uuid not null,
  kind text not null check (kind in ('meal','walk','water','litter','med','custom')),
  template_key text,
  title text check (char_length(title) <= 60),
  amount text check (char_length(amount) <= 40),
  streak_critical boolean not null default false,        -- overwritten by seed trigger
  time_of_day time,                                      -- null = any time today
  every_n_days smallint not null default 1 check (every_n_days between 1 and 90),
  anchor_date date not null,
  ends_on date,
  paused boolean not null default false,
  medication_id uuid references public.medication(id) on delete set null,   -- same-household check by trigger
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (template_key is not null or title is not null),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.task (pet_id, household_id);
create index on public.task (household_id);
create index on public.task (medication_id);

create table public.tick (
  id uuid primary key,                                   -- v5(NS_TICK, task_id|local_date|slot)
  household_id uuid not null, pet_id uuid not null,
  task_id uuid not null references public.task(id) on delete cascade,  -- task deletes are impossible for clients
  local_date date not null,
  slot smallint not null default 0 check (slot between 0 and 11),
  actor_id uuid references auth.users(id) on delete set null,
  client_at timestamptz not null,
  received_at timestamptz not null default now(),
  unique (task_id, local_date, slot),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.tick (pet_id, local_date);
create index on public.tick (household_id);
create index on public.tick (actor_id);

create table public.rest_day (
  id uuid primary key,                                   -- v5(NS_REST, pet_id|local_date)
  household_id uuid not null, pet_id uuid not null,
  local_date date not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (pet_id, local_date),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.rest_day (household_id);
create index on public.rest_day (created_by);

create table public.streak_day (
  id uuid primary key default gen_random_uuid(),         -- architecture B-11
  household_id uuid not null, pet_id uuid not null,
  local_date date not null,
  outcome text not null check (outcome in ('complete','rest','neutral','paw_pass','missed')),
  streak_after int not null check (streak_after >= 0),
  passes_used_in_month smallint not null check (passes_used_in_month between 0 and 2),
  computed_at timestamptz not null default now(),
  unique (pet_id, local_date),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.streak_day (household_id);

-- health, places, contacts --------------------------------------------------
create table public.health_record (
  id uuid primary key,
  household_id uuid not null, pet_id uuid not null,
  kind text not null check (kind in ('vet_visit','vaccination')),
  title text check (char_length(title) <= 80),
  occurred_on date, next_due_on date,
  note text check (char_length(note) <= 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.health_record (pet_id, household_id);
create index on public.health_record (household_id);

create table public.vet_contact (
  id uuid primary key,                                   -- = household_id
  household_id uuid not null unique references public.household(id) on delete cascade on update cascade,
  name text, phone text, address text,
  notes text check (char_length(notes) <= 500),
  updated_at timestamptz not null default now(),
  check (id = household_id)
);

create table public.pet_place (
  id uuid primary key,                                   -- v5(NS_PLACE, pet_id|kind)
  household_id uuid not null, pet_id uuid not null,
  kind text not null check (kind in ('food','groomer')),
  provider text not null check (provider in ('psibufet','booksy','custom')),
  name text check (char_length(name) <= 80),
  url text check (url is null or url ~ '^https://'),
  next_visit_on date,
  note text check (char_length(note) <= 300),
  updated_at timestamptz not null default now(),
  unique (pet_id, kind),
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade
);
create index on public.pet_place (household_id);

-- care card (one pet) -------------------------------------------------------
create table public.care_card_link (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null, pet_id uuid not null,
  token text not null unique default private.new_token(),
  owner_contacts jsonb not null default '[]'
    check (jsonb_typeof(owner_contacts) = 'array' and jsonb_array_length(owner_contacts) <= 3),
  note text check (char_length(note) <= 1000),
  lang text not null default 'pl_PL' check (lang in ('pl_PL','en_US')),
  show_vet boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revoked_at timestamptz,
  expires_at timestamptz,                                -- unused in MVP
  view_count int not null default 0,
  last_viewed_at timestamptz,
  foreign key (pet_id, household_id) references public.pet(id, household_id) on delete cascade on update cascade  -- privacy B1
);
create index on public.care_card_link (pet_id, household_id);
create index on public.care_card_link (household_id);

-- per-user prefs ------------------------------------------------------------
create table public.reminder_pref (
  id uuid primary key,                                   -- v5(NS_REMIND, user_id|task_id)
  user_id uuid not null references auth.users(id) on delete cascade,
  household_id uuid not null references public.household(id) on delete cascade on update cascade,
  task_id uuid not null references public.task(id) on delete cascade,   -- same-household check by trigger
  enabled boolean not null default false,
  anytime_remind_at time,
  updated_at timestamptz not null default now(),
  unique (user_id, task_id)
);
create index on public.reminder_pref (task_id);
create index on public.reminder_pref (household_id);

-- server-only ---------------------------------------------------------------
create table public.deletion_followup (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,                                 -- no FK: the user is gone
  step text not null check (step in ('posthog_person','receipt_email','apple_revoke')),
  payload jsonb not null default '{}',                   -- cleared on success or after 7 days
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  last_error text,
  last_error_at timestamptz,
  done_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.deletion_followup (next_attempt_at) where done_at is null;

create table public.app_config (
  id boolean primary key default true check (id),        -- single row
  min_supported_version text not null default '0.0.0',
  maintenance_message_key text,
  push_sync_enabled boolean not null default false       -- deferred feature (§12)
);
```

### 11.3 Triggers

```sql
-- auth user → profile + settings (architecture B-5)
create or replace function private.on_auth_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (id, display_name, locale)
  values (new.id,
          left(new.raw_user_meta_data->>'display_name', 60),
          coalesce(nullif(new.raw_user_meta_data->>'locale',''), 'pl_PL'))
  on conflict (id) do nothing;
  insert into public.notification_settings (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.on_auth_user_created();

-- household bootstrap (matches mobile C-B3)
create or replace function private.household_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  new.created_by := (select auth.uid());
  new.owner_id   := (select auth.uid());            -- creator = owner
  new.last_closed_date := null;
  if not exists (select 1 from pg_catalog.pg_timezone_names where name = new.timezone) then
    perform private.raise_app('invalid_timezone');
  end if;
  return new;
end $$;
create trigger household_before_insert before insert on public.household
  for each row execute function private.household_before_insert();

-- bootstrap member row is inserted by the client (mobile C-B3); checked here, bypassing RLS
create or replace function private.can_bootstrap(p_household uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.household h
                 where h.id = p_household and h.owner_id = (select auth.uid()))
     and not exists (select 1 from public.household_member m where m.household_id = p_household)
$$;
-- household_member BEFORE INSERT (client path): force left_at=null, joined_at=now()

-- ownership invariants (§8.5)
create or replace function private.next_owner(p_household uuid, p_excluding uuid)
returns uuid language sql stable security definer set search_path = '' as $$
  select m.user_id from public.household_member m
  where m.household_id = p_household and m.left_at is null and m.user_id <> p_excluding
  order by m.joined_at, m.id limit 1
$$;
create or replace function private.household_owner_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.owner_id is distinct from old.owner_id and not exists (
       select 1 from public.household_member m
       where m.household_id = new.id and m.user_id = new.owner_id and m.left_at is null) then
    perform private.raise_app('owner_must_be_member');
  end if;
  return new;
end $$;
create trigger household_owner_guard before update of owner_id on public.household
  for each row execute function private.household_owner_guard();
create or replace function private.member_owner_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  r := coalesce(old, new);
  if pg_trigger_depth() = 1
     and (tg_op = 'DELETE' or (new.left_at is not null and old.left_at is null))
     and exists (select 1 from public.household h where h.id = r.household_id and h.owner_id = r.user_id) then
    perform private.raise_app('owner_must_transfer');
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
create trigger member_owner_guard before update of left_at or delete on public.household_member
  for each row execute function private.member_owner_guard();
-- RPCs that run as SECURITY DEFINER at depth 1 therefore always transfer first:
--   update household set owner_id = private.next_owner(h, uid) ...; then set left_at / delete.
-- (timezone is also validated on UPDATE by a similar trigger)

-- task: seed streak_critical; same-household medication (privacy B1)
create or replace function private.task_before_write()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_species text;
begin
  if tg_op = 'INSERT' then
    select species into v_species from public.pet where id = new.pet_id;
    new.streak_critical := (v_species = 'dog' and new.kind in ('meal','med','walk'))
                        or (v_species = 'cat' and new.kind in ('meal','med','water'));
  end if;
  if pg_trigger_depth() = 1                              -- skip during ON UPDATE CASCADE (pet move)
     and new.medication_id is not null and not exists (
       select 1 from public.medication m where m.id = new.medication_id and m.household_id = new.household_id) then
    perform private.raise_app('cross_household_reference');
  end if;
  return new;
end $$;
create trigger task_before_write before insert or update on public.task
  for each row execute function private.task_before_write();

-- tick: insert guard, delete guard, streak recompute
create or replace function private.tick_before_insert()
returns trigger language plpgsql security definer set search_path = '' as $$
declare v_today date;
begin
  if not exists (select 1 from public.task t
                 where t.id = new.task_id and t.pet_id = new.pet_id and t.household_id = new.household_id) then
    perform private.raise_app('cross_household_reference');
  end if;
  v_today := private.today_local(new.household_id);
  if new.local_date < v_today - 2 or new.local_date > v_today + 1 then
    return null;                                         -- silently ignored
  end if;
  new.actor_id    := (select auth.uid());
  new.client_at   := least(new.client_at, now());
  new.received_at := now();
  return new;
end $$;
create trigger tick_before_insert before insert on public.tick
  for each row execute function private.tick_before_insert();

create or replace function private.tick_before_delete()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  -- only direct client deletes are guarded; FK cascades (pet/household delete, depth > 1)
  -- and service-role/postgres deletes pass (a suppressed cascade row would make the FK action fail)
  if pg_trigger_depth() = 1 and (select auth.uid()) is not null
     and old.local_date < private.today_local(old.household_id) - 1 then
    return null;                                         -- silently ignored
  end if;
  return old;
end $$;
create trigger tick_before_delete before delete on public.tick
  for each row execute function private.tick_before_delete();

create or replace function private.after_care_change()   -- shared by tick and rest_day
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  r := coalesce(new, old);
  if pg_trigger_depth() = 1                              -- not during cascades
     and r.local_date < private.today_local(r.household_id) then
    perform private.streak_recompute(r.pet_id, r.local_date);
  end if;
  return null;
end $$;
create trigger tick_after_change after insert or delete on public.tick
  for each row execute function private.after_care_change();

-- rest_day: today only (ruling 2), created_by from JWT
create or replace function private.rest_day_guard()
returns trigger language plpgsql security definer set search_path = '' as $$
declare r record;
begin
  r := coalesce(new, old);
  if pg_trigger_depth() = 1 and (select auth.uid()) is not null
     and r.local_date <> private.today_local(r.household_id) then
    return null;                                         -- silently ignored
  end if;
  if tg_op = 'INSERT' then new.created_by := (select auth.uid()); return new; end if;
  return old;
end $$;
create trigger rest_day_guard before insert or delete on public.rest_day
  for each row execute function private.rest_day_guard();
create trigger rest_day_after_change after insert or delete on public.rest_day
  for each row execute function private.after_care_change();   -- no-op for today; kept for safety

-- Every guard checks pg_trigger_depth() = 1, so FK cascades (pet move via ON UPDATE CASCADE,
-- pet/household delete) are never suppressed or rejected mid-cascade.
-- reminder_pref: same-household task (privacy B1)
-- care_card_link: created_by := auth.uid() on insert; owner_contacts entries shape-checked and
--                 any user_id must be an active member of household_id
-- updated_at triggers on all tables with updated_at
```

### 11.4 Streak functions

```sql
create or replace function private.day_outcome(p_pet uuid, d date)
returns text language sql stable security definer set search_path = '' as $$
  with due as (
    select t.id as task_id
    from public.task t
    where t.pet_id = p_pet and t.streak_critical and not t.paused
      and t.anchor_date <= d and (t.ends_on is null or t.ends_on >= d)
      and (d - t.anchor_date) % t.every_n_days = 0
  ), agg as (
    select count(*) as due_n,
           count(*) filter (where exists (
             select 1 from public.tick k
             where k.task_id = due.task_id and k.local_date = d and k.slot = 0)) as done_n
    from due
  )
  select case
    when a.due_n = 0 then 'neutral'
    when a.done_n = a.due_n then 'complete'
    when exists (select 1 from public.rest_day r where r.pet_id = p_pet and r.local_date = d) then 'rest'
    when d = (select (p.created_at at time zone h.timezone)::date
              from public.pet p join public.household h on h.id = p.household_id where p.id = p_pet)
      then 'neutral'
    else 'missed' end
  from agg a
$$;

create or replace function private.streak_recompute(p_pet uuid, p_from date)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_hh uuid; v_tz text; v_today date; v_start date; d date;
  v_len int := 0; v_passes smallint := 0; v_out text; v_prev record;
begin
  perform pg_advisory_xact_lock(hashtext(p_pet::text));
  select p.household_id, h.timezone, (p.created_at at time zone h.timezone)::date
    into v_hh, v_tz, v_start
    from public.pet p join public.household h on h.id = p.household_id where p.id = p_pet;
  if v_hh is null then return; end if;
  v_today := (now() at time zone v_tz)::date;
  d := greatest(p_from, v_start);

  select streak_after, passes_used_in_month, local_date into v_prev
    from public.streak_day where pet_id = p_pet and local_date = d - 1;
  if found then
    v_len := v_prev.streak_after;
    v_passes := case when date_trunc('month', d) = date_trunc('month', v_prev.local_date)
                     then v_prev.passes_used_in_month else 0 end;
  end if;

  while d < v_today loop
    if extract(day from d) = 1 then v_passes := 0; end if;
    v_out := private.day_outcome(p_pet, d);
    if v_out = 'complete' then v_len := v_len + 1;
    elsif v_out = 'missed' then
      if v_passes < 2 then v_out := 'paw_pass'; v_passes := v_passes + 1;
      else v_len := 0; end if;
    end if;
    insert into public.streak_day (household_id, pet_id, local_date, outcome, streak_after, passes_used_in_month)
    values (v_hh, p_pet, d, v_out, v_len, v_passes)
    on conflict (pet_id, local_date) do update
      set outcome = excluded.outcome, streak_after = excluded.streak_after,
          passes_used_in_month = excluded.passes_used_in_month, computed_at = now();
    d := d + 1;
  end loop;
end $$;

create or replace function private.streak_close_due_days()
returns void language plpgsql security definer set search_path = '' as $$
declare h record; p record; v_yday date;
begin
  for h in select id, timezone, last_closed_date from public.household loop
    v_yday := (now() at time zone h.timezone)::date - 1;
    continue when h.last_closed_date is not null and h.last_closed_date >= v_yday;
    for p in select id from public.pet where household_id = h.id loop
      perform private.streak_recompute(p.id, coalesce(h.last_closed_date + 1, v_yday));
    end loop;
    update public.household set last_closed_date = v_yday where id = h.id;
  end loop;
end $$;

select cron.schedule('streak-close', '*/15 * * * *', 'select private.streak_close_due_days()');
select cron.schedule('deletion-followups', '10 3 * * *', $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'deletion_followup_url'),
    headers := jsonb_build_object('x-cron-secret',
                 (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')),
    body    := '{}'::jsonb)
$$);
```

### 11.5 RLS and grants (every table)

```sql
-- RLS ON for every table, including server-only ones (privacy B3b)
alter table public.profiles              enable row level security;
alter table public.notification_settings enable row level security;
alter table public.household             enable row level security;
alter table public.household_member      enable row level security;
alter table public.invite                enable row level security;
alter table public.pet                   enable row level security;
alter table public.medication            enable row level security;
alter table public.task                  enable row level security;
alter table public.tick                  enable row level security;
alter table public.rest_day              enable row level security;
alter table public.streak_day            enable row level security;
alter table public.health_record         enable row level security;
alter table public.vet_contact           enable row level security;
alter table public.pet_place             enable row level security;
alter table public.care_card_link        enable row level security;
alter table public.reminder_pref         enable row level security;
alter table public.deletion_followup     enable row level security;   -- no policies: server only
alter table public.app_config            enable row level security;   -- no policies: read via RPC

-- Policy pattern for household-scoped tables (shown for pet)
create policy pet_rw on public.pet for all to authenticated
  using      (household_id in (select private.my_household_ids()))
  with check (household_id in (select private.my_household_ids()));
-- Same "household_rw" policy on: medication, task, tick, rest_day, health_record,
-- vet_contact, pet_place, care_card_link; select-only policy on streak_day (invite: owner-only, below).
-- Grants below decide which commands are possible at all.

create policy household_select on public.household for select to authenticated
  using (id in (select private.my_household_ids()));
create policy household_insert on public.household for insert to authenticated
  with check (true);                                     -- created_by forced by trigger
create policy household_update on public.household for update to authenticated
  using (owner_id = (select auth.uid()))                 -- owner only (rename, time zone)
  with check (owner_id = (select auth.uid()));
create policy invite_select_owner on public.invite for select to authenticated   -- replaces the member-wide select
  using (household_id in (select h.id from public.household h where h.owner_id = (select auth.uid())));
create policy member_select on public.household_member for select to authenticated
  using (household_id in (select private.my_household_ids()));
create policy member_bootstrap on public.household_member for insert to authenticated
  with check (user_id = (select auth.uid()) and private.can_bootstrap(household_id));
create policy member_update_self on public.household_member for update to authenticated
  using (user_id = (select auth.uid()) and left_at is null)
  with check (user_id = (select auth.uid()));
create policy own_profile on public.profiles for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy own_settings on public.notification_settings for all to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy own_reminder on public.reminder_pref for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()) and household_id in (select private.my_household_ids()));

-- Explicit grants (= the upload map in §6.2)
revoke all on all tables in schema public from anon, authenticated;
grant select, insert, update, delete on public.pet, public.medication, public.health_record to authenticated;
grant select, insert on public.task to authenticated;
grant update (title, template_key, amount, time_of_day, every_n_days, anchor_date, ends_on,
              paused, medication_id, sort_order) on public.task to authenticated;   -- no streak_critical, no DELETE (B-3)
grant select, insert, delete on public.tick, public.rest_day to authenticated;      -- no UPDATE
grant select, insert, update on public.pet_place, public.vet_contact, public.reminder_pref to authenticated;
grant select, insert on public.household to authenticated;
grant update (name, timezone) on public.household to authenticated;   -- not owner_id
grant select, insert on public.household_member to authenticated;   -- insert = bootstrap only (policy)
grant update (display_name) on public.household_member to authenticated;
grant select on public.invite, public.streak_day, public.care_card_link to authenticated;
grant update (owner_contacts, note, lang, show_vet) on public.care_card_link to authenticated;
grant select, update on public.profiles, public.notification_settings to authenticated;
-- deletion_followup, app_config: no grants

revoke execute on all functions in schema public, private from public, anon, authenticated;
grant execute on function private.my_household_ids(), private.can_bootstrap(uuid) to authenticated;
grant execute on function public.get_care_card(text), public.health(), public.get_app_config(),
  public.record_invite_landing(text) to anon, authenticated;
grant execute on function
  public.create_invite(uuid), public.revoke_invite(uuid), public.preview_invite(text),
  public.accept_invite(text, text, boolean), public.remove_member(uuid),
  public.leave_household(uuid), public.transfer_ownership(uuid, uuid), public.delete_household(uuid),
  public.create_care_card_link(uuid, text), public.rotate_care_card_link(uuid),
  public.revoke_care_card_link(uuid)
  to authenticated;
-- private.delete_user_data(uuid), private.admin_delete_user(uuid): postgres / service_role only
```

RPC signatures (bodies per §8–§9). Every RPC is `SECURITY DEFINER`, sets `search_path = ''`, checks
`auth.uid()` membership explicitly, and raises `P0001` with a stable message key:

| RPC | Returns | Error keys (mobile maps them to `app.error.*`) |
|---|---|---|
| `create_invite(p_household_id)` (**owner**) | `{ token, expires_at }` | `not_a_member`, `not_owner` |
| `revoke_invite(p_invite_id)` (**owner**) | void | `not_a_member`, `not_owner` |
| `preview_invite(p_token)` | §8.2 shape (status and `full` inside, no raise) | — |
| `record_invite_landing(p_token)` (anon) | `{ open }`; increments `landing_view_count` when open | — |
| `accept_invite(p_token, p_display_name, p_confirm_leave)` | `{ household_id }` | `invite_not_found`, `invite_expired`, `invite_revoked`, `invite_used`, `household_full`, `already_member`, `confirm_leave_required` |
| `remove_member(p_member_id)` (**owner**) | `{ household_deleted, new_owner_member_id, open_invites_revoked, care_cards }` | `not_a_member`, `not_owner`, `member_not_found`, `cannot_remove_self` |
| `leave_household(p_household_id)` (any member) | same shape as `remove_member` | `not_a_member` |
| `transfer_ownership(p_household_id, p_member_id)` (**owner**) | void | `not_owner`, `member_not_found` |
| `delete_household(p_household_id)` (**owner**) | void | `not_owner` |
| `create_care_card_link(p_pet_id, p_lang)` | `{ id, token }`. The household is derived from the pet, so mobile's extra `p_household_id` is dropped and a foreign pet can't be named | `not_a_member`, `pet_not_found` |
| `rotate_care_card_link(p_id)` / `revoke_care_card_link(p_id)` | `text` / void | `not_a_member`, `card_not_found` |
| `get_care_card(p_token)` (anon) | jsonb or NULL | — |
| `health()`, `get_app_config()` (anon) | jsonb | — |
| Trigger errors | — | `cross_household_reference`, `invalid_timezone`, `owner_must_be_member`, `owner_must_transfer` |

### 11.6 CI check and minimal RLS tests (privacy B3c)

`supabase/tests/security_check.sql` runs against the local stack in CI and fails the build:

```sql
do $$
declare bad text;
begin
  -- 1. every public table has RLS on
  select string_agg(c.relname, ', ') into bad
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r' and not c.relrowsecurity;
  if bad is not null then raise exception 'RLS off on: %', bad; end if;

  -- 2. anon has no table privileges in public
  select string_agg(c.relname, ', ') into bad
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r','v')
    and (has_table_privilege('anon', c.oid, 'SELECT') or has_table_privilege('anon', c.oid, 'INSERT')
      or has_table_privilege('anon', c.oid, 'UPDATE') or has_table_privilege('anon', c.oid, 'DELETE'));
  if bad is not null then raise exception 'anon table grants on: %', bad; end if;

  -- 3. anon can execute only the allow-listed functions
  select string_agg(p.oid::regprocedure::text, ', ') into bad
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname in ('public','private','analytics')
    and has_function_privilege('anon', p.oid, 'EXECUTE')
    and p.proname not in ('get_care_card','record_invite_landing','health','get_app_config');
  if bad is not null then raise exception 'anon can execute: %', bad; end if;

  -- 4. analytics schema not usable by API roles
  if has_schema_privilege('anon','analytics','USAGE') or has_schema_privilege('authenticated','analytics','USAGE') then
    raise exception 'analytics schema exposed';
  end if;
end $$;
```

`supabase/tests/rls_cases.sql` seeds two households (H1 with users A and B, H2 with user C).
It sets `set local role authenticated; set local request.jwt.claims = '{"sub":"<uid>"}'`, or
`role anon`, and asserts six cases:

1. **Non-member.** C can't `select` H1's pets (0 rows), and C's `insert` of a tick into H1 fails
   with `42501`.
2. **Removed member.** After `remove_member(B)`, B sees 0 rows of H1, a tick insert fails, and
   `accept_invite` with an invite that was open before the removal returns `invite_revoked`
   (privacy B2).
3. **anon tables.** `anon` gets "permission denied" on `select * from pet`, `tick` and
   `care_card_link`.
4. **Revoked token.** After `revoke_care_card_link`, `get_care_card(token)` returns NULL, for both
   anon and members.
5. **Foreign pet on a card.** A tries `create_care_card_link(<H2 pet id>)` and gets `pet_not_found`.
   A direct `update care_card_link set pet_id = <H2 pet>` is denied because there is no column
   grant, and the composite FK would reject it anyway.

6. **Owner-only actions** (2026-11-23). As member B, `create_invite`, `remove_member(A)`,
   `transfer_ownership`, `delete_household` and `update household set name = …` all fail
   (`not_owner`, or 0 rows for the update). A direct `update household set owner_id = B` is denied
   (no column grant). When owner A calls `leave_household`, `owner_id` becomes the member with the
   earliest `joined_at`, and A's row has `left_at` set.

The full pgTAP suite is LATER.

### 11.7 Analytics views (ruling 9, privacy R3)

These views report aggregates only and are for the team's use in the SQL editor. They are not
exposed, have no grants to API roles, and are never joined with PostHog. Results with fewer than 5
households are not shared outside the team.

```sql
create view analytics.g1_invites as          -- G1 primary: invite created within 7 days; secondary: accepted
select date_trunc('week', h.created_at) as cohort_week,
       count(*) as households,
       count(*) filter (where exists (select 1 from public.invite i
         where i.household_id = h.id and i.created_at < h.created_at + interval '7 days')) as invited_7d,
       count(*) filter (where exists (select 1 from public.household_member m
         where m.household_id = h.id and m.user_id is distinct from h.created_by
           and m.joined_at < h.created_at + interval '7 days')) as partner_joined_7d
from public.household h
where h.created_at < now() - interval '7 days'
group by 1;

create view analytics.tick_activity as       -- G1: ticks per active pet per day, % by non-creators
select k.local_date,
       count(distinct k.pet_id) as active_pets,
       count(*) as ticks,
       count(*) filter (where k.actor_id is distinct from h.created_by) as ticks_by_non_creator
from public.tick k join public.household h on h.id = k.household_id
group by 1;

create view analytics.g3_streaks as          -- G3: share of active pets reaching a 7-day streak, per week
select date_trunc('week', s.local_date) as week,
       count(distinct s.pet_id) as pets_with_closed_days,
       count(distinct s.pet_id) filter (where s.streak_after >= 7) as pets_streak_7,
       count(*) filter (where s.outcome = 'paw_pass') as paw_passes,
       count(*) filter (where s.outcome = 'rest') as rest_days,
       count(*) filter (where s.outcome = 'missed' and s.streak_after = 0) as resets
from public.streak_day s
group by 1;

create view analytics.g1_invite_funnel as    -- invite created → landing opened → accepted
select date_trunc('week', i.created_at) as week,
       count(*) as invites,
       count(*) filter (where i.landing_view_count > 0) as landing_opened,
       count(*) filter (where i.accepted_at is not null) as accepted
from public.invite i group by 1;

-- D30 "active" signal (platform open question 2), defined by backend:
-- a member is ACTIVE on household day d if they are the actor of >= 1 tick with local_date = d.
-- D30 retained = active on at least one day in days 28-32 after joined_at (household dates).
-- No app-open "check-in" is recorded server-side in the MVP (data minimisation); app-open
-- retention for consented users comes from PostHog lifecycle events and is reported separately.
create view analytics.d30_retention as
select date_trunc('week', m.joined_at) as join_week,
       count(*) as members,
       count(*) filter (where exists (
         select 1 from public.tick k join public.household h on h.id = k.household_id
         where k.actor_id = m.user_id and k.household_id = m.household_id
           and k.local_date between (m.joined_at at time zone h.timezone)::date + 28
                                and (m.joined_at at time zone h.timezone)::date + 32)) as retained_d30
from public.household_member m
where m.joined_at < now() - interval '33 days'
group by 1;

create view analytics.g2_cards as            -- G2 early signal
select count(*) as cards, count(*) filter (where revoked_at is null) as active,
       count(*) filter (where view_count > 0) as opened, sum(view_count) as views
from public.care_card_link;
```

Platform's client-side streak events are replaced by these views (architecture P-3, owned by
platform). PostHog keeps only consented product events.

---

## 12. Planned follow-up (not in the MVP): silent "sync now" push

Per ruling 8, build this only if beta testers report reminders for tasks that are already done. The
design is kept so it can be added without breaking anything:

- A table `push_device (id, user_id → auth.users ON DELETE CASCADE, expo_token unique, platform,
  locale, app_version, last_seen_at, last_pushed_at, created_at)`. It has RLS for the owner only,
  is not synced, and is written only through `register_push_device` and `unregister_push_device`.
- Triggers on `tick` (insert and delete), `task`, `household_member` and `care_card_link`.
  They call `notify-household(household_id, actor_user_id)` through pg_net, with a Vault secret.
  Recipients come from the database only. On removal, the removed member's devices are included.
  Sends are debounced to one every 2 minutes per device. `app_config.push_sync_enabled` gates it.
- Until then, removal and partner ticks reach other phones on their next sync, and reminder copy
  says "check Today" (platform).

---

## 13. Contracts

### 13.1 With the mobile architect

| # | Contract | Shape |
|---|---|---|
| S1 | **Local schema** | The PowerSync client schema mirrors §11.2 for the tables in §6.1. `household` has no `last_closed_date`. `streak_day` and `invite` are read-only. Arrays and jsonb arrive as JSON text. |
| S2 | **Ids** | UUID v7 by default. Deterministic ids for the tables in §3, generated from the shared `packages/domain/ids.ts` with the exact key strings `task_id|local_date|slot`, `pet_id|local_date`, `pet_id|kind` and `user_id|task_id`. |
| S3 | **Upload map and errors** | §6.2, table by table, including the SQLSTATE discard list. Retry 401 after refresh. Add a connector test per table against local Supabase. |
| S4 | **Ticks** | Local `INSERT OR IGNORE`. Undo is a `DELETE`. Undoing **another member's** tick asks for confirmation first. The UI offers today and yesterday. "Done" means the row exists. "Done by" is `household_member.display_name` for `(household_id, actor_id)`, or "Former member" if `actor_id` is null or has no member row. Credit flips after sync are silent. |
| S5 | **Rest days** | The UI offers today only. Setting and clearing a rest day are both queued writes. |
| S6 | **Household day and streak** | `localDate(now, household.timezone)`. `packages/domain/streak` `provisionalStreak(latestStreakDay, openDays[])` covers every unclosed day: rest bridges, the first day is neutral, and a third miss resets. It must pass `streak-fixtures.json`. `streak_critical` is read-only. |
| S7 | **Bootstrap** | **Confirmed as mobile C-B3:** one transaction inserts `household` → the creator's `household_member` (`user_id = me`, `display_name`) → `pet` → `task`s. No `RETURNING`. There is no server trigger. The server sets `household.owner_id = me`, so the creator is the owner (the client may send it, but the value is overwritten). |
| S8 | **Join** | Flow: `invite/[token]` → sign in → display name → `preview_invite` → confirm sheet naming what leaves and what comes along → flush the queue → `accept_invite(p_token, p_display_name, p_confirm_leave)`. No pet creation for invited new users. No typable code. |
| S9 | **Owner, remove and leave** | "Owner" = `household.owner_id`. Show owner-only controls (invite, remove, rename, time zone, transfer, delete household) only when `owner_id = me`. A member's queued rename would be discarded with `42501`. `remove_member(p_member_id)` is owner only. `leave_household(p_household_id)` is for anyone, with auto-transfer. `transfer_ownership(p_household_id, p_member_id)`. `delete_household(p_household_id)` needs a confirmation naming the pets and the other members. If a result has `care_cards > 0`, offer "Replace care card links?". Open invites sync to the owner only. |
| S10 | **Care cards** | Online RPCs only (`create_care_card_link(p_pet_id, p_lang)`, `rotate_…`, `revoke_…`). The editor updates `owner_contacts` (with "me" carrying `user_id`), `note`, `lang` and `show_vet` as queued updates. Show the public-link warning. The owner previews the card in the browser. |
| S11 | **Auth and deletion** | §7.2 and §8.4: `signInWithIdToken` or OTP with `data: { locale, display_name }`. Deletion uses Apple re-auth for a fresh code, then `functions.invoke('delete-account', …)`, then `disconnectAndClear()`. If a refresh says the user no longer exists, clear everything locally. Don't store Apple codes at sign-in. |
| S12 | **Errors** | RPCs raise `P0001` with the message keys in §11.5. Mobile maps them to `app.error.<key>` in `en_US.json` and `pl_PL.json`. |

### 13.2 With the platform-services architect

| # | Topic | Backend provides |
|---|---|---|
| B1 | **Reminder and nudge data** | `household.timezone`; `task(pet_id, kind, title, template_key, time_of_day, every_n_days, anchor_date, ends_on, paused, streak_critical)`; `tick(task_id, local_date, slot = 0, actor_id, client_at)`, where "already done" means the row exists (planner rule 3 holds as written); `rest_day` (a rest day cancels the nudge, PO S-P3); `reminder_pref` and `notification_settings` (synced to their owner only); and the shared streak module. |
| B2/B3 | **Push registry and sync-now trigger** | **Deferred** (§12, ruling 8). Not built for the MVP. |
| B4 | **Care-card read** | `get_care_card(p_token)` with the §9 shape: **one pet**, `marked_done` only, no names, `owner_contacts` without `user_id`, and NULL for unknown, revoked or expired tokens. The token is plaintext, 43 characters, and looked up by `token` (ruling 4). Side effect: `view_count` and `last_viewed_at`. The anon key can execute only this function plus `health` and `get_app_config`. |
| B5 | **Deletion** | **Confirmed as platform B5.** `delete-account` (user JWT, or the service role with `{ user_id }` for the runbook) owns the data steps and enqueues `deletion_followup(user_id, step, payload, attempts, last_error_at, done_at)`. Platform supplies the PostHog person deletion, the receipt email and the founders' alert. `deletion-followup` retries daily (pg_cron → pg_net → Vault secret, constant-time compare). The receipt payload keeps the email only until it is sent (at most 7 days). |
| B6 | **Web deletion** | A manual runbook (ruling 7): the admin script calls `delete-account` with the service role (SQL fallback `private.admin_delete_user`). There is no `deletion_request` table and no request or confirm functions. The page states that Apple revocation isn't possible on this path. |
| B7 | **Auth emails** | Email OTP. `locale` and `display_name` go in the sign-up metadata. Platform chooses between the Send Email Hook and Resend SMTP with a bilingual template (architecture P-7 recommends SMTP first). |
| B8 | **Ops and anon RPCs** | `health()`, `get_app_config()` (`min_supported_version`, `maintenance_message_key`, `push_sync_enabled = false`), `get_care_card()` and **`record_invite_landing(p_token) → { open }`**, which increments `invite.landing_view_count`. These are the only four anon-executable functions, and the CI check enforces it. |
| B9 | **Consent fields** | `profiles.consent_usage_stats`, `consent_crash_reports` and `consent_marketing` (all default false), plus `consent_updated_at` and `consent_policy_version`. Synced to the owner. |
| B10 | **G1/G2/G3 aggregates** | The `analytics.*` views in §11.7, used by the team only. They include the landing funnel and **D30, where "active" means at least 1 tick as actor on that household day, in days 28–32 after joining**. A member who only reads Today counts as not active on the server; PostHog lifecycle covers app opens for consented users. Platform drops the client streak events (`streak_day_completed`, `paw_pass_used`, `streak_reset`) and keeps consented product events. G1 is defined as invite created within 7 days (primary) and partner joined within 7 days (secondary). |
| B11 | **Secrets** | The Vault holds `cron_secret` and `delete_account_url`. Secrets are compared in constant time. Logs redact `/c/`, `/i/` and `t=` (platform P2/P3). |

---

## 14. Open questions and risks

**For Eyup (confirmable decisions):**
1. **Tick credit = whoever syncs first** (ruling 1), not whoever tapped first. In practice the credit
   can quietly move to the person whose phone found signal first.
2. **Rest days are today only**, with no monthly limit. A rest day keeps the streak but adds nothing
   (ruling 2).
3. **Pets that came in with a member stay with the household** if that member is later removed
   (PO Q3).

**Open:**
4. The **week-1 spikes**:
   - native ID-token sign-in on Expo;
   - Apple code exchange and revoke inside `delete-account`;
   - the PostHog person-deletion endpoint;
   - PowerSync free-plan inactivity (whether an uptime ping counts as activity is `unverified`);
   - Sync Streams column lists and predicates;
   - the default-privileges role names (`\ddp`).
5. A **groomer visit is a date**, not a time (`pet_place.next_visit_on`). Product owner to confirm
   (architecture row 24).

**Before public launch (parked):**
- a PowerSync DPA, or self-hosting;
- accepting the Supabase DPA;
- a backup and PITR retention statement in the privacy notice;
- a tick history window in the streams;
- the full pgTAP suite;
- data export;
- the automated web deletion flow;
- Resend log retention;
- confirming that PowerSync compaction removes deleted rows;
- moving to publishable and secret API keys.

---

## 15. ADR drafts

| # | File | Decision |
|---|---|---|
| 0010 | `0010-supabase-backend-frankfurt.md` | Supabase Pro in Frankfurt as the backend |
| 0011 | `0011-supabase-auth-over-clerk.md` | Supabase Auth, not Clerk |
| 0012 | `0012-powersync-offline-sync.md` | PowerSync as the sync engine, with the per-table upload map and error classification |
| 0013 | `0013-powersync-cloud-eu-over-self-host.md` | PowerSync Cloud (EU, free) over self-hosting |
| 0014 | `0014-tick-one-row-per-task-day.md` | Ticks are one row per task per household day, with a deterministic id and undo by DELETE. The event log is the rejected option |
| 0015 | `0015-household-local-date.md` | The day is the household's local date, stamped by the client |
| 0016 | `0016-server-owned-streak.md` | The streak is computed in SQL on the server, with a provisional value on the phone, rest days today only, and shared fixtures |
| 0017 | `0017-no-anonymous-auth-sign-in-before-server-data.md` | No anonymous auth. The client bootstraps household membership under RLS |
| 0018 | `0018-care-card-token-rpc.md` | One-pet care card behind a token-gated `SECURITY DEFINER` RPC, with the token in plaintext |
| 0019 | `0019-membership-and-account-deletion.md` | One owner (`household.owner_id`) plus members with auto-transfer, preview-and-confirm join, removal revokes invites and strips contacts, deletion with a follow-up queue |

---

## 16. If a confirmed answer changes later

| Answer | If it changes | What changes here |
|---|---|---|
| 2. Sitters don't tick | **Sitters tick on the card** | Add an anon RPC `care_card_tick(p_token, p_task_id)`. It inserts the deterministic tick (same id, so it is idempotent with members' ticks) with `actor_id = NULL` and a new `actor_card_id`, and the tick counts toward the streak. It is rate-limited by the Worker, and the page needs a script, so the CSP loosens. Sitter **accounts** (a `sitter` role with `valid_until`) are a larger change and not recommended for the beta. |
| 3. No auto-expiry | **Links expire** | Set `expires_at` at creation. The RPC already checks it. Add a UI picker. |
| 4. No photos | **Profile photo** | Storage bucket `pet-photos/{household_id}/{pet_id}.jpg` with storage RLS by folder, resizing on the phone, deleting objects in `delete_user_data` and on pet delete, and a signed URL in `get_care_card`. Then switch the card token to a hash (privacy R1 LATER). New ADR. |
| 5. Owner + members, up to 6 | **Two only**, larger, or back to equal rights | Change the cap constant in `accept_invite`. Equal rights again: replace the `owner_id` checks with membership checks. The column can stay. |
| 6. Dog = meals + meds + walks | **Changes again** | Change the seed in `task_before_write` and `packages/domain`, plus a one-off `UPDATE task SET streak_critical = …`. Closed days stay frozen. |
| 1. Vet finder and Info library out | **In** | No backend tables. The Places proxy is platform's. |
| 7. Invite-only beta | **Open beta** | Budget PowerSync Pro ($49). Bring the DPA work and the automated web deletion forward. Consider CAPTCHA on OTP. |
| 8. G1 ≥ 40% | **Other number** | Only the threshold applied to `analytics.g1_invites`. |
| Ruling 1 (tick model) | **Eyup prefers first-tapped credit or an audit trail** | Switch to the rejected event-log option in ADR 0014 (random ids, done/undo events, a fold in TypeScript and SQL). Mobile and platform readers change from "row exists" to "folded state". |

---

## 17. Revision log (phase 4)

| Finding | Source | Fix |
|---|---|---|
| Ruling 1 / arch B-1 / PO M-1 | Rulings, arch, PO | Ticks are one row per `(task, local_date, slot)` with a deterministic v5 id and a unique key. Clients insert with `ignoreDuplicates`, so the first upload is credited. `DELETE` is granted with a window guard (today/yesterday). An `AFTER DELETE` recompute runs. The fold and its fixtures are removed (§4, §6.3, §11). ADR 0014 is rewritten, with the event log as the rejected option. Listed for Eyup (§14 Q1). |
| PO M-2 | PO | Confirmation before undoing another member's tick is written into the contract (§4.2, S4). |
| Ruling 2 / arch B-4 | Rulings, arch | Rest-day insert and delete are accepted for `today_local` only (trigger). No monthly limit; a rest day bridges without extending. A fixture is added. The phone's provisional streak covers every unclosed day (§5). |
| Arch B-2 / privacy P4 | Arch, privacy | Added `profiles.consent_crash_reports` (default false; ruling 10). |
| Arch B-3 | Arch | No `DELETE` grant on `task`. Removal is `ends_on`. `streak_critical` is not updatable (§3.1, §11.5). |
| Arch B-5 | Arch | An `auth.users` trigger creates `profiles` and `notification_settings` (§11.3). |
| Arch B-6 / M-7 / ruling 12 | Arch, rulings | Display-name step. `accept_invite(p_display_name)`. The household trigger copies the profile name (§7.2). |
| Arch B-7 | Arch | Stable `P0001` error keys per RPC, mapped by mobile to i18n (§11.5, S12). |
| Arch B-8 / ruling 5 | Arch, rulings | One pet per care card: `pet_id` with a composite FK (§9). |
| Arch B-9 / ruling 8 | Arch, rulings | The silent push and `push_device` are moved to a planned follow-up (§12). They are not in the MVP or in the Edge Function count. |
| Arch B-10 | Arch | The web path can't revoke the Apple token. This is stated and accepted (§8.4). |
| Arch B-11 | Arch | `streak_day.id` uses `gen_random_uuid()` and upserts on `(pet_id, local_date)`. |
| Arch B-12 | Arch | The stream selects `household` columns without `last_closed_date` (§6.1). |
| Arch row 5 / M-4, mobile C-B3 (revised) | Arch, rulings, mobile | **The client inserts the creator's `household_member` row** in the same transaction as the household, guarded by RLS `member_bootstrap` / `private.can_bootstrap`. This matches mobile's revised C-B3. No server trigger (§8.1, S7, §11.3, §11.5). |
| Arch rows 2–4, 6 / ruling 14 | Arch, rulings | Per-table upload map, plus an explicit SQLSTATE discard list. 401, network errors and 5xx are retried (§6.2). |
| Privacy B1 | Privacy | One-pet card with a composite FK. `get_care_card` joins on the household. Same-household triggers for `tick.task_id`, `task.medication_id` and `reminder_pref.task_id`. RLS test 5 (§3, §9, §11). |
| Privacy B2 | Privacy | `remove_member` (and leaving, including leaving through `accept_invite`) revokes every open invite of the household. RLS test 2 (§8.3). |
| Privacy B3 | Privacy | Default privileges revoked in `public`, `private` and `analytics`. RLS on every table, including server-only ones. Explicit grants. A CI security check plus 5 RLS cases (§11.1, §11.5, §11.6). |
| Privacy B4 | Privacy | `owner_contacts` entries carry `user_id`. They are stripped on remove, leave and account deletion. Hand-typed entries stay (§8.3, §8.4, §9). |
| Privacy B5 | Privacy | The Postgres and Auth deletion is the commit point. External steps go to `deletion_followup` and are retried daily through pg_cron, pg_net and a Vault secret. Founders are alerted on the third failure. Payloads are cleared within 7 days (§8.4). |
| Privacy B6 (LATER, done) | Privacy | `*_by` columns are set by triggers from `auth.uid()` (§3). |
| Privacy P2 (backend part) | Privacy | The cron secret is in Vault, never in git. Comparison is constant-time (§8.4, B11). |
| Privacy R6 / PO2 | Privacy, PO | Deletion copy covers "Former member" and contact removal (§8.4). |
| PO B-M2 / M-4 / ruling 11 | PO, rulings | `preview_invite` plus a confirmation sheet that names the household left and who stays. `p_confirm_leave` is enforced by the RPC. Pets come along by default. Joining never deletes pets (`p_bring_pets` removed). Invited new users skip pet creation (§8.2). |
| PO B-M1 / ruling 6 | PO, rulings | No typable invite code. Invites are share links. G1 is split into created-within-7-days (primary) and joined (secondary) in `analytics.g1_invites`. |
| Ruling 4 / privacy R1–R2 | Rulings, privacy | The token is plaintext, 43 characters (256-bit), and readable by members. The card returns `marked_done` only, with no names. Web headers and the share warning are noted for platform and mobile (§9). |
| Ruling 7 / arch P-5, platform B5/B6 | Rulings, arch, platform | The web deletion is a manual runbook: the admin script calls `delete-account` with the service role, with `private.admin_delete_user` as the SQL fallback. The `deletion_request` table is dropped. The retry function is named `deletion-followup` and the queue column `step`, as platform asked (§8.4). |
| Ruling 9 / privacy R3 / arch P-3 | Rulings, privacy, arch | `analytics` schema views for G1, G2 and G3, aggregate only and not exposed (§11.7). |
| PO S-M6 | PO | The household time zone is editable by members (§5.3). |
| PO S-P3 | PO | A rest day cancels the nudge: data is provided in B1 (platform owns the rule). |
| Platform B8 / PO P-M3 | Platform, PO | Added `invite.landing_view_count` and the anon RPC `record_invite_landing(p_token) → { open }`. The anon allow-list is now 4 functions, in the CI check and the grants. Added the `analytics.g1_invite_funnel` view (§8.2, §11). |
| Platform B10 (D30 signal) | Platform | Defined D30 "active" as at least 1 tick as actor on that household day, in days 28–32 after joining. There is no server-side check-in. Added the `analytics.d30_retention` view (§11.7). |
| Platform B9 | Platform | `consent_crash_reports` is in `profiles` (default false). |
| Mobile C-B1/C-B6 (signatures) | Mobile | Confirmed: `care_card_link.pet_id`; tick unique `(task_id, local_date, slot)` with no `action` column; `DELETE` grant with window guard and `AFTER DELETE` recompute; rest days today only; `profiles` and `notification_settings` created by an `auth.users` trigger; no `DELETE` on `task`. **Final:** `preview_invite(p_token)` returns a superset of the mobile shape; `accept_invite(p_token, p_display_name, p_confirm_leave)`. `create_care_card_link(p_pet_id, p_lang)` (household derived from the pet; mobile drops `p_household_id`). |

---

## 18. Revision log (2026-11-23, owner role)

| Change | Source | Fix |
|---|---|---|
| Owner + members replaces equal rights | Eyup; spec need 2, decision 5 | Added `household.owner_id uuid NOT NULL` (exactly one owner by construction; simpler than a role column with a partial unique index and a deferred check). Dropped `household_member.role` (§8.5, §11.2). |
| Owner-only actions | Eyup | `create_invite`, `revoke_invite`, `remove_member` (not self), the new `transfer_ownership` and `delete_household` check `owner_id = auth.uid()` (`not_owner`). The household rename/time-zone RLS update policy is `owner_id = auth.uid()`. Open invites sync to the owner only (§7.3, §6.1, §11.5). |
| Bootstrap creator = owner | Eyup | The `household_before_insert` trigger forces `owner_id := auth.uid()`. `can_bootstrap` checks `owner_id` (§8.1). |
| Leave and auto-transfer | Eyup | New `leave_household(p_household_id)` for any member. Ownership passes to the earliest `joined_at` active member (`private.next_owner`), and the household is deleted if no one remains. The same rule applies in `accept_invite` (leaving the old household) and in `delete_user_data` (§8.3–§8.5). |
| Exactly one owner in the DB | Eyup | NOT NULL; no client grant on `owner_id`; a trigger requires the new owner to be an active member; a trigger blocks the owner's membership from ending without a transfer (`owner_must_transfer`); `ON DELETE RESTRICT` on the auth user (§8.5, §11.3). |
| Delete the household | Eyup | `delete_household` (owner only) cascades everything, including pets, cards and invites. Other members drop it on the next sync (§8.5). |
| Tests and contracts | — | RLS test 6 (owner-only). S7/S9 and the RPC table updated. ADR 0019 amended. |
