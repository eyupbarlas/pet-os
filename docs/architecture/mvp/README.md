# Pet OS MVP architecture

- **Status:** accepted (Eyup, 2026-11-23)
- **Spec:** [`docs/specs/001-mvp/spec.md`](../../specs/001-mvp/spec.md) (approved 2026-11-22)
- **Issue:** #5 (spec issue #3)
- **Research:** [`docs/research/stack-choice.md`](../../research/stack-choice.md)
- **Last updated:** 2026-11-23 (owner role added)

## Summary

The MVP is a household care app for at most about 100 invite-only beta users. It is built with
one TypeScript codebase:

- an **Expo / React Native** app for iOS and Android;
- a small **Cloudflare Worker** for the public web pages (care card, deletion page, privacy notice,
  invite landing);
- **Supabase in Frankfurt** for the database, sign-in (Apple, Google, email code) and a few server
  jobs;
- **PowerSync Cloud** (free plan, EU region) for offline sync.

The phone reads and writes a local SQLite copy of its household's data, so ticking works with no
signal and syncs later. Most rules live in Postgres (row-level security, a few functions and
scheduled jobs). The server owns the streak, and the phone shows a provisional value until the
server has closed the day. Reminders are scheduled on the phone, in the household's time zone.
PostHog EU and Sentry EU stay off until the person opts in, and the beta's gate metrics come from
SQL totals.

Estimated running cost at ≤100 users is **about $35 a month**: Supabase Pro at $25, plus the Apple
developer fee and a domain. Everything else is on a free plan.

## Components

| Area | Design | ADRs |
|---|---|---|
| Mobile client, web pages, shared packages | [mobile.md](mobile.md) | 0001–0009 |
| Data model, sync, auth, household lifecycle, SQL sketch | [backend-sync.md](backend-sync.md) | 0010–0019 |
| Reminders, consent, analytics, crash reports, email, web hosting, ops, cost | [platform-services.md](platform-services.md) | 0020–0026 |

All 26 ADRs are in [`docs/adr/`](../../adr/), all accepted by Eyup on 2026-11-23.

## Key design choices

- **Ticks:** one row per task per household day. The row id comes from task + date, so when two
  people tick the same task offline it collapses into one tick. Whoever tapped first gets the
  credit. An undo deletes the row, and is allowed for today and yesterday only. Undoing someone
  else's tick asks first. (ADR 0004, 0014)
- **Day boundary:** the household's time zone is stored on the household, and the phone stamps
  each tick with the household's date. The design works through the Warsaw DST weekends.
  (ADR 0015)
- **Streak:** a per-task `streak_critical` flag, seeded from the species defaults:
  - dog: meals, meds and walks;
  - cat: meals, meds and fresh water.

  A server job closes each day and uses up to 2 paw passes a month. A rest day keeps the streak
  alive but adds no day, and can only be set for today. (ADR 0016)
- **Owner and members** (Eyup, 2026-11-23): each household has exactly one owner
  (`household.owner_id`). Only the owner invites, removes members, renames, sets the time zone,
  transfers ownership and deletes the household. Every member edits pets, routines, ticks, health
  records and care cards. If the owner leaves or deletes their account, ownership passes to the
  member who joined earliest. (ADR 0019)
- **Onboarding:** the pet and its routine are kept on the phone until sign-in, so there is no
  anonymous sign-in. Ticking needs an account. Invited partners skip the pet screens, and joining
  shows a preview with an explicit confirmation. (ADR 0005, 0017, 0019)
- **Sync:** one PowerSync bucket per household plus one per user. A removed member loses access on
  the next sync. Only specific permanent Postgres errors discard a queued write; anything else is
  retried. (ADR 0012, 0013)
- **Care card:** one pet per link, opened on the web only.
  - The token is random, 256-bit, stored in plaintext and readable only by members.
  - It is read through a narrow anonymous function.
  - The card shows "Marked done" or nothing, never names.
  - It is not cached or indexed.

  (ADR 0018, 0024)
- **Reminders:** planned on the phone in the household's time zone, with at most one streak nudge a
  day. Quiet time follows the phone's own time zone. The silent "sync now" push is deferred until
  testers need it. (ADR 0020, 0021)
- **Consent:** analytics and crash reports each have their own switch, both off by default. Consent
  belongs to the person, not the device. (ADR 0022, 0023)
- **Languages:** i18next with `en_US.json` and `pl_PL.json`, Polish plural rules, and a CI check for
  missing keys. (ADR 0006)
- **Deletion:** in the app, 3 taps. On the web, an EN/PL page explains the steps and takes requests
  by email, handled with a manual runbook. Steps that call outside services retry from a queue.
  (ADR 0019)

## Contracts between the three areas

Each design has a **Contracts** section, and the reviewers checked that they agree:

- mobile: C-B1–C-B9 and C-P1–C-P10;
- backend: S1–S12 and B1–B10;
- platform: M1–M10 and B1–B10.

The main shared pieces:

- **Table and field names:** backend's are canonical, for example `actor_id`, `client_at` and
  singular table names.
- **Online-only calls:** `create_invite`, `preview_invite`, `accept_invite`, `remove_member`, `leave_household`,
  `transfer_ownership`, `delete_household`,
  `create_care_card_link(p_pet_id, p_lang)`, `rotate_`/`revoke_care_card_link`, `get_app_config`,
  and the `delete-account` Edge Function.
- **Anonymous allow-list:** exactly four functions, checked in CI: `get_care_card`,
  `record_invite_landing`, `health` and `get_app_config`.
- **Shared package:** `@petos/domain` holds ids, day maths, routine defaults, streak rules, the
  reminder planner and parsing. Each module has a named owner (ADR 0008).

## Review verdicts

| Reviewer | Round 1 | Round 2 |
|---|---|---|
| Architecture (cross-boundary) | Consistent with fixes | **Consistent.** The last two nits were fixed. |
| Privacy and security | Proceed with conditions (11 must-fix items) | **Proceed.** All must-fix items are resolved. |
| Product owner (UX) | Ship with changes (9 must-fix items) | Resolved, apart from two items deliberately overridden (see below) |

The full reviews and the rulings that settled reviewer disagreements are in [reviews/](reviews/).

## Decisions Eyup made on review (2026-11-23)

1. **Tick credit goes to whoever tapped first.** We keep one row per task per day; when a later
   upload of the same tick has an earlier tap time, the server swaps the credit (ADR 0014).
2. **Rest days are today only**, with no monthly limit.
3. **Invites are share links only**, with no typable code.
4. **Pets belong to the household** and stay if the member who brought them is removed.
5. **Gate metrics come from database totals** with no opt-in; the spec now says so.
6. **One owner per household** (see Key design choices).

## Still open

- **Domain:** Eyup chose `healthypaw.app` (2026-11-24) for the care card, invite, deletion and
  privacy pages and the auth email sender. Renamed on 2026-11-24: the app is now HealthyPaw and the domain is `healthypaw.app` (the earlier `healthypaws.io` is dropped).

## Week-one checks (unverified)

- Native Apple and Google sign-in with Supabase.
- The Apple code exchange and token revocation in `delete-account`.
- Hermes support for `Intl` time zones and plural rules.
- op-sqlite with pnpm on SDK 58.
- PowerSync free-plan inactivity (budget $49 for Pro if it affects testers).
- The PostHog person-deletion endpoint.
- Whether Better Stack's free plan allows commercial use.
- The iOS 64-notification cap.

## Parked until before public launch

- DPAs and transfer assessments.
- The automated web deletion flow.
- Data export.
- Session tokens in SecureStore.
- Store privacy labels and Play's Data safety form.
- Resend log retention.
- PowerSync compaction of deleted rows.
- The lawyer questions (whether crash reporting needs consent, a DPIA).

Details are in each design's open-questions section.
