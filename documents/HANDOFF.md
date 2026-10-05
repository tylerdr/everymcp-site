# EveryMCP handoff — 2026-10-05, public discovery draft

## Ownership and release state

- Canonical repository `tylerdr/everymcp-site`; active worktree `/workspace/everymcp-discovery`, branch `feature/public-discovery-contract`. Authorized GitHub `tylerdr`, push/admin permission and HTTPS origin were rechecked; no open PR existed when this slice began. No Praxium, Amble or Sprinter files were edited.
- Main remains PR18 release `df42cc3f0cf04e57fd24e7d6876a5421011c5aad`. Its independent review, READY domain deployment `dpl_4wtx12GxUnUMCVSKraLqNvhxiPFK` and nine-route/616-sitemap/commerce/provider acceptance at `2026-10-04T23:50:22Z` are preserved in [release receipt](source-monitor-reviews/pr18-production-release-2026-10-04.json) and [review](independent-review-pr18.md). Historical release proof documents from branch `chore/source-receipt-release-handoff` (`8dd56f6`) are incorporated into this feature branch.
- This discovery slice remains a draft, unreleased. User explicitly requires risk/acceptance review before release. Independent exact-head testing and hosted results belong in the draft PR review record; these handoff assertions are local acceptance only.

## Implemented bounded scope

- [PUBLIC-DISCOVERY.md](PUBLIC-DISCOVERY.md) defines self-declared evidence and future listing display/join requirements. [profiles.json](public-discovery/profiles.json) cites exact clauses for MCP 2026-07-28 per-request Streamable HTTP discovery and separate 2025-11-25 initialization/optional-session fixtures.
- `scripts/discovery_contract.py` normalizes bounded untrusted declarations offline; `scripts/run_discovery_fixtures.py` creates/owns its loopback listener. No URL/live/auth/registration/installation flag, SDK/gateway/model provider, tool call, resource content or Apps execution exists in this path.
- Actual official declaration schemas at commit `75db1e987cbbba6d170315dc99d0dfc440754aef` were retrieved, hashed and reduced to their complete local definition closures; an independent fresh-fetch reconstruction matched all definitions and hashes. Original licensing and derivation are recorded. Apps metadata interpretation is stable 2026-01-26 at ext-apps `82221c0c8ce7661efa6771c9d461511b1650495f`, not draft runtime adoption.
- Receipts distinguish selected version/transport/actor, simulated fixture timestamps, complete response hashes/pointers, capabilities/identity, tool/schema/annotations, public auth challenge hints, UI references and optional listed resource declarations. Fixture attribution cannot be bound to a real listing. Partial observed declarations survive unknown later pages, with no complete count. HTTP errors are inconclusive observer outcomes.
- Every assessment remains null/unknown; publication is review-required/ineligible. No score, badge, automatic publication, factual-confidence probability or applicability denominator was implemented. No cache reuse or credential handling occurs. Before any live probe, exact endpoint authority, HTTPS/DNS/TLS pinning/peer checks, redirects, budgets, auth/cache partition and publication rules need a separately reviewed revision.

## Evidence and validation

- Seventeen new adversarial test methods pass across 23 committed synthetic scenarios (48 owned loopback requests): modern JSON/SSE/multiple pages, legacy assigned/no session, auth challenges, partial lists, duplicates/limits, unsupported versions/transports, redirects, schema references/dialects, finite/duplicate JSON and whole-operation trickle deadlines. Source regression tests also pass: 17 collector + 14 importer. Existing importer fixture needs ignored `tmp/source-monitor` created first; new CI includes this setup, with no old code change.
- Full deterministic fixture receipt SHA `0965e25945a8c8b53dd714b12dedc3189aa0e68f8d8e5fb0701f70fa9e5ddad2`, fixture manifest SHA `07b5f97675a4c631b091ce6431843385bb37f5f7f4db565552834e9d45c3f284`. [Acceptance summary](public-discovery/fixture-acceptance.json) and four labeled example receipts are committed. Timestamp is simulated `2026-10-05T00:00:00Z`; it is not a live check date. Models/calls/spend are zero for this slice.
- `npm test`, lint, typecheck and 753-page build pass locally. Whole-catalog source dry run makes zero requests. App/lib/public/data, both existing collector/importer scripts and tests, source report schema/workflow, dependency manifests and commerce/provider gates have no diff from main. Preserve 616 routes, 615 distinct legacy IDs, 585 URLs and 623 exact source/listing relations.
- New `.github/workflows/discovery-fixtures.yml` is PR-only/read-only, with the existing pinned validator. It runs local discovery fixtures and old regression/dry checks. It has no scheduled or live observation job, cache restore, secrets, public write, artifact upload or model calls.

## Research access limitation

Library ID `libfile_9ff75c82414c8191a49dc3b4777ce0c1` resolves the expected version 0 / 33,036-byte research ZIP. The prescribed Library helper failed to download twice; text read reports no readable ZIP content. The expected archive SHA `017d4ca4b784975bf5b8f926d908e6cf94ca2be86b1d705e73945231eeb1f25e` and eight member files were not revalidated/read here. Preserve `readyForExecutableUse=false`. No actual packed shared contract is available, no private gateway/Jev runtime is copied, and no research content is asserted as executable truth. This optional research-access limitation does not prevent independently sourced local fixtures.

## Pick-up and release acceptance

1. Review the draft PR at its exact final head, reconstruct the official artifacts and fixture receipts independently, and inspect the explicit future live-risk gate table. Keep draft/unreleased until reviewed risk and acceptance. Passing local fixtures never authorizes live probing or grading.
2. Require exact-head hosted discovery fixture CI, source regressions/dry-run, agent docs and READY preview. No protection bypass or manual CI reruns. If a protection/action is denied, report the denial.
3. For a later authorized merge, revalidate the resulting READY production commit/domain, the five priority listings and original dated source notes/reference links, `/pricing`, `/services`, `/plan`, `/mcp/filesystem`, exact canonicals, all 616 listing sitemap URLs, free planner, closed $49 checkout, unpriced consulting and existing provider/security holds. Do not publish fixture claims to listings.
4. Scheduled due-run proof remains separately parent-owned T016. Source-note refresh is T019. Tool/schema semantic evaluation, Jev rules/licensing/cost, grades/badges, buyer applicability and endpoint attribution/live probe review remain separate work.

The Mac venture STATUS.md path is unavailable here. Four current bullets are in `documents/VENTURE-STATUS.md` for parent synchronization. No second release was performed.
