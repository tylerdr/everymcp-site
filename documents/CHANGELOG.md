# Changelog

*Append-only, newest first. Never edit old entries.*

## 2026-10-03 — Apply the repository's shadcn UI requirement

Root review required the planner controls to follow AGENTS.md. The repository had no shadcn components or utility setup, so this focused addition introduces the official new-york Button and NativeSelect source, a cn utility, components.json, and theme tokens compatible with the existing Tailwind 3 stack. The planner uses NativeSelect/NativeSelectOption, the submit and copy actions use Button, and the starter handoff uses Button asChild around its semantic link.

The native GET form, required outcome, label association, option values, clipboard fallback, goal attribution and price are preserved. New planner surfaces use CSS variable colors. Five pinned direct dependencies add six resolved lock entries; all existing package resolutions are preserved. This does not initialize a new app, upgrade the framework, or change other site controls.

## 2026-10-03 — Carry reviewed selections through the whole paid packet

Independent review of the appended correction found that the paid matrix still used generic featured entries, including the old missing AWS source and duplicate Chroma records. Goal-specific packets now build both matrix rows and notes from the same reviewed recommendations as their brief. Legacy purchases without a goal use the reviewed research and software starting points, deduplicated by server ID. Invalid goals retain the same generic fallback.

The actual-catalog test now parses every paid matrix and its notes, checks the exact intended distinct sources, and rejects any other GitHub source emitted anywhere in each goal packet or the legacy packet. All emitted sources are drawn from the ten publisher URLs already checked during this release review. Price, paid-session metadata ownership, checkout and provider gates are unchanged.

## 2026-10-03 — Make the existing planner's recommendations usable

**Branch:** existing `feature/growth-stack-planner-20260923`, PR #13; correction based on reviewed head `0fe75917241907adbb3a89ede59ab863548b291c`.

The exact-head preview rendered all five plans, but the prior category-first choices linked to four missing source pages and an archived Mem0 wrapper. This correction chooses existing catalog IDs for the actual task: search/read/remember; repository/files/docs; recurring engineering checks; DuckDB/Grafana/reference data; and memory/files/document retrieval. It updates the selected Brave, Context7 and MotherDuck source URLs and preserves the rest of the catalog.

Copied briefs now use absolute EveryMCP listing links. Paid packets describe the selected goal applied to the current catalog; they do not claim a purchase-time snapshot. The existing verification script now executes the real catalog for every goal, protects the ten canonical selected publisher URLs and portable links, and retains the paid-session metadata/legacy/error behavior checks.

No new checkout, price, payment activation, audit-MCP activation, external installation, customer message or spend is part of this correction. Merge remains root-owned after current-head review.

## 2026-09-23 — Make Stack Planner output portable (Tai growth continuation)

**Branch:** `feature/growth-stack-planner-20260923` → draft PR #13

**Shipped on branch:**
- `lib/stack-planner.ts` — one catalog-backed `buildStackBrief()` output with the selected servers, roles, EveryMCP listing paths, source repositories, and the same three-step integration sequence shown on the page.
- `components/StackPlanTracking.tsx` — copy-to-clipboard activation plus `stack_plan_brief_copied` analytics event.
- `app/plan/page.tsx` — portable-brief handoff so the buyer can carry the useful result into a coding agent, implementation ticket, or team notes before the paid ask.
- `scripts/verify-stack-planner.mjs` — build-gated contract now protects portable brief generation, clipboard handoff, and activation instrumentation in addition to the existing paid-intent path.

**Commercial purpose:** increase real activation between `stack_plan_generated` and the existing $49 Starter Kit by making the free result useful outside the site instead of forcing the buyer to keep the browser tab open. Copied briefs are an activation signal, not revenue.
**Boundary:** no new checkout, subscription, outbound, payment activation, customer contact, spend, or production promotion.

## 2026-09-23 — Add a value-first MCP Stack Planner (Tai growth session)

**Branch:** `feature/growth-stack-planner-20260923` from `074e11b911d7201b2188a3fc4860d943374ec781` → draft PR pending
**Tyler's prompt:** Growth and customer value first; every substantive run must complete or meaningfully advance a measurable growth/product deliverable.

**Shipped on branch:**
- `app/plan/page.tsx`, `lib/stack-planner.ts` — no-account outcome picker that maps five buyer jobs to three real catalog-backed MCP capability slots, explains the role of each selected server, and gives the buyer a concrete three-step integration sequence.
- `components/StackPlanTracking.tsx` — `stack_plan_generated` value event plus `stack_plan_starter_kit_clicked` paid-intent event with goal/source attribution into the existing $49 offer.
- `app/page.tsx`, `app/sitemap.ts` — homepage acquisition links and indexation for the planner.
- `scripts/verify-stack-planner.mjs`, `package.json` — release-gated contract covering the goal set, catalog-backed selection, value/intent events, paid handoff, homepage entry point, and sitemap.

**Experiment:** First 50 completed plans or 14 days after approved release, $0 incremental spend. Primary metric is starter-kit handoff clicks / generated plans. Keep/expand at >=10%, improve handoff at 5–10%, and below 5% validate traffic/instrumentation then revisit ICP/value framing before building more.
**Boundary:** Existing Stripe, starter-kit fulfillment, audit-MCP gating, services, and sponsorship economics are unchanged. No merge, production promotion, outbound, spend, payment activation, or customer contact is part of this branch.

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

**Shipped on branch:**
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

## 2026-10-04 — Dated source evidence and enterprise inquiry correction

**Branch:** `feature/traffic-page-source-evidence` from main `d60fbeafa21685d9c170324e076ad78dc1bf8caf`.

Corrected only the Redash, RevenueCat, iCloud, Heap and Hotjar catalog records; all 616 IDs, names and slugs remain stable and the other 611 records are unchanged. Added dated public GET observations and distinct publisher/community reference links. Metadata no longer claims unsupported source capabilities or community publisher identity. iCloud's alternative is explicitly archived/read-only; Heap's alternative documents write/destructive tools and unauthenticated HTTP transport.

Detail pages link to the existing free planner with an explicit inclusion/compatibility boundary. Pricing removes the fixed human implementation tier and unsupported “Most popular” marker; services and associated promotions now offer an unpriced enterprise consulting inquiry through the existing form destination. The $49 kit, checkout gates, provider configuration and dormant manual-product guards are unchanged.

**Validation:** Source GETs on October 4 returned 404 for five indexed repositories and 200 for seven distinct reference URLs. Tests, lint, typecheck, 753-page build, independent review, responsive browser checks and exact-head preview/production verification passed before release. No MCP tool, checkout, lead form, credential/configuration or paid model was invoked or changed.

## 2026-10-04 — Source observation foundation
- The earlier evidence/copy slice is merged as PR #15 at `5028a91aac22e531c05476873f36cb8224ebf93f`. Exact production deployment `dpl_129LVV11FEqXmATRvYfCpPBHDeEv` is READY with everymcp.com aliases; five-page/nine-route production readback and 616 sitemap paths pass.
- Added full-catalog inventory, deduplicated source relationships, bounded public GET/robots policy, conditional/hash caching, separate attempt/success dates, immutable sanitized receipts, pinned report schema/validator, and review-only publication policy.
- Added trusted-main daily workflow on the existing public standard runner with contents read-only. No credentials, providers, tool execution, automatic catalog edits, quality score or badge.
- Preserved pre-existing Neon ID collision as a review finding. Verified the received research archive and eight manifest files; its executable-use flag remains false.
- Seventeen Python policy/fixture tests and whole-catalog dry-run/schema validation pass. Final local smoke: 20 source attempts plus five robots requests, ten reachable/eight dated missing/two unknown, 565 not checked. Application/catalog files are unchanged from the merged correction. Independent re-review and exact-head CI/hosted build passed before PR #16 release; the first scheduled receipt remains a separate gate.

2026-10-04: Source-monitor foundation PR #16 merged at a3f2affc5a8e354428ecc66ed11c33ea1ec4dca8 after independent review, exact-head fixtures/CI, lint/types/tests and 753-page build. Matching production deployment dpl_5fCyoJisw9BeVNNmHnmzEp7UMgUc is READY; nine public routes and all 616 catalog sitemap paths read back at 22:39:09 UTC. Workflow registration is active; actual scheduled receipt remains pending.
2026-10-04: Actual GitHub runner execution 37240814694 succeeded (workflow_dispatch, a3f2aff). Hashed/schema-validated immutable receipt covers 120 source attempts: 38 reachable, 77 missing at check, five unknown and 465 unchecked; no publication or scoring. SHA-256 2196cc1d41678e4ac23cda41751bfb5eceb6a2c114dc6a6a53ebda070c87d347. Scheduled due-run verification remains separate.

## 2026-10-04 — Offline receipt import and five-page evidence review (implementation; release pending)

**Branch:** `feature/source-receipt-review-queue`, based on main `80edfe403313ca17e63d9cf7a66b8cdd097d5b56`; parent coordinates draft review and release.

- Added a deterministic offline importer for saved receipts or observe-log marker pairs. Requires an independent canonical hash/head and verified run/job metadata; validates pinned schema, exact inventory relations, chronology, summaries, trusted execution limits and immutable output protection.
- Preserved the complete actual manual receipt/execution metadata and a five-listing, 12-source JSON/Markdown review snapshot with original citations, curated cautions, explicit as-of freshness, last attempt/success and unresolved findings.
- Added 14 importer fixtures alongside the unchanged 17 collector fixtures, plus PR-only replay checks. Collection cadence, budgets and trusted-main cache behavior are unchanged.
- Direct independent SHA/schema/623-relation cross-check and public/collector byte comparison passed. All 31 Python tests, whole-catalog dry run, app tests, lint, standalone typecheck and 753-page production build pass. Current production baseline at 2026-10-04T23:26:37Z verifies nine routes/canonicals, all 616 listing sitemap URLs, existing source dates/reference links, free planner and commerce holds. This is pre-release readback, not a deployment receipt for this feature.

**Decision:** ADR-010. No public data, app, collector, report schema, price, payment/provider gate, credential, database or scoring change. Independent human/parent PR review and exact-head hosted/production acceptance remain required. First scheduled due-run proof remains separate. The Mac venture workspace is absent in cloud; the four-bullet status is preserved in `documents/VENTURE-STATUS.md` for the parent to synchronize.

## 2026-10-04 — PR18 normal release and exact production acceptance

- An additional separate read-only agent reviewed exact head `b8630a5c2b854df3d77581257959876919ae7cc1` and found no blocking findings. It independently authenticated actual GitHub run/job/log/hash provenance, reconstructed 623 relationships, checked all 12 queue pointers/citations/notes and reviewed stale/failed semantics, deterministic replay, immutable output protections and null assessments. Ten focused read-only tests and independent hosted-log checks passed.
- Under the supplied explicit user authority for EveryMCP/Tai ventures, PR18 was marked ready and merged through normal GitHub squash merge with the exact expected head: `df42cc3f0cf04e57fd24e7d6876a5421011c5aad`, 23:48:24 UTC. No protection bypass, CI reruns, credentials/configuration, public data or provider/commerce changes.
- Production `dpl_4wtx12GxUnUMCVSKraLqNvhxiPFK` is READY for that exact main SHA and `everymcp.com` resolves to the matching deployment. Hosted logs confirm app tests, successful compilation, 753 pages and completed deployment.
- Post-release readback passed at `2026-10-04T23:50:22Z`: nine routes/canonicals, exactly 616 sitemap listing URLs, original curated source notes/dates/references, free planner, closed checkout, unpriced consulting and setup-pending audit/provider holds. Released receipt/JSON/Markdown queue replay byte-for-byte with review-required publication and all assessments null/disabled.
- Preserve the independent review and production acceptance in the separate release-handoff branch. Scheduled due-run proof was not assessed or inferred from manual observations; any public-note refresh remains separately reviewed. The Mac venture STATUS path remains unavailable, with a four-bullet cloud copy for parent synchronization.

## 2026-10-05 — Draft public discovery declarations (cloud, unreleased)

- Added separate modern/legacy HTTP declaration profiles, official schema provenance/licensing and a bounded owned-loopback fixture runner. Tool/schema/auth/Apps metadata remains unverified declaration evidence; no live or execution path, private runtime, model spend, cache reuse, public refresh, score or badge.
- Nineteen adversarial discovery tests and 24 synthetic scenarios/52 local requests pass; all 31 source regressions, zero-request dry run, npm tests/lint/typecheck/753-page build pass. Independent official artifact reconstruction matches hashes/local closures. New PR-only CI checks fixtures and old source regressions.
- Added display/join semantics, explicit unknowns, simulated timestamps, body hashes/pointers and future live SSRF/DNS/TLS/redirect/size/time/auth/cache/publication review gates. Library ZIP metadata resolves, but prescribed transfer failed; archive/member contents are unavailable and not executable policy.
- Preserved PR18 release/review receipts and unchanged public data/app/collector/importer/dependencies/commerce holds. Draft review only; no production release or scheduler-proof claim.

## 2026-10-05 — PR19 release and disabled publisher-endpoint review

- Reviewed PR19 merged normally, exact-head constrained, as main `a0320ef98efbc4df2478bb9180dab94da1f33024`. READY production `dpl_8FMUnPpVURsMGDLPAkr5NCfZ6XbX` and nine-route/616-sitemap/date/reference/free-planner/commerce/provider readback passed at `2026-10-05T00:59:37Z`; durable release proof is committed here. No public MCP traffic was authorized by that release.
- Prepared a separate disabled fixed RevenueCat endpoint plan, with exact publisher/listing attribution and four explicitly unknown priority endpoints; reconciled current official modern/legacy protocol docs. Added direct pinned HTTPS transport and private candidate-receipt replay, plus read-only PR fixture checks.
- Corrected independently reproduced global safety-halt/reason/header/storage, wire/time evidence and cancellation findings. Native DNS is cancellable in an owned subprocess, schema cancellation propagates, and complete public semantic errors are replayable. Twenty-two endpoint methods plus existing19 discovery/31 source regressions and app tests/lint/types/753-page build pass locally. Final exact-head independent and hosted review remains required.
- Parent exact endpoint/head/plan/method/bounds approval and a compatible authorized TLS/egress environment are required before any live run; gate remains false. No tools/auth/model/spend/cache/publication/score or public catalog/commerce/provider change. Scheduled proof remains separate.

## 2026-10-05 — PR20 disabled release and approved one-use control preparation

- PR20 exact independent/hosted accepted head 5a99a2ca merged normally as 0d5aed17; READY production/domain dpl_FDeYhZhScJh4D3H9e8r4TWrQ35nP and nine-route/616-sitemap/evidence/free-planner/commerce/provider regression passed 2026-10-05T02:35:48Z. Committed source gate/plan remain disabled/unchanged.
- Parent explicitly approved one bounded anonymous RevenueCat declaration proof at plan b2f2f102. Prepared a separate manual-only public standard-runner control with exact clean frozen source provenance, normal TLS refusal, unfiltered first-run admission, private exclusive claim and sanitized log summary. No live MCP request occurred during preparation; independent exact-head and hosted control acceptance precede execution. Thirteen offline control methods pass; no paid runner/secrets/auth/tools/models/publication/score change.

## 2026-10-05 — One approved anonymous RevenueCat proof and PR21 production acceptance

- Independently accepted exact control PR21 head c775526a / tree 2a718580 with 85 hosted Python methods/normal TLS preflight/agent docs/READY preview and local app/lint/types753-page build; normally merged as a01c9daa. Exact READY production/domain dpl_TvVzHJxRyS19U7aKbi3JpF54bGFi and nine-route/616-sitemap/evidence/free-planner/commerce/provider holds passed 2026-10-05T02:47:25Z.
- One explicit parent-approved dispatch37256631159/job 111594998429 succeeded: one anonymous server/discover POST →401/Bearer at 02:45:30Z,317 ms,812 wire/788 header/zero captured body bytes; every remaining request skipped. Auth body unparsed/unretained/unhashed, digest null; prefetched24 octets counted. No credentials/retry/redirect/tool/model/paid spend/publication/score change. Approval/admission consumed; no rerun or history deletion.
- Preserved authentic canonical sanitized summary SHA 02567fd969799ebdda03f9258f69c940cacdc85748a38a492164072f4e120a83, exact frozen-source/control/Actions provenance, safe header/request/private receipt hashes and independent-verification limits. Evidence-only draft prepares durable proof/handoff, without changing public notes or endpoint/capability grades.
