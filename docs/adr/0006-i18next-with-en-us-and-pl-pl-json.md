# 0006 — i18next + react-i18next with `en_US.json` / `pl_PL.json`

- **Status:** proposed
- **Date:** 2026-11-22 (revised after phase-3 reviews)
- **Deciders:** Eyup
- **Related:** spec `docs/specs/001-mvp/spec.md` needs 11, 12 and the language acceptance test (no English leftovers, 1 dzień / 2 dni / 5 dni, "5,8" accepted); `pet-os-context` localization rule; issue #5; draft §6

## Context

Eyup wants an i18n library reading one editable JSON file per language, `en_US.json` and `pl_PL.json`, translated in-house (no Tolgee or other service). Polish needs four plural categories (one, few, many, other). The same strings serve the app, local notifications, emails (Edge Functions) and the web care card (Worker).

Facts (checked 2026-11-22, https://www.i18next.com/plurals): i18next uses JSON v4 suffixes `_one/_few/_many/_other` from `Intl.PluralRules`. Since v24 there is no fallback without Intl. The docs say Hermes lacks `Intl.PluralRules` and needs a polyfill (current Hermes coverage on RN 0.88 **unverified**). Since v27.1.0 a missing form falls back to `_other` in the same language.

## Options considered

| Option | Pros | Cons | Cost at MVP / at scale | Lock-in |
|--------|------|------|-------------------------|---------|
| A. i18next + react-i18next, plain nested JSON, `@formatjs/intl-pluralrules` polyfill (en, pl) | Plain JSON fits the two-file rule. CLDR plurals. Works in RN, Worker and Deno with the same files. TS-typed keys. Very widely used | Plural forms are separate keys (translators must fill all four for Polish; a CI check enforces it) | $0 | Low: JSON stays portable |
| B. i18n-js (shown in Expo docs) | Small, simple | Polish plurals need a custom pluralizer. Fewer tools around it | $0 | Low |
| C. FormatJS / react-intl (ICU messages) | ICU plural syntax in one string, strong formatting | ICU syntax is harder to hand-edit for in-house translators. Heavier | $0 | Low |
| D. Lingui | Compile-time catalogs, small runtime | Needs macros/compile step; default PO files, not the requested JSON | $0 | Medium |

## Decision

Use **i18next + react-i18next** with bundled `packages/i18n/locales/en_US.json` and `pl_PL.json` (namespaces `app`, `notif`, `email`, `web`). Force-load the `Intl.PluralRules` polyfill for `en` and `pl`. Add an `i18n:check` CI script for key parity, required plural forms per language and matching interpolation variables.

## Consequences

- Easier: one set of files for every surface. Typed keys catch missing strings at compile time.
- Harder: translators edit keys like `streak.days_few`; the check script has to explain itself clearly.
- Related rules: default task titles are stored as `template_key` (backend format `task.<species>.<kind>.<variant>`) with a nullable `title`, shown as `title ?? t(template_key)`; decimal input accepts "5,8" and "5.8" (`@petos/domain/parse`). The user's language is stored in `profiles.locale` (`pl_PL`/`en_US`) and in auth `user_metadata.locale` for emails. RPC errors arrive as stable codes mapped to `app.error.*` keys, so server errors are bilingual too (spec need 12).
- Revisit if translations grow beyond what two people can hand-edit (then consider a service; files stay compatible).
