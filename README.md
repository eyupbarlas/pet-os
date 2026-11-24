# HealthyPaw (Pet OS)

A pet care app for households: tick off meals, walks and meds together, keep a streak, share a
care card with a sitter. iOS and Android first, Poland first, Polish and English. This is an MVP
for at most about 100 invite-only beta users.

Design and decisions: [`docs/architecture/mvp/`](docs/architecture/mvp/README.md),
[`docs/adr/`](docs/adr/), spec [`docs/specs/001-mvp/`](docs/specs/001-mvp/spec.md).

## Layout

| Path | What |
|---|---|
| `apps/mobile` | Expo SDK 58 app (Expo Router, TypeScript) |
| `packages/domain` | `@petos/domain`: ids, household day, due rules, routine defaults, streak rules |
| `packages/i18n` | `@petos/i18n`: `en_US.json`, `pl_PL.json`, i18next setup, key-parity check |
| `packages/tokens` | `@petos/tokens`: semantic colours, spacing, contrast helper |
| `supabase/` | Postgres migrations, RLS, RPCs, SQL tests, local config (Frankfurt project) |
| `powersync/` | Sync Streams config to paste into PowerSync Cloud (EU) |
| `assets/brand/` | Logo and icon assets |
| `docs/week-one-checks.md` | The unverified items from the architecture, and how to check each |

Still to build: the `apps/web` Cloudflare Worker (care card, invite landing, deletion page), the
`delete-account` Edge Function, and the product screens themselves.

## Getting started

Needs Node 22 and pnpm 10.

```sh
pnpm install
pnpm typecheck && pnpm test        # TypeScript, domain tests, i18n key check
./scripts/test-db.sh               # SQL migrations + tests on a local Postgres (see the script)
cp apps/mobile/.env.example apps/mobile/.env.local   # then fill in the Supabase and PowerSync values
pnpm --filter @petos/mobile ios    # or android; a dev build is required (op-sqlite is native)
```

Accounts you need to create (nothing is created for you): a Supabase project in Frankfurt, a
PowerSync Cloud instance in the EU region, Apple and Google sign-in credentials. Apply the
migrations with `supabase link` and `supabase db push`, and paste `powersync/sync-config.yaml`
into the PowerSync dashboard. Never put the Supabase secret key in the app.

## Translations

Edit `packages/i18n/src/locales/en_US.json` and `pl_PL.json`. `pnpm i18n:check` fails if a key is
missing in one of them, a placeholder differs, or a Polish plural form is missing.
