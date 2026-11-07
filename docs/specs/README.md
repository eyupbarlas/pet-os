# Specs — how we decide what to build

A deliberately light process. It is not tied to any platform, framework or language: a
spec describes **needs**, not implementation. Edit this file whenever the process stops
fitting — it is meant to change.

## When to write a spec

Write one for anything a user will notice or that changes data, privacy or money: a new
feature, a change to how streaks work, a new partner integration. Skip it for bug fixes,
copy tweaks and internal refactors.

## Where it lives

```
docs/specs/
  README.md          ← this file
  _template.md       ← copy this
  001-household-sync/
    spec.md          ← the spec itself
    notes.md         ← optional: research, interview quotes, sketches
```

Number specs in order (`001`, `002`, …) and use a short kebab-case name.

## Lifecycle

| Status | Meaning | Who moves it |
|--------|---------|--------------|
| `draft` | Being written; open questions allowed | anyone (usually the Product Owner agent) |
| `review` | Ready for Eyup to read | author |
| `approved` | Eyup agreed; design and build can start | **Eyup only** |
| `shipped` | Live for users | whoever ships it |
| `dropped` | Decided not to do it; keep the file and say why | Eyup |

The status sits at the top of `spec.md`. Agents never set `approved` themselves.

## GitHub link

Every spec has one GitHub issue labelled `spec`. The issue owns **work state** (open,
in progress, closed) and shows on the board; the spec file owns **intent**. Put the issue
number in the spec header and the spec path in the issue body. Do not copy the spec into
the issue.

## What a good spec contains

See `_template.md`. In short: the problem in the user's words, who has it, what they need
(as outcomes, not screens), how we will know it works, what is out of scope, and the open
questions. Technical decisions do **not** go here — they go in `docs/adr/`.
