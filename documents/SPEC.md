# everymcp — Product Spec

**Last updated:** 2026-09-22 (session: audit MCP composition)
**Version:** 0.3

---

## Overview
EveryMCP is a source-aware MCP discovery directory with a self-serve $49 MCP Integration Starter Kit and separately scoped implementation and sponsorship services.

## Problem
[What pain this solves. Who has it. Why now.]

## Target Users (ICP)
[Be specific. Job title, situation, pain level.]

## Core Features

### Feature 1: [Name]
- **Description:** [What it does]
- **Acceptance criteria:**
  - [ ] [Measurable outcome]
  - [ ] [Measurable outcome]
- **Status:** `planned`

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
- **Status:** `implemented; PR and production verification pending`

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

### Feature 2: [Name]
- **Description:**
- **Acceptance criteria:**
  - [ ]
- **Status:** `planned`

## Non-Goals
What we're explicitly NOT building in this phase:
- [Thing we won't do]
- [Thing we won't do]
- External marketplace submissions, platform-term acceptance, or publication claims.
- An active done-for-you listing service or fulfillment workflow.
- An aggregate portfolio SEO score or any unauthenticated multi-tenant/portfolio scan.

## Technical Architecture
- **Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Vercel; the audit MCP uses `mcp-handler` 2.x, MCP server/client SDK 2.x, and Zod 4.
- **Auth:** The audit route has no caller auth contract yet and remains setup-pending. Public execution requires an externally verified durable Vercel edge rate limit plus an explicit server-side enable flag.
- **Key patterns:** Fixed provider endpoints and tool allowlists; each remote schema must declare read-only and match the expected input contract before invocation. Requests are stateless and results are not persisted. Provider output/provenance is preserved; no cross-provider score is computed.
- **Data model:** [brief notes or pointer to a diagram]
- **See:** `documents/DECISIONS.md` for architectural choices

## Open Questions
Unresolved product decisions. Agents should NOT unilaterally resolve these.
- [ ] OQ001: Which approved Stripe account/key should be used for a labeled test-mode payment and production starter-kit sales?
- [ ] OQ002: What provider and operator identity should back durable inquiry capture and notifications?
- [ ] OQ003: Which production Vercel edge rate-limit policy and exact activation receipt will protect `/api/mcp`, and when will GetFoundInChat and BrandKit return verified executable contracts?

## Scope Additions Log
*Verbatim or close-paraphrase of Tyler's scope changes, not yet incorporated above.*

| Date | Input | Status |
|------|-------|--------|
| 2026-09-20 | "Primary offer, or at least initial revenue path and any lower-ticket offer, must require NO HUMAN INTERVENTION TO SELL OR DELIVER." | incorporated: self-serve starter kit |
| 2026-09-22 | "Retain the MCP server directory and add a directory of relevant marketplaces/platforms plus official source-backed listing guides/checklists for ChatGPT, Claude, Meta Muse, Grok and longtail." | incorporated: marketplace directory and dated guide/checklist routes; external submissions remain closed |
| 2026-09-22 | "...ensure getfoundinchat has the audit skills created and available via mcp... everyMCP MCP can include a single MCP where we can bundle these to run them all together... leverage the MCP capabilities from sprinter starter..." | incorporated: bounded EveryMCP audit MCP composition; GetFoundInChat and BrandKit activation remain readiness-gated |
