# EveryMCP release handoff — 2026-10-03

## Current growth branch

- Existing branch: `feature/growth-stack-planner-20260923`, PR #13. The reviewed pre-correction head was `0fe75917241907adbb3a89ede59ab863548b291c`; it included main `2690e148e8d5136649d210f66201cfba31cad890` with no commits behind.
- Preserve the existing no-account `/plan` flow, homepage/sitemap entry points, portable brief, goal attribution and $49 Starter Kit handoff. The correction does not create another planner or checkout.
- Five goal profiles now name existing catalog IDs and their expected categories instead of taking the first featured/alphabetic result. Research uses Brave/Fetch/Memory; software uses GitHub/Filesystem/Context7; recurring engineering checks use GitHub/Playwright/Filesystem; analysis uses MotherDuck/Grafana/Filesystem; memory uses Memory/Filesystem/Chroma.
- Selected Brave, Context7 and MotherDuck records now point to current publisher sources. The archived Mem0 wrapper and dead Contentful/AWS/Grafana duplicates are not selected by these profiles. Other catalog entries retain their indexed status; this is not a full catalog audit.
- Copied EveryMCP listing URLs are absolute. The paid packet uses the verified session's goal with the current catalog and states that recommendations may change. No checkout-time snapshot is stored or claimed.

## Validation and source evidence

- `npm ci --no-audit --no-fund` succeeded under Node 24.19.0 with the existing lockfile. Existing dependency warnings were observed; no dependencies or lockfile were changed.
- `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed locally for the correction. The build includes all nine audit-MCP tests, the real-catalog Stack Planner test, existing release contracts, and the Next production compile/type/lint checks.
- The planner test now runs against all 616 actual catalog entries. It verifies five exact task stacks, three distinct source servers per stack, ten current publisher URLs, absolute copied links, paid-session goal ownership, generic legacy delivery and missing/unavailable/unpaid failure responses. Network requests remain outside the deterministic build gate.
- Ordinary unauthenticated HTTP on 2026-10-03 returned 200 for all ten selected publisher sources below; none displayed GitHub's archived-repository banner. These checks establish current source availability, not that a buyer's installation or workflow has executed.
- The old exact-head preview was READY and all six planner/goal HTTP routes returned 200. Obtain the new append-commit preview status after publication. Real-browser form, clipboard and analytics receipt checks remain unverified; no browser workaround was used.

| Capability | Publisher source checked |
|---|---|
| Brave Search | https://github.com/brave/brave-search-mcp-server |
| Fetch | https://github.com/modelcontextprotocol/servers/tree/main/src/fetch |
| Memory | https://github.com/modelcontextprotocol/servers/tree/main/src/memory |
| GitHub | https://github.com/github/github-mcp-server |
| Filesystem | https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem |
| Context7 | https://github.com/upstash/context7 |
| Playwright | https://github.com/microsoft/playwright-mcp |
| MotherDuck | https://github.com/motherduckdb/mcp-server-motherduck |
| Grafana | https://github.com/grafana/mcp-grafana |
| Chroma | https://github.com/chroma-core/chroma-mcp |

## Existing commerce and audit boundaries

- The initial self-serve product remains $49. Paid-session verification, product binding, checkout configuration and delivery gates are intact. A live purchase/download receipt remains separate work; no payment was activated or made in this correction.
- Implementation and sponsorship remain inquiry-only until their fulfillment is configured. Do not make an unassigned person the promised delivery path.
- Audit MCP work from PR #10 and later readiness clarification PR #12 remains on main. `/api/mcp` stays disabled until its durable edge limit and explicit activation flags are independently verified. GetFoundInChat and BrandKit remain pending their own production contracts/readiness. No MCP was invoked.

## Next action

Root reviews the appended diff and its exact-head hosted deployment before deciding whether to merge. Then observe completed plan → copied brief → Starter Kit intent using the existing events. The experiment is the first 50 completed plans or 14 days at $0 incremental spend: keep/expand at 10% or more intent, improve the handoff at 5–10%, and below 5% validate traffic/instrumentation before changing the offer. These are activation signals, not sales. No external customer messaging, marketplace submission, spend or production promotion is part of this correction.
