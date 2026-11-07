---
name: spec-writing
description: "How to write or update a Pet OS feature spec in docs/specs/ — the lightweight, platform-agnostic needs outline (problem, who, needs, acceptance, out of scope, open questions). Use whenever a feature idea, user request, interview finding or roadmap item needs to become a spec, or an existing spec needs revising, splitting or closing. Not for technical decisions — those go to adr-writing."
---

# Writing a Pet OS spec

A spec answers **what the user needs and how we'll know we delivered it**. It stays
platform- and language-agnostic so it survives any stack change. The process itself is
in `docs/specs/README.md`; read it if you haven't this session — Eyup may have edited it.

## Steps

1. Load `pet-os-context`. Check the idea against scope, the won't-do list and the gates.
   If it collides, say so at the top of the spec instead of quietly bending it.
2. Find the next number: `ls docs/specs/` and take the highest `NNN` + 1.
3. Copy `docs/specs/_template.md` to `docs/specs/NNN-short-name/spec.md`.
4. Fill it in:
   - **Problem** in the user's words. Real quotes beat paraphrase; mark guesses as guesses.
   - **Who** — be specific about roles (owner, partner, sitter) and species. A cat owner's
     day is not a dog owner's day.
   - **Needs** as outcomes ("a sitter can see today's meds without an account"), never as
     screens or tech ("a React page with…"). Number them so reviews can cite them.
   - **Acceptance** — observable, testable checks. Include the EN/PL, accessibility and
     offline cases whenever the feature touches them.
   - **Constraints** — privacy, consent, accessibility, gates.
   - **Out of scope** — the honest list; it prevents scope creep in a 1–3 person team.
   - **Open questions** — leave them open rather than inventing answers.
5. Set status to `draft`, or `review` if it is complete. Never set `approved`.
6. Create or update the GitHub issue (label `spec`) — see the orchestrator for commands.
   Put the issue number in the spec header.

## Why outcomes, not screens

The design canvases are still changing style, and the stack isn't chosen. A need written
as an outcome stays true through both; a need written as a screen goes stale in a week.

## Quality bar

A good spec is short (one to two pages), lets an engineer who has never met Eyup start
designing, and lets Eyup say yes or no in five minutes.
