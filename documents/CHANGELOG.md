# Changelog

*Append-only, newest first. Never edit old entries.*

## 2026-09-23 — Close audit MCP review and verify gated production release

**Branch:** `feat/seo-aeo-geo-audit-mcp` → PR #10 merged as `5723963d71c9a5348dded256c92e25671109793a`; reviewed source head `96234988bd249023b3160e644d4be6bb45b9c126`
**Follow-up:** Independent review found that a remote provider could declare both `readOnlyHint:true` and `destructiveHint:true`. The adapter now rejects that contradiction, requires the exact provider input property/required-key sets, and validates the complete OG page-scope enum before calling a provider. A negative MCP round-trip test proves the contradictory tool is never invoked.

**Validation:** Focused audit tests pass 9/9; repository `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass. The exact-head preview and the exact merge-SHA Vercel production deployment were READY. Readiness GET returned 200; MCP initialize returned HTTP 503 `MCP_SETUP_PENDING` before provider execution. No audit scan or activation was performed.
**Current provider boundary:** OGFixer remains the only callable provider after EveryMCP's durable edge limit is verified. GetFoundInChat is pending its production firewall receipt. BrandKit's hosted MCP is live with seven tools, but approved production brandbook access and an authorized EveryMCP/OGFixer credential/read scope are not established; its adapter remains unimplemented and pending.
**Follow-up / tech debt created:** Verify the durable EveryMCP edge rule, GetFoundInChat firewall receipt, and BrandKit approved production contract before activating any corresponding provider.

## 2026-09-22 — Add a gated multi-provider audit MCP (Codex session)

**Branch:** `feat/seo-aeo-geo-audit-mcp` from `b63b88014ad734d7c407df664918988852b07756` → draft PR #10
**Tyler's prompt:** Ensure GetFoundInChat audit capabilities are available via MCP and compose owned audit products through one EveryMCP MCP, aligned with Sprinter platform boundaries.

**Shipped on branch:**
- `app/api/mcp/route.ts`, `app/api/mcp/readiness/route.ts`, `lib/audit-mcp.ts` — stateless, setup-pending MCP with a fixed provider allowlist, bounded public single-site `audit_site`, and no-scan readiness tool.
- `tests/audit-mcp.test.ts` — provider contracts, URL/input/response/time bounds, partial readiness, provenance preservation, and fail-closed activation coverage.
- `README.md`, `documents/SPEC.md`, `documents/DECISIONS.md`, and this handoff pack — public contract, safety boundary, activation prerequisites, and follow-up.

**Decisions:** No blended score, portfolio scan, saved report, or write tool. OGFixer `audit_url` is executable; BrandKit and GetFoundInChat remain pending until their exact production contracts/readiness are proven. EveryMCP execution remains HTTP 503 until a durable edge rate-limit rule is independently verified and an explicit enable flag is set.
**Validation:** Focused audit MCP tests (8/8), repository `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` pass. This is local source/build evidence only; no provider scans or hosted activation were performed.
**Follow-up / tech debt created:** Independently review the PR; obtain exact Vercel edge-rule proof before enabling the public endpoint; wait for the GetFoundInChat firewall receipt and BrandKit executable/auth contract.

## 2026-09-22 — Add official marketplace brand references and route visual (Codex session)

**Branch:** `feature/marketplace-listing-guides-20260922` → PR #9 updated at `5f9ad49`
**Coordinator instruction:** Remove generated marketplace artwork and pseudo-logos; use official source assets where available, clean wordmarks otherwise, and keep the visual treatment bounded and non-endorsing.

**Shipped:**
- `components/MarketplaceBrand.tsx`, `public/marketplaces/brands/*` — source-linked official favicon assets for Claude, Grok, Muse, Smithery, and Glama; text wordmarks for destinations without a selected approved mark.
- `components/MarketplaceHeroVisual.tsx` — accessible inline route diagram for first-party, client-connection, registry, and community paths.
- `app/marketplaces/page.tsx`, `app/marketplaces/[slug]/page.tsx`, `components/MarketplaceCard.tsx` — responsive visual hierarchy, source references, and independent-directory boundary copy.

**Validation:** `npm test`, `npm run lint`, and `npm run build` pass; the production build generated 752 static pages. Final headed captures cover desktop, cards, mobile, and a representative detail route. No generated image assets or external submissions were used.

## 2026-09-22 — Add source-backed marketplace and listing guides (Codex session)

**Branch:** `feature/marketplace-listing-guides-20260922` → PR pending
**Coordinator instruction:** Retain the MCP server directory and add relevant marketplace/platform guides for ChatGPT, Claude, Meta Muse, Grok, and longtail destinations with explicit source and fulfillment boundaries.

**Shipped:**
- `lib/marketplaces.ts` — typed eight-destination catalog with checked source URLs, platform kind, hosted/local mode, eligibility, review, cost, unknowns, and preparation checklists.
- `app/marketplaces/page.tsx`, `app/marketplaces/[slug]/page.tsx` — filterable directory, guide detail routes, dated source links, and an explicit future/closed done-for-you notice.
- `components/MarketplaceCard.tsx`, `components/MarketplaceFilters.tsx` — accessible route-based filters and guide cards.
- `app/page.tsx`, `app/blog/page.tsx`, `components/SiteHeader.tsx`, `components/SiteFooter.tsx`, `app/sitemap.ts` — navigation, resource, homepage, footer, and indexation links.
- `scripts/verify-marketplace-guides.mjs` — source/category/count contract wired into test and build.

**Validation:** `npm test`, `npm run lint`, `npx tsc --noEmit`, and `npm run build` passed. Browser evidence covers the index, filtered Grok connection view, Grok guide, and Meta Muse portal-gated guide. No external submission or payment was performed.

## 2026-09-22 — Add compatible EveryMCP social and favicon assets (Codex session)

**Branch:** `fix/raster-og-favicon` → PR pending
**Tyler's prompt:** Bounded visual/metadata audit with browser evidence and focused fixes.

**Shipped:**
- `public/og-default.png` — Raster 1200x630 version of the existing branded OG artwork for social crawlers that do not decode SVG.
- `public/favicon.png` — 64x64 favicon derived from the existing EveryMCP accent mark.
- `app/layout.tsx`, `lib/site.ts` — PNG Open Graph/Twitter, favicon/apple touch icon, and Organization JSON-LD references.
- `scripts/verify-brand-assets.mjs` — PNG signature, dimensions, byte-size, and metadata reference contract.

**Validation:** `npm test`, `npm run lint`, and `npm run build` pass. The build required network access for the existing `next/font` Google Fonts fetch.

## 2026-09-20 — Add self-serve starter kit with verified Stripe delivery (Codex session)

**Branch:** `fix/selfserve-starter-kit-20260920` → PR pending
**Tyler's prompt:** Implement a primary or initial lower-ticket revenue path that sells and delivers without human intervention; manual email is only a fallback.

**Shipped:**
- `lib/products.ts`, `app/api/checkout/route.ts` — shared product catalog, $49 starter-kit session, product-version binding, and fail-closed manual plans.
- `lib/stripe-fulfillment.ts`, `app/checkout/success/page.tsx`, `app/api/fulfillment/starter-kit/route.ts` — server-side paid-session verification, explicit failure states, and retryable deterministic download.
- `lib/starter-kit.ts`, `components/FulfillmentDownload.tsx`, `components/CheckoutButton.tsx` — immediate Markdown deliverable and Vercel Analytics funnel events.
- `app/page.tsx`, `app/pricing/page.tsx`, `app/services/page.tsx`, `app/sponsor/page.tsx`, `app/sitemap.ts` — self-serve positioning, manual fulfillment boundaries, and indexable pricing/methodology routes.
- `scripts/verify-selfserve-checkout.mjs` — regression contract for payment verification and lead safety.

**Decisions:** Do not take payment for implementation or sponsorship until their fulfillment dependencies are configured. Use a Stripe Checkout Session as the entitlement proof for the static starter kit, avoiding invented storage or provider claims.
**Follow-up / tech debt created:** Run a labeled Stripe test-mode payment and receipt/download retry; configure production Stripe identity only if approved; separately verify Vercel Analytics event receipt and GSC sitemap submission.

---

## YYYY-MM-DD — [Brief description] (Claude Code / Codex session)

**Branch:** feature/name → merged to main (PR #N)
**Tyler's prompt:** "[verbatim or close paraphrase of the instruction that kicked this off]"

**Shipped:**
- `path/to/file.ts` — [what it does]
- `path/to/other.ts` — [what it does]

**Decisions:** ADR-001
**Follow-up / tech debt created:** [Any items added to BACKLOG.md]

---

2026-09-20: Replaced false-success lead capture with honest manual inquiry. Durable storage, operator notification and delivered-email proof remain open.
