# Orchestrator rulings for the revision round (2026-11-22)

Inputs: docs/architecture/mvp/reviews/architecture.md, docs/architecture/mvp/reviews/privacy-security.md, docs/architecture/mvp/reviews/product-owner.md.
All MUST-FIX items in those three reviews apply unless a ruling below overrides them.

## Rulings on reviewer disagreements (simplest option that meets the spec)
1. **Tick model: one row per task per household day**, deterministic id (task + household date + slot), undo = DELETE (guarded to today/yesterday window), credit = whoever syncs first. Backend: unique key, DELETE grant with window guard, after-delete streak recompute; ADR 0014 rewritten to this model (event log recorded as the rejected option). Mobile ADR 0004 stays. Undoing someone else's tick asks for confirmation (PO M-2). Listed for Eyup as a confirmable decision.
2. **Rest days: today only**, no monthly limit, keep the streak alive but add no day (backend rule). Phone uses backend rules for provisional streak over all unclosed days.
3. **Care-card links are web only.** App links claim `/i/*` (invites) only.
4. **Care-card token stored plaintext, 256-bit**, member-readable via RLS, scrubbed from logs/Sentry/PostHog (ADR 0018). Platform aligns ADR 0024 and B4. Card shows "Marked done" or nothing, no names, no "Not done". Add noarchive, generic meta/OG, no `/c/` in robots.txt, public-link warning on share screen.
5. **One pet per care-card link** (simplify).
6. **No typable invite code** in the MVP; invites are share links. Beta friction handled by the beta landing page (public TestFlight link + Play closed-testing group) — not an architecture feature. G1 metric split: invite created within 7 days (primary) + invite accepted (secondary).
7. **Web deletion page**: EN/PL page explaining the in-app path plus a request-by-email route handled with a manual runbook (no self-serve web flow in MVP). Privacy reviewer confirms Play policy fit.
8. **Silent "sync now" push: deferred** until after the first beta build, only if testers see reminders for tasks already done. Keep it in the docs as a planned follow-up; remove from MVP scope and from the Edge Function count.
9. **Streak/G1/G3 analytics from SQL aggregates** in an unexposed `analytics` schema (allowed without consent per privacy ruling 3); PostHog only for consented product events.
10. **Crash reporting default OFF** in the beta.
11. **Join flow**: preview call + explicit confirmation naming the household left and who stays; pets come along by default; never delete pets inside the join flow (PO B-M2/M-4). Invited new users skip pet creation (PO M-3).
12. **Display name step** at sign-up (arch M-7).
13. Field names: backend's (`actor_id`, `client_at`, singular tables) win.
14. Upload errors: discard only on specific Postgres permanent error codes; 401/network/5xx are retried.
