# Tools registry

Agents and skills reference a tool by its **role**, never by a hard tool name. When the
preferred tool is unavailable, fall back to the alternative.

| Role | Preferred tool | Alternative (if unavailable) | Status | Last reviewed |
|------|----------------|------------------------------|--------|---------------|
| library-docs | Context7 MCP (`.mcp.json`, server `context7`; optional free API key raises rate limits) | WebSearch + WebFetch on the vendor's official docs; cite URL and date | active | 2026-11-07 |
| compliance-knowledge | legal plugin skills: `legal:compliance-check`, `legal:vendor-check`, `legal:legal-risk-assessment` (via Skill tool) | the fallback framework inside the `privacy-review` skill | active | 2026-11-07 |
| issue-tracker | GitHub REST via `gh api repos/eyupbarlas/pet-os/...` or the GitHub MCP issue tools | give Eyup the exact issue text to file by hand | active | 2026-11-07 |
| long-form-docs | Claude Docs connector (for proposals Eyup will edit or share) | Markdown under `docs/` | active | 2026-11-07 |
| web-testing | Playwright (care-card and deletion pages) | manual check notes | active | 2026-11-07 |

## Deferred candidates (not adopted — revisit when the stack is chosen)

Expo MCP, Dart/Flutter plugin, Firebase MCP, PowerSync docs MCP, mobile-mcp (needs a local
Mac), Sentry MCP, PostHog MCP, Crowdin/Lokalise, Google Maps MCP, RevenueCat. Mermaid Chart
was declined (GitHub renders Mermaid natively).
