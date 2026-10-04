# EveryMCP handoff — 2026-10-04, cloud receipt import

## Ownership and release state

- Canonical repository `tylerdr/everymcp-site`; cloud checkout `/workspace/everymcp-site`, branch `feature/source-receipt-review-queue`, based on main `80edfe403313ca17e63d9cf7a66b8cdd097d5b56`. Authorized GitHub identity is `tylerdr`, repository push/admin access verified, origin matches. No open PR existed before this slice. Praxium repositories were not edited.
- PR #15 source corrections (`5028a91`), PR #16 collector (`a3f2aff`) and PR #17 release receipt (`80edfe4`) are already on main. This new importer/queue is ready for draft review; parent owns independent review, merge and production revalidation. Do not merge from this cloud task.
- This slice changes Python import tooling, fixtures, PR verification paths and internal documents only. Catalog, public evidence, app, collector, pinned report schema, dependency lockfile and commerce/provider gates are byte-identical to main.

## Implemented deliverable

- `scripts/import_source_receipt.py` imports one saved JSON report or observe-log JSON/hash marker pair. It is offline and requires a verified expected canonical SHA-256, exact execution head, canonical trusted-main run/observe-job metadata and explicit `--as-of` timestamp.
- Validates pinned report schema and null assessments, exact current inventory/URL-to-listing roles, last-attempt/success/finding chronology, actual cohort counts and trusted workflow limits. Duplicate/truncated/contradictory inputs, changed identity maps, wrong branch/event/run/job/head, unsafe output destinations and immutable collisions fail closed.
- Emits content-addressed immutable body-free receipt/execution/JSON/Markdown bundles under `tmp/source-monitor/imports`. No importer or CI public data write, collection, cache restore, model call, tool execution or automatic publication.
- Durable [five-page review snapshot](source-monitor-reviews/2026-10-04-manual/queue.md) has RevenueCat, Redash, iCloud, Heap and Hotjar, 12 exact URL relationships, source citations, report JSON pointers, original curated notes/dates/roles, explicit current/stale/unchecked freshness, unknown/missing/reachable state, failure reason, last success and unresolved findings. Every listing remains review-required.
- All 12 were attempted in the recorded run: five historical indexed repositories returned 404; seven separate references returned 200. Availability agrees with the public notes at this check, with later attempt dates. This is a review candidate, not justification to change capability/identity/maintenance claims. Retain iCloud archive and Heap ingestion/deletion/localhost cautions.

## Verified receipt and inventory

- Actual run [37240814694](https://github.com/tylerdr/everymcp-site/actions/runs/37240814694), `workflow_dispatch`, `main`, successful at exact head `a3f2affc5a8e354428ecc66ed11c33ea1ec4dca8`; successful observe job [111549047496](https://github.com/tylerdr/everymcp-site/actions/runs/37240814694/job/111549047496). Retrieved run/job metadata and job logs through authorized GitHub reads.
- Receipt generated `2026-10-04T22:41:27Z`; compact sorted JSON plus newline SHA-256 `2196cc1d41678e4ac23cda41751bfb5eceb6a2c114dc6a6a53ebda070c87d347`. Pinned schema and hash independently match. Hash verifies integrity, not origin authentication by itself.
- Actual cohort: 120 source attempts + five robots reads = 125 requests; 38 reachable, 77 missing at check, five unknown, 465 unchecked. No complete coverage claim. Queue snapshot freshness uses explicit `2026-10-04T23:15:00Z`; it is not a live freshness statement at later dates.
- Preserve 616 routes, 615 distinct legacy IDs, 578 indexed normalized URLs plus seven distinct curated references = 585 unique URLs, 623 exact URL/role/listing relations. Both `neon-mcp-server` and `neon-mcp` retain the legacy `neon-mcp` ID and unresolved duplicate-ID finding.
- Existing collector limits remain 120 attempts + up to six robots requests, sequential one-second host pacing or stricter declared policy, eight-second complete fetch deadline, 20-minute collector and 25-minute job. HTTPS allowlist, DNS public-address check, pinned TLS, robots refusal, no redirects/auth/tool calls, bounded bodies/cache and immutable runs remain unchanged.

## Validation and release acceptance

- Thirty-one Python fixtures pass (17 collector + 14 importer), including canonical replay, log ambiguity, altered hash/schema/provenance/relationships, stale/unchecked/blocked reads, retained success/findings, recovery, output/symlink protections and midnight calendar transitions. Whole-catalog dry run/schema validation passes with zero requests.
- Direct independent cross-check without importing the new importer passed: saved receipt SHA, schema with format checks, all 623 URL/role/listing relationships, 616 listing routes, 585 sources, cohort counts, all queue pointers and original public/collector file bytes.
- `npm test`, `npm run lint`, `npx --no-install tsc --noEmit`, `npm run build` and whitespace checks pass; 753 pages build. Local pinned Python environment is `tmp/source-monitor/venv`; npm cache uses `/tmp/everymcp-npm-cache` because the default cloud home cache is not writable. No dependency or lockfile edits.
- Current production baseline readback at `2026-10-04T23:26:37Z`: five corrected listings plus `/pricing`, `/services`, `/plan`, `/mcp/filesystem` return 200 with matching canonicals; all 616 listing URLs appear in sitemap. Original dated source notes/references, free planner and closed-payment/unpriced-consulting behavior remain intact. See `source-monitor-reviews/production-baseline-2026-10-04.json`. This feature has not been merged/deployed.
- Recommendation: approve the bounded importer/queue after parent independent review and exact-head Source observations `verify`, agent-doc and hosted build acceptance. PR collection job must stay skipped. Then parent may merge under existing user authority and verify READY production deployment for the resulting commit, the same nine routes/canonicals, 616 sitemap URLs, existing public evidence dates/reference links and commerce holds. No public-note publication accompanies this merge.
- A first successful **scheduled** due-run receipt remains separate and parent-owned. A manual import, manual success or passing PR job is not scheduler proof. No schedule claim was added in this task.

## Pick-up instructions and boundaries

1. Review importer, fixtures and the five-page queue; reproduce the committed snapshot using the command in `SOURCE-MONITOR.md`. For a new receipt, verify actual canonical run/job/head/hash before importing. Inventory mismatches require explicit historical relation review.
2. Review source identity/content and dates before proposing a separate public evidence refresh. Unknown reads stay inconclusive; prior success/findings survive failures, recovery and expiry. A newer 200 does not clear maintenance warnings or grant a capability pass.
3. Keep research-driven discovery/evaluation in T017: executable, versioned clauses, actor/transport applicability and adversarial validation before grades. Scores, badges and applicable denominators remain null; Jev/paid models and automatic publication remain disabled. The MCP 2026-07-28 contract needs its own version-specific discovery work.
4. Preserve the reviewed `2026-10-04-r2` research bundle's `readyForExecutableUse=false` boundary. Previous local archive SHA `017d4ca4b784975bf5b8f926d908e6cf94ca2be86b1d705e73945231eeb1f25e` and eight file hashes were Mac-verified; the archive is not present in this cloud checkout and was not revalidated here. Gateway/Jev licensing, tenant/catalog/SDK and paid-default concerns remain unresolved.
5. Keep existing Stripe/provider/audit activation, security/rate-limit, database, no-credential/no-paid-spend and no-outbound-notification boundaries. Checkout remains closed pending existing payment verification; lead fulfillment and GSC growth attribution are separate work. No probability becomes factual confidence.

The Mac venture workspace `~/openclaw/workspace/workspace-ventures/ai-ventures/ventures/everymcp.com/STATUS.md` is absent here. Four status bullets are preserved in `documents/VENTURE-STATUS.md` for parent synchronization; this does not block the draft PR.
