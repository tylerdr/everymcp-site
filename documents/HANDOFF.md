# EveryMCP release handoff — 2026-09-23

## Current growth branch

- Growth branch: `feature/growth-stack-planner-20260923` from main `074e11b911d7201b2188a3fc4860d943374ec781`.
- Commercial constraint: the free directory and $49 self-serve starter kit had no useful intermediate value event for a buyer who knows the outcome they want but not which MCPs to shortlist.
- New `/plan` route asks for one concrete outcome and immediately returns a three-server starting stack selected from the current EveryMCP catalog, with the role of each server, direct listing/source inspection links, and a three-step integration sequence.
- The paid handoff uses the existing starter-kit offer and preserves attribution with `source=stack-planner` plus the selected goal. No new checkout, provider, subscription, or human fulfillment path was created.
- Vercel Analytics events `stack_plan_generated` and `stack_plan_starter_kit_clicked` define the first-value and paid-intent steps. Proposed observation window: first 50 completed plans or 14 days after approved release, $0 incremental spend. Keep/expand at >=10% plan-to-starter-kit click, improve the handoff at 5-10%, and revisit ICP/value framing below 5% after validating traffic/instrumentation.

## Current audit-MCP release

- Audit bundle PR #10 merged as main SHA `5723963d71c9a5348dded256c92e25671109793a`; later readiness clarification PR #12 is also on current main.
- `/api/mcp` exposes the stateless, versioned, read-only `audit_site` bundle and no-scan `get_audit_capabilities`.
- EveryMCP execution remains disabled until a durable edge rate-limit rule is independently verified and the explicit activation flags are deliberately set. OGFixer `audit_url` is the only provider callable when activated; GetFoundInChat and BrandKit remain pending their current production contracts/readiness.

## Validation and next action

- `scripts/verify-stack-planner.mjs` is wired into both `npm test` and `npm run build` and protects the five buyer goals, three catalog-backed capability slots per goal, real listing handoff, acquisition events, starter-kit attribution, homepage entry point, and sitemap route.
- Exact-head hosted validation is still required before a release decision; keep the PR draft until Vercel/build evidence is current.
- Next agent-owned action after an approved release is distribution into qualified MCP-directory traffic and observation of planner completion → starter-kit intent. Do not infer sales from page views or feature completion.
- No external marketplace submissions, payment activation, spend, customer contact, or production promotion is included in this branch.
