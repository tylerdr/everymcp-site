# Plan: Unified SEO/AEO/GEO audit MCP

## Goal

Add one bounded, read-only EveryMCP MCP surface for running independently owned SEO/AEO/GEO audits. Preserve every provider's own schema, evidence and scores; expose pending and failed providers honestly. The hosted surface must remain disabled until durable abuse controls are verified.

## Boundaries

- Repository: `tylerdr/everymcp-site`, isolated branch `feat/seo-aeo-geo-audit-mcp`, exact base `b63b88014ad734d7c407df664918988852b07756`.
- No edits to Praxium, Sprinter Starter, BrandKit, OGFixer or GetFoundInChat repositories.
- Provider URLs, MCP tool names, and any credentials are fixed server-side. Inputs cannot supply a remote server URL, token, tenant, or API key.
- Expose only provider tools whose exact schemas, anonymity/auth model and bounds are verified. Never discover-and-forward arbitrary upstream tools.
- No cross-provider score. Preserve nested source reports and identify source, tool, endpoint, report version, run time, evidence and limitations.
- GetFoundInChat `gfic.audit_site` is a verified contract but remains unavailable until its production firewall/readiness activation is independently confirmed. BrandKit remains setup-pending. OGFixer exposes verified read-only `audit_url`, `recommend_fixes`, and `validate_url`, but its best-effort per-runtime rate limit does not justify anonymous bundle activation.
- Keep `/api/mcp` setup-pending unless durable EveryMCP rate/abuse controls are independently verified. No OAuth issuer or user identity will be fabricated.
- One target site per call, bounded page count/fan-out, hard provider timeouts and response caps. Validate public HTTP(S) URLs and do not follow arbitrary caller-provided endpoints. Upstream site fetches must enforce their own DNS/IP/redirect safety.
- `audit_portfolio` is out of v1 unless safe caller identity and tenant scoping become available.

## Proposed result contract

Version the aggregator envelope independently (initially `everymcp.audit-site.1`). Return one result per provider with stable provider/tool identifiers, `ready|pending|disabled|error|completed` status, upstream endpoint and report version, start/end/duration, optional preserved result, and bounded safe error metadata. Overall status is `completed|partial|unavailable|rejected`; do not collapse numeric scores or imply a site-wide grade. A readiness tool may expose the same provider activation states without making upstream calls.

## Sequence

1. Add this plan and verbatim scope to `documents/PROMPTS.md`.
2. Confirm current Vercel/Next route patterns and implement a fixed allowlist of MCP clients with strict JSON-RPC/MCP response validation.
3. Implement provider adapters and versioned result envelope; keep unverified or inactive providers pending.
4. Gate inbound execution on an explicit server-side activation flag that remains unset until durable firewall/rate controls are proven. Add contract tests for allowlisting, bounds, partial failures, pending states, provenance, response cap, and fail-closed behavior.
5. Run focused tests, repository tests, lint/type checks and production build. Get independent security/code review.
6. Open a PR; verify exact preview and endpoint behavior only within the established activation boundary. Production activation waits for durable abuse controls and real provider readiness receipts.

## Acceptance evidence

- Local contract tests show no upstream calls when EveryMCP is setup-pending, and show truthful partial results when providers are pending or fail.
- Inputs cannot select endpoints or credentials, exceed page/request/response/time limits, or access arbitrary/private targets through this server.
- Every completed provider result contains exact upstream provenance and unchanged source JSON; no synthetic combined score appears.
- Build, lint, relevant tests and independent review pass before PR merge. Live audit claims require exact endpoint/provider readiness receipts.
