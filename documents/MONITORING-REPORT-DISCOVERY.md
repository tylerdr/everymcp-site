# Owned report discovery — source continuation, November 19, 2026

The owner recovery handler required an opaque report job ID. Losing the original link meant the owner could not discover a report in a fresh session, despite intact stored bytes. This change adds authenticated, bounded discovery through the existing owned handler, control adapter and recovery implementation. It does not bind a hosted route or activate monitoring.

## Customer workflow

`createOwnedMonitoringHandlers().GETReports` starts with no cursor. Current owner identity comes from the established authentication adapter, never a client owner/paid/price/URL field. `after` is the only accepted query parameter. It must identify a canonical job owned by that authenticated owner in the configured scope; missing and foreign continuations return the same generic 404.

The actual control adapter reads one owned canonical job plus one lookahead, ordered by job ID with explicit C collation. It verifies the ordinary role/scope/fingerprint guards, canonical record hashes, columns, writer identity and ownership for both rows. It consumes only the first row and returns that row's ID as continuation only when a second row exists. It never skips a candidate to make a page appear full.

A report candidate goes through the existing recovery implementation before any report metadata is returned. That path verifies current owner, original watchlist/job binding, fresh recurring rights twice, original receipt/signatures, exact length and digest. The response contains only the recovered job ID, historical watchlist version/slugs, period bounds, byte length and SHA256. It has no provider identifiers, report body, source excerpts or caller-selected authority. An actual download must use recovery again and recheck rights; discovery does not grant future access.

Captures, uncompleted report plans and rights-denied originals yield `no_recoverable_report_on_this_page`, with continuation when applicable. This is not a claim that all history is empty or deleted. Unknown rights, storage failure or integrity failure return 503 for the page; they are not silently omitted. Responses remain private/no-store and reject explicit cross-origin/cross-site contexts.

Discovery does not depend on today's catalog or the current watchlist head. A paused or edited watchlist therefore does not hide an older original that still passes the existing recovery policy. No collection, regeneration, subscription enrollment, database mutation or delivery message occurs.

## Bounds and limitations

- At most two canonical records, each at most 65,536 bytes, are returned by the index query; at most one existing recovery call is made per page. This is intentionally a small pagination primitive, not a complete report-library UI.
- A recovery can perform two existing rights evaluations: up to 48 fictional/real provider GETs and 40 seconds of provider deadlines, plus authentication and database work. No new 30-second page guarantee or production performance claim is made. Hosted invocation budgets/rate limits remain an activation requirement.
- LIMIT 2 bounds returned rows, not scanned rows. Existing five-second statement/lock timeouts remain; native query/index performance is unverified. No index, schema, grant, installation fingerprint or SQL proposal was changed.
- Hash order is stable but not chronological. New jobs whose hashes sort before an already-consumed cursor require restarting from the first page. A page is not a point-in-time snapshot of all reports, and no total count is asserted.
- The continuation discloses one opaque **owned** canonical-job navigation handle even when its report is missing or inaccessible. Dates, slugs, hashes and original bytes remain withheld unless recovery succeeds. No other owner's cursor is admitted.
- The current-paid-subscription recovery proposal remains unchanged and disabled. No alternative cancellation/retention policy, price, perpetual recovery promise or report expiry was chosen.

## Source and acceptance

Owned source: `control-contract.ts`, `control-postgres.ts`, `owned-workflow.ts`, `owned-handlers.ts`. Tests: `monitoring-report-discovery.test.ts`, fictional control protocol fixture and separate public-key-only `discovery-recover-process.test.ts`. The initial lost-link regression failed on unchanged 80bab673 because GETReports did not exist. The new fixture exercises actual owner authentication, control/recovery adapters, installed billing SDK with fictional no-socket responses, signed report code and loopback documents. It never contacts a real source or provider.

The fresh-process case receives only expected report digest/length, **no saved job ID**. It uses recovery-only adapters and public verification keys, a new fictional Auth session and renewed fictional subscription; it discovers the old-version original after a pause and downloads identical bytes. No collector, producer token/private signing key, current inventory or write operation is available in that process. This demonstrates source behavior with fictional storage responses, not PostgreSQL durability, real renewal or hosted delivery.

Native/hosted acceptance is still UNRUN. The earlier read-only UID-map failure remains a no-retry/no-alternative-runner hold. Existing Python/GitHub, Node/service receipt and report versions, frozen compatibility gate/contract and Memory admission source remain unchanged. Exact check counts, reviewed commit and automatic Vercel Preview are reported with publication; READY is a build result, not monitoring activation.

## Handoff and revenue boundary

Parent direction: resume the existing EveryMCP lane, prioritize paid monitoring value with a genuine owner workflow, complete one already-authorized step and publish meaningful reviewed work as a draft without merge. Shared handoff/changelog/backlog/prompt/venture files overlap reserved PR30/33/35, so this narrow document records the session without changing those files or writing outside the cloud workspace.

At reconciliation: main 242f1450 remains production; PR36 was draft 80bab673; PR30/33/35 retain their reserved heads. The public offer is a $49 one-time Integration Starter Kit with checkout closed, not a monitoring subscription. No actual customer, payment collection or recurring MRR was inspected or established.

Before a monitoring buyer can pay and receive service: the responsible owner must select the recurring product/price and generation/recovery/reversal policy; approve the exact existing-stack Auth/control/custody/enrollment/producer targets; resolve native acceptance without bypassing its restriction; then permit binding, controlled source periods and authentic sandbox payment→delivery→fresh-session discovery/recovery→reversal acceptance. The Memory prospective source additionally needs its unresolved historical-evidence custody and exact-byte reviewed provenance path; source hashes/license labels do not automate that review. No manual staffing commitment is introduced. This change closes lost-link discovery only.

New fictional functional cases allow 30 seconds each, with 90 seconds for the fresh-process parent and 60 seconds for its child. These are harness scheduling budgets, not production deadlines. Early runs had a corrected test-only syntax error and shifting 5/15-second timeouts; scheduling contention is suspected, not measured. An unchanged legacy recovery case passed separately in 6.52 seconds under its original 15-second limit. No runtime or legacy deadline was increased. Final new-suite, typecheck, lint and Preview outcomes accompany the release receipt.

Final local checks: the complete new suite passed 7/7 in one run (13.11 seconds total), including its separate-process child acceptance. TypeScript and repository lint passed. Four existing suites passed together (14 tests); the existing owned-workflow suite passed 9/10 in a sequential run and its timed-out case passed separately under the unchanged limit. These are separate runs, not a claimed single all-green combined run. Independent design/source review found no blocker. The narrow receipt preserves initial failures and exact source hashes.
