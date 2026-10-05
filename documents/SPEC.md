# everymcp — Product Spec

**Last updated:** 2026-10-05 (session: reviewed fixture release and exact publisher endpoint proposal)
**Version:** 0.9

---

## Overview
EveryMCP is a source-aware MCP discovery directory with a free outcome-based Stack Planner, a self-serve $49 MCP Integration Starter Kit, and separate enterprise consulting and sponsorship inquiries. Consulting is unpriced and requires confirmation of availability and scope; it is not a self-serve implementation product.

### Public MCP declaration evidence and reviewed endpoint proposal

The deterministic evidence layer has explicit MCP 2026-07-28 per-request Streamable HTTP and separate 2025-11-25 initialization/session profiles, proved against owned local HTTP fixtures. PR19 released this bounded tooling normally at `a0320ef98efbc4df2478bb9180dab94da1f33024` after exact-head independent review; matching READY production/domain and public regression acceptance passed. It captures attributed self-declared identity/capabilities, tool names/schemas, public auth challenge hints and Apps references without executing tools, registration, credentials, stdio, models or live probes. See [PUBLIC-DISCOVERY.md](PUBLIC-DISCOVERY.md).

The next draft proposes exactly the publisher-documented RevenueCat endpoint, with a source→endpoint→slug/legacy-ID relation; the other four priority endpoint identities remain unknown. A direct pinned HTTPS metadata-only adapter, separate profile request templates, first-page partial semantics, saved-receipt consistency and bounded network tests prepare a public declaration proof. Parent review of exact head/plan/endpoint/methods/bounds is required before enabling or running it; the live gate stays disabled and this cloud's custom TLS environment/direct-egress limitation is preserved. See [PUBLIC-ENDPOINT-REVIEW.md](PUBLIC-ENDPOINT-REVIEW.md). No public catalog/ranking/source-monitor changes, credential or tool calls, cache reuse, automatic publication, factual-confidence probability, score, badge or applicability denominator. Public display and genuine runtime/security evaluation require separate accepted evidence.

## Problem
Teams can find hundreds of MCP servers but still struggle to turn a business outcome into a small, sensible starting stack. Generic browsing creates choice overload; buying an implementation packet before the buyer has a concrete shortlist asks for commitment before value.

## Target Users (ICP)
Technical founders, AI/product leads, and operator-builders who already have an agent workflow in mind, can implement or supervise integrations, and need a fast way to narrow the catalog to the capabilities worth inspecting first.

## Core Features

### Free MCP Stack Planner
- **Description:** A no-account planner that maps one concrete buyer outcome to three capability slots, fills each slot from the current EveryMCP catalog, explains each server's role, gives the buyer an immediate integration sequence, and lets the buyer copy a portable implementation brief before handing qualified intent into the existing $49 starter kit.
- **Acceptance criteria:**
  - [x] Support five concrete buyer outcomes spanning research, software delivery, operations, data analysis, and durable agent context.
  - [x] Return up to three real catalog entries with direct listing and repository/source inspection links; do not invent servers or proof.
  - [x] Select an explicit reviewed catalog ID for each goal role and verify its category, so featured/alphabetic ordering cannot silently replace a useful capability.
  - [x] Use absolute EveryMCP URLs in copied briefs and current publisher URLs for the selected sources.
  - [x] Use shadcn Button/NativeSelect controls and CSS theme tokens while preserving the native required GET form and keyboard behavior.
  - [x] Give the buyer a useful three-step next action before asking for payment.
  - [x] Produce a copyable brief from the same catalog-backed plan with selected servers, roles, source links, and first integration sequence.
  - [x] Preserve goal/source attribution into `/pricing#starter-kit`.
  - [x] Track `stack_plan_generated`, `stack_plan_brief_copied`, and `stack_plan_starter_kit_clicked` as value, activation, and paid-intent events.
  - [x] Link the planner from the homepage and sitemap.
- **Status:** `implemented; PR #13 merged October 3, 2026`

The five starting stacks are deliberately concrete: Brave/Fetch/Memory for research; GitHub/Filesystem/Context7 for software; GitHub/Playwright/Filesystem for recurring engineering checks; MotherDuck/Grafana/Filesystem for data analysis; and Memory/Filesystem/Chroma for durable context. A plan is a starting point for the described systems, not a compatibility decision for an unknown buyer environment. The paid download rebuilds recommendations from the current catalog using the verified payment's selected goal; no frozen checkout-time catalog snapshot is stored.

### Dated source evidence on existing traffic pages
- **Description:** Preserve the Redash, RevenueCat, iCloud, Heap and Hotjar listing IDs, names, slugs and canonicals while correcting unsupported metadata and adding timestamped public-source observations.
- **Acceptance criteria:**
  - [x] Keep unavailable indexed repositories identifiable as historical sources, not reassigned to a different community creator.
  - [x] Separate publisher documentation, community candidates, dated HTTP observations and untested behavior.
  - [x] Document RevenueCat's cloud MCP and current OAuth/API v2 setup from publisher sources.
  - [x] Remove unsupported Heap analytics-query and iCloud photo/sync claims; expose iCloud candidate archive status and Heap maintainer auth/deletion warnings.
  - [x] Explain the Hotjar/Contentsquare transition without establishing legacy-account compatibility.
  - [x] Add the existing free planner path without promising inclusion of the viewed listing.
  - [x] Remove unsupported popularity and the fixed human implementation promotion; retain the existing consulting inquiry destination and truthful $49 payment gate.
- **Status:** `merged as PR #15 and exact production readback verified October 4, 2026`

### Self-serve MCP Integration Starter Kit
- **Description:** A deterministic Markdown worksheet and rollout packet sold through Stripe Checkout and delivered after server-side payment verification.
- **Acceptance criteria:**
  - [x] Checkout session is bound to the starter plan and product version.
  - [x] Delivery requires a completed paid Stripe session and supports retry.
  - [x] Goal-specific matrix rows and notes use the same reviewed current-catalog selections as the brief. Legacy/no-goal packets use deduplicated research and software defaults; every emitted matrix source is covered by actual kit-body release checks.
  - [x] Implementation and sponsorship plans remain closed to payment until fulfillment is configured.
- **Status:** `implemented; sandbox receipt pending`

### Marketplace and listing guide directory
- **Description:** A source-aware directory of relevant MCP distribution destinations with platform-specific listing or connection checklists. Each entry separates first-party directories, first-party client connections, the official MCP Registry, and community marketplaces, and labels hosted remote MCP versus local packaging paths.
- **Acceptance criteria:**
  - [x] ChatGPT, Claude, Grok, Meta Muse, and longtail destinations have dated official or platform source links.
  - [x] Each guide exposes eligibility, review/publication path, cost statement, open unknowns, and a preparation checklist.
  - [x] Directory filters distinguish destination type and hosted/local integration mode.
  - [x] Done-for-you listing submissions are visibly future/closed with no active orders, submissions, or fulfillment claims.
  - [x] Existing MCP server directory remains discoverable and unchanged as the underlying catalog.
  - [x] Marketplace cards and guide headers use official source assets where available or clean typographic wordmarks, with no generated pseudo-logos.
  - [x] The directory hub uses an accessible route diagram that explains distribution paths without implying endorsement or a submission receipt.
- **Status:** `implemented`

### Read-only SEO/AEO/GEO audit MCP
- **Description:** A stateless Streamable HTTP MCP bundle at `/api/mcp` that invokes only verified, fixed-endpoint audit tools. It returns versioned per-provider results with independent evidence, scores, readiness, provenance, and partial failures. It does not write or persist audit data.
- **Acceptance criteria:**
  - [x] Expose `audit_site` for one bounded public URL and `get_audit_capabilities` for readiness without scanning.
  - [x] Enforce a strict public-URL shape, one-site limit, GetFoundInChat page limit of 1–5, bounded inbound/provider response sizes, fixed provider endpoints, and hard provider timeouts.
  - [x] Keep BrandKit and GetFoundInChat pending until their executable provider contracts and production readiness are verified; only invoke the read-only OGFixer `audit_url` tool whose schema is verified.
  - [x] Preserve source MCP results and expected report contracts verbatim; return per-provider errors/readiness without calculating a blended score.
  - [ ] Keep hosted tool execution disabled until EveryMCP's durable edge rate-limit rule is independently verified and the route is deliberately enabled.
  - [ ] Enable GetFoundInChat only after its production firewall/rate-limit receipt is verified; implement BrandKit only after its exact tool/auth schema is available.
- **Status:** `merged and deployed; hosted route setup-pending`

## Non-Goals
What we're explicitly NOT building in this phase:
- A new subscription or account system solely for the planner.
- Automatic installation of recommended MCPs or claims that a planner shortlist is independently verified for a caller's environment.
- External marketplace submissions, platform-term acceptance, or publication claims.
- An active done-for-you listing service or fulfillment workflow.
- An aggregate portfolio SEO score or any unauthenticated multi-tenant/portfolio scan.

## Technical Architecture
- **Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Vercel; the audit MCP uses `mcp-handler` 2.x, MCP server/client SDK 2.x, and Zod 4.
- **Planner:** Server-rendered GET flow at `/plan`; typed goal profiles name reviewed existing catalog IDs and cross-check their categories. The same typed plan produces a portable text brief with absolute links, while a small client tracker records generation, copy, and starter-kit handoff events. The build gate evaluates all five profiles against the real catalog.
- **Auth:** The planner is public and read-only. The audit route has no caller auth contract yet and remains setup-pending. Public audit execution requires an externally verified durable Vercel edge rate limit plus an explicit server-side enable flag.
- **Key patterns:** Fixed provider endpoints and tool allowlists for audits; current catalog ownership for planner recommendations; no new persistence for the planner. Requests to the audit MCP are stateless and results are not persisted.
- **See:** `documents/DECISIONS.md` for architectural choices.

## Growth experiment
- **Hypothesis:** A buyer who receives a concrete three-server starting stack before seeing the paid offer will show more qualified starter-kit intent than a buyer sent directly from generic directory browsing.
- **ICP:** Technical founder, AI/product lead, or operator-builder with a specific agent workflow and implementation authority.
- **Value event:** `stack_plan_generated`.
- **Activation signal:** `stack_plan_brief_copied` — the buyer carried the result into an implementation workflow; this is not a purchase.
- **Baseline/denominator:** First 50 completed plans after approved release; there is no valid pre-feature planner baseline.
- **Intervention:** Outcome-based planner, portable implementation brief, and direct attributed starter-kit handoff.
- **Primary metric:** `stack_plan_starter_kit_clicked / stack_plan_generated`.
- **Observation window:** 50 completed plans or 14 days, whichever comes first.
- **Budget/authority:** $0 incremental spend; no outbound or production activation in the implementation PR.
- **Rule:** >=10% keep/expand; 5–10% improve handoff; <5% validate traffic/instrumentation then revisit ICP/value framing before adding features.

## Open Questions
Unresolved product decisions. Agents should NOT unilaterally resolve these.
- [ ] OQ001: Which approved Stripe account/key should be used for a labeled test-mode payment and production starter-kit sales?
- [ ] OQ002: What provider and operator identity should back durable inquiry capture and notifications?
- [ ] OQ003: Which production Vercel edge rate-limit policy and exact activation receipt will protect `/api/mcp`, and when will GetFoundInChat and BrandKit return verified executable contracts?

## Scope Additions Log
*Verbatim or close-paraphrase of Tyler's scope changes, not yet incorporated above.*

| Date | Input | Status |
|------|-------|--------|
| 2026-09-23 | "GROWTH AND CUSTOMER VALUE FIRST... Each substantive normal run must complete or meaningfully advance a growth/product deliverable." | incorporated: free outcome-based Stack Planner → portable brief → attributed starter-kit handoff |
| 2026-09-20 | "Primary offer, or at least initial revenue path and any lower-ticket offer, must require NO HUMAN INTERVENTION TO SELL OR DELIVER." | incorporated: self-serve starter kit |
| 2026-09-22 | "Retain the MCP server directory and add a directory of relevant marketplaces/platforms plus official source-backed listing guides/checklists for ChatGPT, Claude, Meta Muse, Grok and longtail." | incorporated: marketplace directory and dated guide/checklist routes; external submissions remain closed |
| 2026-09-22 | "...ensure getfoundinchat has the audit skills created and available via mcp... everyMCP MCP can include a single MCP where we can bundle these to run them all together... leverage the MCP capabilities from sprinter starter..." | incorporated: bounded EveryMCP audit MCP composition; GetFoundInChat and BrandKit activation remain readiness-gated |

## 2026-10-04 continuation boundary
User authorized tested EveryMCP merges and requested accuracy/trust before paid monitoring. The next slice is bounded deterministic public-source monitoring: deduplicated URLs, explicit observation/failure/unknown states, caching and review-controlled publication. Capability discovery must use version-specific conformance profiles and respect optional features. Jev judgment, aggregate grading, badges, gateway design, and paid-provider execution await the research contract and an approved cost limit; no model confidence becomes a published fact.

## Source monitoring foundation (merged; scheduled receipt pending)

All 616 listing URLs are retained and related to 585 normalized/deduplicated source URLs. `scripts/monitor_sources.py` provides default dry-run inventory and explicit bounded public-only GETs, robots policy, conditional/content-hash caching, separate attempt/success observations, immutable run records, full JSON Schema and publication-policy validation. The merged GitHub workflow prioritizes the five reviewed pages daily and rotates remaining eligible sources weekly. Every source has an explicit observed/unknown/not-checked state and actual cohort denominator; no complete-catalog claim follows a partial run. The duplicate legacy Neon ID is a finding, not an automatic edit.

The collector never updates catalog prose, identity, links, offers or public evidence automatically. Review is required. Protocol/applicability denominator, score and badge stay null. No MCP tools/resources/prompts, stdio installs, credentials, model providers, gateway adoption or new prices. The verified `2026-10-04-r2` research bundle is intentionally not executable scoring policy; any later rule implementation needs pinned clauses and adversarial validation. See `SOURCE-MONITOR.md` for collection/publication gates and scheduling proof.

### Deterministic receipt import and priority review

The offline importer validates a canonical report hash/schema, independently obtained trusted-main run/job metadata, exact current URL-to-listing relationships and cohort/chronology/budget consistency before generating an internal five-listing review queue. An explicit as-of timestamp makes freshness reproducible. Each row preserves the latest read outcome/reason, prior successful read, unresolved findings, indexed versus separate-reference role, documented publisher/community attribution, curated note/date, original source citation and a JSON pointer to the complete receipt. Stale, failed/unknown and unchecked reads remain distinct; no HTTP observation becomes an MCP evaluation.

The actual successful manual run is preserved as a durable body-free receipt plus JSON/Markdown queue. The full catalog and public evidence remain unchanged. No automated publication, confidence score, badge, evaluator, paid call or commerce activation is introduced. Review exact source content/identity and retained iCloud/Heap cautions before a separately reviewed public refresh. PR18 is merged at `df42cc3f0cf04e57fd24e7d6876a5421011c5aad` after an additional independent exact-head review; matching READY production/domain, nine-route/616-sitemap/queue replay and commerce/provider holds were revalidated 2026-10-04T23:50:22Z. First scheduled due-run verification and any public-note refresh remain separate work.

### One-use anonymous declaration proof control (2026-10-05)

Parent-approved operational proof is fixed to RevenueCat and the independently reviewed source/plan. A separate manually dispatched public standard hosted workflow binds exact reviewed main control SHA and original clean observer snapshot, requires normal verified TLS without CA/proxy mutation, unfiltered first-run admission and an exclusive private claim, and exports only sanitized actual provenance/status/hash/count summaries. No recurring capability job, auth/tool execution, grades/badges or automatic listing changes. Auth refusal is valid limited evidence and leaves capability/evaluation facts unknown. See [control contract](REVENUECAT-PROOF-ONCE.md); failed/refused first execution consumes admission, with administrator history mutation outside that guarantee.

One-use proof completed 2026-10-05T02:45:30Z: one anonymous fixed RevenueCat modern-profile discovery request returned401/Bearer and halted all remaining profiles. The authenticated-control/anonymous-target distinction and actual status/header/wire/hash/time provenance are recorded, with unexported private receipt limitation and null auth-body hash. Capability/evaluation facts remain unknown; no public listing refresh or grading occurred. Approval is consumed; future observation/public evidence display remains separate review.

Reviewed observation display: a source-reference note may show a dated anonymous endpoint observation and link its immutable reviewed public record, keeping documentation-read dates separate and authentication neutral. It explicitly preserves uninspected tool/resource and unassessed compliance/security states. This is manually reviewed publication of a limited fact, not automatic monitor output or a grade. Existing evidence UI and identities are reused.
