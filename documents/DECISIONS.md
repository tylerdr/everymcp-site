# Architecture Decisions

*Append-only. Never delete entries. To reverse a decision, add a new ADR that supersedes the old one.*

## ADR-006: Add only the shadcn primitives required by the planner

**Date:** 2026-10-03
**Status:** Root-requested release correction.
**Context:** AGENTS.md prescribes shadcn and CSS variable theming, but the repository had no components/ui setup and the new planner added native controls directly.
**Decision:** Use the official Button source at https://ui.shadcn.com/r/styles/new-york/button.json and NativeSelect at https://ui.shadcn.com/r/styles/new-york-v4/native-select.json. Adapt utility imports, shadows and focus classes to current React 18/Tailwind 3; retain native GET/required semantics and semantic links. Add the minimal utility dependencies and theme tokens without replacing existing global styles or package resolutions.
**Consequences:** Planner controls meet the existing UI standard without a custom popover, new form state, site redesign or framework migration. Browser interaction remains a separate observed qualification; source and hosted HTML checks do not establish a clipboard or analytics receipt.

---

## ADR-005: Use reviewed goal selections throughout paid delivery

**Date:** 2026-10-03
**Status:** Authorized correction on existing PR #13; final release remains root-owned.
**Context:** The personalized brief used reviewed sources, but the generic matrix still emitted featured records with a missing source and duplicate server.
**Decision:** Derive paid matrix rows and notes from the selected goal's recommendations. For legacy/no-goal delivery, combine the reviewed research and software defaults and deduplicate by server ID. Test the actual emitted rows, notes and all GitHub source links in every packet.
**Consequences:** The paid brief and matrix stay consistent as the current catalog changes. No stored purchase snapshot, payment contract, price or new fulfillment dependency is introduced.

---

## ADR-004: Name the catalog capabilities used by each starter plan

**Date:** 2026-10-03
**Status:** Accepted for the root-authorized correction on existing PR #13; release still requires review.
**Context:** The category-first planner selected four unavailable source URLs and an archived wrapper despite a green fixture-based contract. Broad category membership did not establish a useful capability for the goal.
**Decision:** Each role names an existing catalog ID and expected category. Keep source URLs on those catalog records, make copied listing links absolute, and test all five goals against the actual catalog. Verify the ten selected publisher sources separately during release review. Paid fulfillment continues to use the verified session goal with the current catalog, and its copy states that recommendations may change.
**Consequences:** Updating a selected capability is an explicit reviewed change. Existing catalog browsing, prices and payment/MCP activation gates remain intact. This does not introduce a stored checkout-time snapshot, a provider execution claim or an automatic install.

---

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

## ADR-007: Separate indexed identity, source receipts and community alternatives

**Date:** 2026-10-04
**Status:** Authorized correction; independent review and release gates required.
**Context:** Five traffic listings returned 200 but their indexed repository links returned 404. Catalog copy claimed capabilities and publishers that those sources could not support.
**Decision:** Preserve listing identity and canonical URLs. Store curated timestamped GET receipts separately in `data/listing-evidence.json`; expose source status and independently attributed alternatives in a server-rendered component. Correct descriptions/installation/use cases without silently substituting a community publisher. A HTTP 200 documents availability only, while HTTP 404 is a dated observation, not permanent unavailability. Add the existing free planner rather than promising automatic inclusion of the viewed server.
**Consequences:** The first five pages become useful source-comparison entry points. No runtime discovery, tool execution, protocol judgment, certification, aggregate score, credential or security configuration is added. Future refreshes must preserve this distinction and send identity/capability changes to review.

## ADR-008: Use an unpriced enterprise contact path rather than a fixed human package

**Date:** 2026-10-04
**Status:** User direction supersedes the public fixed implementation tier in ADR-002.
**Decision:** Remove the $2,000 implementation promotion and unsupported popularity claim. Retain `/services` and `#implementation-inquiry` as a modest enterprise consulting contact path with availability/scope/terms requiring separate confirmation. The form still calls `/api/lead` for the existing methodology resource and does not book or promise delivery.
**Consequences:** The $49 starter kit and all payment/provider gates remain intact. Dormant manual product definitions are retained to avoid changing the payment contract; they remain rejected by self-serve checkout. No new price, engagement, provider or outbound notification is created.

## ADR-009 — Free deterministic source observations before semantic grading (2026-10-04)

**Decision:** Use a standalone bounded public source collector, pinned JSON Schema and robots parser, explicit evidence dates/unknowns, immutable receipts and a trusted-main GitHub workflow. Preserve all stable listing URLs and original identity relationships. Robots exclusions/unknown policy, blocked requests, partial responses and budget limits are scanner outcomes, not target-server quality failures. Use UTC calendar-day eligibility to tolerate scheduler jitter, private-address/multicast refusal, pinned TLS and complete-request deadlines.

**Publication:** Generated facts remain review-required and no catalog file is written. Last attempt never replaces last known success with invented prose; unresolved findings survive expiry/recovery. Public source identity remains unknown unless a separate curated publisher/community reference supports a documented claim.

**Rationale:** The reviewed research proposal is not an executable scoring policy, and shared gateway/Jev defaults have unresolved licensing/technical/cost boundaries. Source HTTP status cannot establish runtime/security passes. Null actor/version/transport/applicability denominator, score and badge make that boundary explicit. Paid/model providers remain disabled. A committed workflow is not proof of a scheduled due run.

## ADR-010 — Offline receipt import with exact evidence relationships (2026-10-04)

**Decision:** Import only schema/hash-validated collection receipts paired with independently verified canonical trusted-main run/job metadata and an explicit review timestamp. Fail closed on conflicting identities, exact URL/role mappings, observation chronology, actual cohort counters, immutable content or workflow budgets. Recompute queue freshness at the supplied timestamp while retaining receipt freshness, last attempt, last success, unresolved findings and original curated citations/notes. Keep both Neon slugs and the legacy ID collision.

**Publication:** Generate internal content-addressed JSON/Markdown bundles under operational storage; a reviewed snapshot can be preserved in a PR. No importer or CI job writes the public catalog/evidence. Publisher/community reference identity and curated capability/maintenance cautions remain separate from HTTP observations. Recovery, staleness, blocked/failed reads and a 200 cannot grant a capability pass or resolve an unresolved finding. Score/badge/applicability denominator remain null.

**Rationale:** The successful manual runner receipt needs a reproducible path into the five-page review process. Content integrity is not origin authentication, so the run/job read and exact execution head remain explicit inputs. A current-catalog relationship mismatch needs historical mapping review instead of silently assigning old evidence to a new listing. This bounded slice requires no requests, model calls, credentials, database writes or provider spend. Scheduled-run proof and public-note refresh are separate work.
