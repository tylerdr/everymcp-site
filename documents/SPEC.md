# everymcp — Product Spec

**Last updated:** 2026-09-23 (session: growth-first stack planner)
**Version:** 0.4

---

## Overview
EveryMCP is a source-aware MCP discovery directory with a free outcome-based Stack Planner, a self-serve $49 MCP Integration Starter Kit, and separately scoped implementation and sponsorship services.

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
  - [x] Give the buyer a useful three-step next action before asking for payment.
  - [x] Produce a copyable brief from the same catalog-backed plan with selected servers, roles, source links, and first integration sequence.
  - [x] Preserve goal/source attribution into `/pricing#starter-kit`.
  - [x] Track `stack_plan_generated`, `stack_plan_brief_copied`, and `stack_plan_starter_kit_clicked` as value, activation, and paid-intent events.
  - [x] Link the planner from the homepage and sitemap.
- **Status:** `implemented on draft growth branch; exact-head hosted validation pending`

### Self-serve MCP Integration Starter Kit
- **Description:** A deterministic Markdown worksheet and rollout packet sold through Stripe Checkout and delivered after server-side payment verification.
- **Acceptance criteria:**
  - [x] Checkout session is bound to the starter plan and product version.
  - [x] Delivery requires a completed paid Stripe session and supports retry.
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
- **Planner:** Server-rendered GET flow at `/plan`; typed goal profiles map to current catalog categories and select real entries from `sortedMcps`. The same typed plan produces a portable text brief, while a small client tracker records generation, copy, and starter-kit handoff events.
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
