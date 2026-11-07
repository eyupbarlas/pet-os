# Pet OS

Pet care app for households (iOS + Android + small web front end), Poland first, EN/PL.

## Harness: Pet OS

**Goal:** turn pet owners' needs into approved specs, then into reviewed, style-independent
architecture, stack decisions and ADRs that a 1–3 person team can build.

**Spec process:** lightweight, platform-agnostic specs in `docs/specs/` (process in
`docs/specs/README.md`, editable) — the orchestrator has the product-owner draft them and
waits for Eyup to set `approved` before design starts; technical decisions go to `docs/adr/`.

**Issue tracking:** GitHub Issues on this repo (board: GitHub Projects #8, which follows
issues via its own workflows) — the orchestrator finds or creates the issue first via the
REST API (`gh api repos/eyupbarlas/pet-os/issues`), and writes deliverable paths back as an
issue comment.

**Entry point — applies to every prompt in this repo:** You MUST invoke the
`pet-os-orchestrator` skill *before* responding to any request — new work, a follow-up, a
re-run, a question, or a change to a previous result. It is the single entry point; do not
craft a response outside it. The orchestrator decides what happens next: it answers trivial
or off-topic requests directly and runs the full team only when the work warrants it.

**Change history:**
| Date | Change | Target | Reason |
|------|--------|--------|--------|
| 2026-11-07 | Initial setup: 6 agents, 7 skills, spec process, Context7 | All | Start architecture work for iOS + Android |
