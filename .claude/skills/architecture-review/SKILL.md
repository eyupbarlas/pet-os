---
name: architecture-review
description: "Cross-boundary review of Pet OS architecture work: checks that the mobile, backend/sync and platform-services designs agree with each other, with the approved spec, and with the roadmap constraints. Use whenever architecture drafts, ADRs, data models, API/sync contracts or a stack proposal need checking, re-checking after a revision, or a 'does this all fit together' pass."
---

# Architecture review

Most architecture bugs live **between** documents: the mobile design assumes a field the
data model doesn't have, the notification plan assumes a time zone the backend never
stores. So read producer and consumer **side by side**, never one in isolation.

## Boundaries to compare

| Producer | Consumer | Check |
|----------|----------|-------|
| Data model (backend-sync) | Mobile local schema / screens | every field the UI shows exists, with the same type, nullability and units; IDs are client-generatable for offline creates |
| Sync rules | Mobile offline behaviour | what happens when two caregivers tick the same task offline; deletes vs edits; sitter access expiry while offline |
| Streak computation | Notifications, UI | same definition of "day" (household time zone), same skip-day/rest-day rules, single owner of the calculation |
| Auth design | Sync engine, RLS, web care card | the token the sync engine accepts is the one auth issues; sitter/limited roles enforced server-side, not only in UI |
| Care-card links | Privacy design | unguessable, revocable, expiring, noindex; shows only the fields the spec allows |
| Analytics/consent | Every SDK | nothing initialises before consent; consent stored and synced; withdrawal works |
| i18n | Data model, push, email | locale stored per user; all UI text in `en_US.json` / `pl_PL.json` (no hard-coded strings); server-sent text (push, email) localised; plural rules |
| Account deletion | All stores | deletes or anonymises in DB, storage (photos), analytics, error tracker, email provider, push tokens |

## Also check

- Every requirement in the approved spec maps to at least one design element (list gaps).
- Each decision has an ADR with options, cost and lock-in.
- Proportionate to the MVP (≤100 users): flag over-engineering as firmly as gaps.
- Nothing contradicts `pet-os-context` (won't-do list, gates, team size). Flag complexity a
  1–3 person team can't carry.
- No visual-style coupling.
- Vendor facts (prices, regions, SDK support) carry a source and date.

## Output

```markdown
## Architecture review: {subject}
**Verdict:** consistent / consistent with fixes / inconsistent
### Boundary mismatches
| # | Producer ↔ Consumer | Mismatch | Fix | Owner agent |
### Spec coverage gaps
### Risks for a 1–3 person team
### Missing or weak ADRs
```
