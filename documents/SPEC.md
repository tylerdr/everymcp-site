# everymcp — Product Spec

**Last updated:** 2026-09-20 (session: self-serve starter kit)
**Version:** 0.1

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

### Feature 2: [Name]
- **Description:**
- **Acceptance criteria:**
  - [ ]
- **Status:** `planned`

## Non-Goals
What we're explicitly NOT building in this phase:
- [Thing we won't do]
- [Thing we won't do]

## Technical Architecture
- **Stack:** [Next.js, TypeScript, Supabase, shadcn/ui, Tailwind v4, Vercel]
- **Auth:** [Supabase session / NextAuth / etc.]
- **Key patterns:** [brief notes]
- **Data model:** [brief notes or pointer to a diagram]
- **See:** `documents/DECISIONS.md` for architectural choices

## Open Questions
Unresolved product decisions. Agents should NOT unilaterally resolve these.
- [ ] OQ001: Which approved Stripe account/key should be used for a labeled test-mode payment and production starter-kit sales?
- [ ] OQ002: What provider and operator identity should back durable inquiry capture and notifications?

## Scope Additions Log
*Verbatim or close-paraphrase of Tyler's scope changes, not yet incorporated above.*

| Date | Input | Status |
|------|-------|--------|
| 2026-09-20 | "Primary offer, or at least initial revenue path and any lower-ticket offer, must require NO HUMAN INTERVENTION TO SELL OR DELIVER." | incorporated: self-serve starter kit |
