---
name: adr-writing
description: "How to record a Pet OS technical decision as an ADR in docs/adr/ — context, options with cost and lock-in, decision, consequences. Use whenever an architect picks a framework, backend, sync engine, auth provider, vendor, data-model shape or protocol, when a stack question is being compared, or when an earlier decision is revisited or superseded."
---

# Writing an ADR

ADRs keep the "why" findable after the conversation is gone. Pet OS has 1–3 builders, so
a future teammate (or a future Claude session) will rely on these instead of asking.

## Steps

1. Next number: `ls docs/adr/`, highest `NNNN` + 1. Copy `docs/adr/_template.md` to
   `docs/adr/NNNN-short-title.md`.
2. **Context** — the forces, citing the spec needs (e.g. "spec 001 need 3") and
   `pet-os-context` constraints. Keep it to what actually drives the choice.
3. **Options** — at least two real options. For each: pros, cons, cost at ~300 and ~10k
   users, EU data residency / DPA status, and lock-in (how hard to leave). Use the
   `library-docs` tool from the orchestrator's tools registry for current facts; never
   rely on memory for prices or versions — cite the source and date.
4. **Decision** — status `proposed`. Only Eyup moves it to `accepted`.
5. **Consequences** — what it makes easier and harder, follow-up work, and the signal that
   would make us revisit it.

## Rules

- One decision per ADR. If you find yourself writing "and also", split it.
- Never edit an accepted ADR's decision. Supersede it with a new ADR and link both ways.
- Style-independent: no visual design choices in ADRs.
- Flag privacy-relevant decisions (vendor, data location, new personal data) for the
  privacy-security-reviewer.
