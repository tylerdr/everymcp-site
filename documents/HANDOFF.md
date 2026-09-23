# EveryMCP release handoff — 2026-09-23

## Current release

- Audit bundle PR #10: https://github.com/tylerdr/everymcp-site/pull/10
- Reviewed source head: `96234988bd249023b3160e644d4be6bb45b9c126`.
- Merged main SHA: `5723963d71c9a5348dded256c92e25671109793a`; Vercel production deployment `A7P5U7MA553gzEMGCTzhCXeaFxt9` is READY.
- Production smoke on `https://everymcp.com`: `GET /api/mcp/readiness` returned 200; JSON-RPC initialize to `POST /api/mcp` returned 503 `MCP_SETUP_PENDING` before tool execution. No provider audit tool was called and no activation flag was set.

## Audit bundle and provider readiness

- `/api/mcp` exposes the stateless, versioned, read-only `audit_site` bundle and no-scan `get_audit_capabilities`. It keeps provider outputs, contracts, evidence, timing, and failures separate; no blended score, persistence, writes, or portfolio scan is exposed.
- EveryMCP execution remains disabled until a durable edge rate-limit rule is independently verified and the explicit activation flags are deliberately set. OGFixer `audit_url` is the only provider callable when the bundle is activated; its own rate control is best-effort, so the durable EveryMCP gate remains required.
- GetFoundInChat `gfic.audit_site` stays pending while its production endpoint reports firewall/rate-limit setup-pending. The provider's report contract is versioned; do not run scans until its production readiness receipt is verified.
- BrandKit's hosted MCP is live with seven tools, but no approved production brandbook or authorized EveryMCP/OGFixer credential and read scope is established. Keep it pending; do not infer the tool/auth contract or call it until its owner supplies the exact approved production contract.
- No OAuth issuer, tenant identity, or caller credential was fabricated. Sprinter Starter has no executable MCP implementation to reuse and its tenant isolation is a stub; Praxium's platform MCP authenticates bearer/API or OAuth tokens, resolves tenant/scopes, and gates tools. Any future portfolio audit needs an actual scoped identity and authorization contract.

## Validation and remaining work

- The merged head passed `npm run test:audit-mcp` (9/9), `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build`.
- Independent exact-head review passed after the provider adapter began requiring `readOnlyHint:true`, `destructiveHint:false`, exact accepted input keys, and a negative test proving contradictory annotations do not invoke a provider.
- Next: obtain and independently verify durable EveryMCP edge-rate-limit proof; verify GetFoundInChat's production firewall receipt; obtain BrandKit's approved production brandbook/tool/auth contract. Keep activation closed until all applicable gates pass. Do not run scans while a provider endpoint reports pending.
- No external marketplace submissions or spending were performed.
