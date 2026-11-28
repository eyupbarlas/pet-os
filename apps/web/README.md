# apps/web: healthypaw.app

Marketing site (EN/PL) plus the Worker that will also serve care cards (`/c/*`) and invite landing (`/i/*`), per ADR 0024.
Plain static HTML built by `build.mjs` (no dependencies), served by a small Cloudflare Worker (`src/index.ts`).

- Copy: `content/en.mjs`, `content/pl.mjs` (includes the privacy notice, terms, contact and delete-account pages).
- Settings: `site.config.mjs` (store URLs, Apple Team ID, legal entity name and address, emails).
- Build: `pnpm --filter @petos/web build` → `dist/`. Preview: `pnpm --filter @petos/web preview` (http://localhost:8787/en/index.html).
- Deploy: `pnpm --filter @petos/web ship` (not `deploy`: pnpm has its own command with that name) (needs `wrangler login`). The Worker name in `wrangler.jsonc` (`young-cell-8196`) matches the one already attached to healthypaw.app.
- Pages: `/en/`, `/en/privacy`, `/en/terms`, `/en/contact`, `/en/delete-account`; `/pl/`, `/pl/prywatnosc`, `/pl/regulamin`, `/pl/kontakt`, `/pl/usun-konto`; `/i/<token>` invite landing; `/` redirects by Accept-Language.
- Screenshots come from the App Store creative set (design canvas). Swap in real captures from `app-store/source/` before launch.
