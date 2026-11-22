# 0021 — Expo Push "sync now" signal: a planned follow-up, not in the first beta build

- **Status:** proposed
- **Date:** 2026-11-22 (revised after reviews 03 and rulings 04, ruling 8)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` (needs 2, 5, 7), issue #5, ADR 0020, design §3.6

## Context

With local reminders (ADR 0020), a member's phone may not know that a partner already fed the
pet until it syncs. The spec needs no visible household notifications, and the acceptance
criterion for removal is "stops their access on next sync". Eyup confirmed Expo push in the
stack. It is free: "There is no cost associated with sending notifications through Expo push
notification service", with 600 notifications/s per project
([Expo push FAQ](https://docs.expo.dev/push-notifications/faq/), 2026-11-22). The architecture
review (P-6) found that a silent push needs an Edge Function, a token table, a DB trigger with
pg_net, debounce and receipts. That is the largest platform moving part, for **best-effort**
delivery that iOS throttles and skips for force-quit apps. Expo is a US processor; its DPA is
**unverified**.

## Options considered

| Option | Pros | Cons | Cost at MVP (≤100) / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. No server push in the first beta build; reminders say "check Today"; build B only if testers report stale reminders | Nothing to build or secure; one fewer week-1 spike; still meets every acceptance criterion | Occasional reminder for a task a partner already did | $0 | none |
| B. Data-only Expo push `{t:"sync"}` to other members on tick insert/delete, routine, rest-day, membership or card change; debounced 2 min per device | Fewer stale reminders; faster loss of access on removal; the pipe can carry visible pushes later | Best effort; Vault secret, function auth, token table, receipts; Expo transfer paperwork | $0 / $0 | Low |
| C. Visible "Partner fed Luna" pushes | Explicit | Noise against the max-one-nudge spirit; names pass through Expo/APNs/FCM; not requested (PO R5) | $0 | Low |

## Decision

Option A for the first beta build. Option B stays designed (design §3.6, contracts M3, M4, B2,
B3) as a **planned follow-up**, built only if testers report reminders for tasks that were
already done. When it is built, these rules apply:
- the trigger's secret lives in Supabase Vault, and the function compares it in constant time;
- recipients come from the database only, computed before a removed member's `left_at`;
- payloads carry no personal data;
- `app_config.push_sync_enabled` is the kill switch.

## Consequences

- The first beta build has no push token, no `push_device` table, no `notify-household`
  function and no Expo DPA question. The Edge Function count drops by one.
- Reminder copy must stay neutral ("check Today"), and tapping a reminder opens Today with "Done
  by Ana".
- The signal to build B is tester reports of stale reminders, or reminder opt-out rates in the
  SQL metrics. Before building, run a spike on iOS silent-push delivery with and without alert
  permission.
- Option C stays out until users ask for it.
