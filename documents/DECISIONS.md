# Architecture Decisions

*Append-only. Never delete entries. To reverse a decision, add a new ADR that supersedes the old one.*

---

## ADR-002: Verify Stripe sessions before deterministic starter-kit delivery

**Date:** 2026-09-20
**Status:** Accepted
**Context:** The existing Stripe route could create sessions for human-delivered implementation and sponsor offers, but the success page only promised manual follow-up. The release requirement needs an initial paid path that sells and delivers without human intervention, while no approved storage, tenant, or notification provider is configured.
**Decision:** Sell the bounded MCP Integration Starter Kit through an inline-price Stripe Checkout Session. Bind the session to `plan=starter` and a product version, verify `status=complete` and `payment_status=paid` server side, then serve the deterministic Markdown artifact with a private no-store response. Keep human implementation and sponsor plans inquiry-only until their fulfillment dependencies are configured.
**Consequences:** The starter kit is retryable without a database or email provider. A sandbox payment and live Stripe identity still need external validation. The artifact is generic and does not claim managed implementation, security verification, or provider delivery.
**Alternatives considered:** Restoring the prior false-success lead form or returning a payment-success toast without server verification was rejected because neither establishes persistence, payment entitlement, or delivery.

## ADR-001: [Decision Name]

**Date:** YYYY-MM-DD
**Status:** Accepted
**Context:** Why this decision was needed — what problem or tradeoff we were facing.
**Decision:** What we decided to do.
**Consequences:** Tradeoffs accepted. What becomes harder or easier.
**Alternatives considered:** What we explicitly rejected and why.

## ADR-003: Compose owned read-only audit providers through a gated MCP

**Date:** 2026-09-22
**Status:** Accepted
**Context:** EveryMCP needs one MCP entrypoint for owned SEO/AEO/GEO auditing while BrandKit and GetFoundInChat provider activation is incomplete and OGFixer's own rate limit is best-effort per runtime.
**Decision:** Implement a stateless Streamable HTTP `/api/mcp` using a fixed local tool allowlist. `audit_site` accepts one public URL and bounded page scope, checks remote tool schemas and read-only annotations before calling fixed provider endpoints, and returns each provider result with its own provenance, contract version, readiness, evidence, and errors. `get_audit_capabilities` reports provider readiness without scanning. Do not compute a blended score or expose portfolio scans without safe caller identity and tenant scope. The route remains HTTP 503 until a durable edge rate-limit rule is independently verified and an explicit server-side activation flag is set.
**Consequences:** Provider data is not persisted and no secret or arbitrary endpoint is accepted from callers. Reports can be partial while providers are pending or unavailable. BrandKit remains uncalled until its exact executable schema/auth contract is verified; GetFoundInChat remains uncalled until its production firewall readiness receipt is verified. A future operator must establish durable abuse controls before enabling anonymous target scans.
**Alternatives considered:** Treating metadata or HTTP 200 as proof of an executable audit was rejected. A normalized combined score and unauthenticated portfolio scans were rejected because provider evidence and tenant authority are not equivalent.

---
