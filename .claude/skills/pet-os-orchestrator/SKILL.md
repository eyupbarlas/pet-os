---
name: pet-os-orchestrator
description: "Entry point for all Pet OS work in this repo — invoke before responding to any request here. Coordinates the Pet OS team (product owner, mobile, backend/sync and platform-services architects, architecture and privacy reviewers) to produce specs, architecture proposals, ADRs, stack decisions and reviews. Triggers: architecture, stack, design the app, data model, sync, offline, auth, notifications, analytics, spec, feature idea, UX review, privacy/GDPR check, vendor choice. Also use for follow-ups: re-run, update, revise, modify, supplement, 'only the backend part again', improve the previous result, review this, what did we decide."
model: inherit
---

# Pet OS orchestrator

Routes every request in this repo and, for real work, runs the team that turns needs into
an approved spec, then into a reviewed architecture with ADRs.

## Execution mode: subagent

Members don't need to talk mid-task; each reads files and writes one output. Spawn custom
agents with the `Agent` tool using `subagent_type` = the agent's name in `.claude/agents/`
(fall back to `general-purpose` with "Read and follow `.claude/agents/{name}.md`" if the
custom type is unavailable). Run independent agents in **one message** with
`run_in_background: true`; wait for all before the next phase.

## Team

| Agent | Role | Skills | Output |
|-------|------|--------|--------|
| product-owner | user needs, specs, UX/taste review | pet-os-context, spec-writing, ux-review | `docs/specs/NNN-*/spec.md`, `03_product-owner_review.md` |
| mobile-architect | client architecture | pet-os-context, adr-writing | `02_mobile-architect_design.md` |
| backend-sync-architect | data, sync, auth, storage | pet-os-context, adr-writing | `02_backend-sync-architect_design.md` |
| platform-services-architect | notifications, analytics, integrations, ops | pet-os-context, adr-writing | `02_platform-services-architect_design.md` |
| architecture-reviewer | cross-boundary QA | architecture-review | `03_architecture-reviewer_review.md` |
| privacy-security-reviewer | GDPR/security/compliance | privacy-review (+ legal plugin) | `03_privacy-security-reviewer_review.md` |

Workspace paths are under `_agents_workspace/` (git-ignored scratch). Final deliverables go
to `docs/`. Tools are referenced by **role** — see `references/tools.md`.

## Phase 0 — intake and triage (always first)

1. **Triage.** Trivial, conversational or off-topic → answer directly and stop. A single
   narrow ask maps to one agent → run only that agent (see "Short routes").
2. **Tracker (GitHub Issues — owns work state).** Cloud sessions can't use GraphQL, so use
   REST or the GitHub MCP, never `gh issue list`:
   - Ready work: `gh api 'repos/eyupbarlas/pet-os/issues?state=open&per_page=50' --jq '.[] | select(.pull_request|not) | "\(.number)\t\(.title)\t\([.labels[].name]|join(","))"'`
   - If an open issue matches the request, carry its number. If the work is new, create one
     first: `gh api repos/eyupbarlas/pet-os/issues -f title='…' -f body='…' -f 'labels[]=spec'`
     (labels: `spec`, `architecture`, `ux`, `decision`, `privacy`).
   - The board (GitHub Projects #8) follows issues through its own auto-add and
     "closed → Done" workflows; don't try to write to it.
3. **Spec gate (our lightweight spec process, `docs/specs/`).** Find the spec for this work.
   - None → run **product-owner** to write it (status `draft`/`review`), then **pause**:
     tell Eyup the spec path and that it needs `approved` before design starts. Exception:
     if Eyup explicitly asks to proceed without approval, continue and say so in the result.
   - Exists and `approved` → it is the input contract.
4. **Context check.**
   - No `_agents_workspace/` → initial run.
   - Exists + request changes part of the result → partial re-run: re-invoke only the
     affected agent with its previous output path, then re-run the reviewers.
   - Exists + new work → move it to `_agents_workspace/archive/{YYYYMMDD_HHMMSS}/`, start fresh.

## Phase 1 — prepare

Create `_agents_workspace/` and `_agents_workspace/adr-drafts/`. Write
`_agents_workspace/00_input.md`: the request, issue number, spec path(s), relevant ADRs,
research reports (e.g. `docs/research/*.md`), and any constraints Eyup stated. Reference
files by path; never copy spec or issue text.

## Phase 2 — design (parallel)

One message, three background agents: mobile-architect, backend-sync-architect,
platform-services-architect. Each prompt contains: the `00_input.md` path, the spec path,
"load the pet-os-context and adr-writing skills", its output path, and the instruction to
state its contracts with the other two explicitly.

## Phase 3 — review (parallel)

One message, three background agents reading all `02_*` drafts and ADR drafts:
architecture-reviewer, privacy-security-reviewer, product-owner (UX lens on the
architecture's user-visible effects).

## Phase 4 — revise (at most once)

Collect must-fix items per owning architect. Re-invoke only those architects with their
draft path plus the findings. Then re-run only the reviewer(s) whose findings were
addressed. Unresolved disagreements are **recorded, not deleted**: list both positions
with sources under "Open decisions".

## Phase 5 — integrate and report

1. Write `docs/architecture/{topic}.md`: summary, recommendation, component sections from
   each draft, the contracts between them, open decisions for Eyup, review verdicts.
2. Move ADR drafts to `docs/adr/NNNN-*.md` with status `proposed`.
3. Tracker write-back: comment on the issue with the deliverable paths
   (`gh api repos/eyupbarlas/pet-os/issues/{n}/comments -f body='…'`). Close it only when
   Eyup accepts the result; never edit his issue text.
4. Keep `_agents_workspace/`. Report to the user: the recommendation, the decisions they
   must make, and the paths.

## Short routes

| Request | Run |
|---------|-----|
| "write/update a spec", feature idea | product-owner only (+ issue) |
| "is this good UX", review a screen/design | product-owner (ux-review) |
| "is this GDPR-safe", "can we use vendor X" | privacy-security-reviewer |
| "check the architecture", re-review | architecture-reviewer (+ privacy if data changed) |
| one technical question in one area | that architect only, ADR if it's a decision |

## Error handling

| Situation | Action |
|-----------|--------|
| An agent fails | retry once; then continue without it and name the gap in the report |
| Most agents fail | stop and tell Eyup |
| Reviewers disagree with architects | record both with sources; Eyup decides |
| Tool from the registry unavailable | use its listed alternative |
| GitHub API refused | do the work, then give Eyup the exact issue text to file by hand |

## Test scenarios

- **Normal:** "Design the sync architecture" → issue found/created → approved spec found →
  3 architects in parallel → 3 reviewers → one revision → `docs/architecture/sync.md` + ADRs
  `proposed` → issue comment with paths.
- **Spec missing:** "Add a vet visit log" → product-owner writes `docs/specs/00N-…` as
  `review` → pause and ask Eyup to approve.
- **Error:** backend-sync-architect fails twice → integrate the other drafts, mark data/sync
  as missing in the report and in Open decisions.
