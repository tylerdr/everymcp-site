# EveryMCP release handoff — 2026-09-22

## Current session

- Feature branch: `feat/seo-aeo-geo-audit-mcp`, based on merged marketplace-guide main SHA `b63b88014ad734d7c407df664918988852b07756`.
- Adds a bounded, stateless Streamable HTTP audit bundle at `/api/mcp` with a setup-pending gate, plus `/api/mcp/readiness` for no-scan status.
- Source implementation and focused tests are complete; PR and independent review are the next steps. This branch has not been merged, deployed, or activated.

## Audit bundle contract

- `get_audit_capabilities` reports activation and provider readiness without scanning. `audit_site` takes one public HTTP(S) URL and an optional GetFoundInChat `pageLimit` from 1–5.
- Provider endpoints/tool names are fixed in server code. The adapter checks remote schemas and read-only annotations, bounds request/response bytes and elapsed time, and returns per-provider readiness/errors with endpoint, tool, report version, timestamps, and unchanged provider results.
- OGFixer `audit_url` is the only provider called by default. GetFoundInChat `gfic.audit_site` stays pending until its production firewall receipt is independently verified. BrandKit remains pending until an executable schema and auth contract are verified.
- No blended score, persistence, writes/remediation, caller-supplied credentials or endpoint, or portfolio scan. Upstream URL fetching remains subject to each provider's own DNS/private-address/redirect guards.
- The hosted handler returns 503 unless both `EVERYMCP_AUDIT_MCP_EDGE_RATE_LIMIT_READY=true` and `EVERYMCP_AUDIT_MCP_ENABLED=true`; setting the first is an operator attestation that requires exact durable edge-rule evidence.

## Alignment and verification

- Sprinter Starter has no executable MCP pattern to reuse yet and marks its tenant isolation as unfinished. Praxium's platform MCP uses authenticated bearer API/OAuth credentials, resolves tenant and scopes, and permission-gates tools. This public-readiness-only bundle creates no tenant data or saved state, so it does not invent an issuer, token, tenant ID, or scope; any authenticated portfolio feature must adopt a real scoped identity contract first.
- `npm run test:audit-mcp` passes 8/8 tests; `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass.
- Local tests and build do not establish Vercel edge protection, provider activation, preview behavior, or production audit results. No upstream live scans were performed.

## Next steps

1. Finish dependency-lockfile review and commit the feature branch.
2. Open a PR for independent source/security review; do not merge or deploy from this lane.
3. Keep activation blocked until the exact EveryMCP durable edge rate-limit rule and GetFoundInChat firewall receipt are independently verified. Wait for BrandKit's exact executable/auth contract before adding its call.
4. Update this handoff after review/merge/production evidence. Do not make directory submissions or spend money.
