---
name: privacy-review
description: "Privacy, security and compliance review for Pet OS (GDPR, Polish UODO practice, ePrivacy consent, app-store privacy rules, vendor DPAs and data transfers, EU AI Act transparency, consumer law for virtual coins). Use whenever a spec, architecture, vendor or feature touches personal data, location, photos, shared links, analytics, emails, push, AI, payments or account deletion, or someone asks 'is this GDPR-safe', 'compliance check' or 'can we use vendor X'. Uses the legal plugin's compliance-check knowledge."
---

# Privacy and security review

Not legal advice. The goal is to catch problems early, make the safe choice the default,
and say clearly when a lawyer is needed.

## Use the legal plugin first

Use the `compliance-knowledge` tool from the orchestrator's tools registry. Preferred: the
legal plugin's skills — `legal:compliance-check` for a feature or initiative,
`legal:vendor-check` for a vendor, `legal:legal-risk-assessment` for severity. Invoke the
relevant one via the Skill tool with a concrete description of the processing. If the plugin
is unavailable, apply the fallback below, which distils the same framework.

## Stage matters

Pet OS is an MVP for ≤100 users. Rank findings as **blocks MVP** (real harm to
the people using it: leaked data, no way to delete, tracking without consent, guessable
links) or **before public launch** (DPAs, transfer assessments, DPIA, EU residency, store
labels, EAA, AI Act). Don't let launch paperwork block building.

## Fallback framework

1. **Map the data:** what personal data, whose (owner, partner, sitter, public viewer),
   where stored (vendor + region), how long, who can see it.
2. **Lawful basis** per purpose: contract (core app), consent (analytics, replay, marketing,
   precise location, AI photo processing), legitimate interest (security, fraud) — with a
   balancing note.
3. **Consent mechanics:** off by default, granular, as easy to withdraw as to give, no SDK
   reading device data before consent (ePrivacy / Polish electronic-communications law).
4. **Data-subject rights:** export (machine-readable), deletion across every store and
   vendor, correction. 30-day response.
5. **Vendors (GDPR Art. 28):** DPA signed; sub-processor notice with right to object; breach
   notice ≤48 h; deletion on termination; processing locations stated; transfers covered by
   EU region, DPF certification and/or 2021 SCCs; note DPF fragility.
6. **Security:** least privilege (RLS), server-side role checks, secrets out of the app
   bundle, unguessable + revocable + expiring share links, rate limits, audit of sitter access.
7. **DPIA trigger:** location, systematic monitoring, AI on photos, or large scale → write a
   short DPIA.
8. **Store rules:** Apple privacy labels, Google Play Data safety, in-app + web account
   deletion, Sign in with Apple.
9. **Other law:** EU Accessibility Act applicability; EU AI Act transparency for AI-generated
   avatars and advice; consumer-law limits on virtual currency (coins never sold); KNF for
   insurance (referral only); not presenting info library as vet advice.

## Output (mirrors legal:compliance-check)

```markdown
## Privacy & security check: {subject}
**Summary:** proceed / proceed with conditions / needs further review
### Data map
| Data | Subject | Purpose | Basis | Store/vendor + region | Retention |
### Requirements
| # | Requirement | Status (met/not met/unknown) | Action |
### Risks
| Risk | Severity | Mitigation |
### Needs a lawyer
```
