# Automated monitoring: product acceptance and release packet

Status: implementation candidate, November 12, 2026. This is an internal acceptance contract, not a new public offer, price, service level or refund policy. PR35's rejected merge is held; PR30/33, commerce/Auth source and the private store installation packet retain their owners.

## Buyer value and the smallest useful recurring product

A developer maintaining an MCP integration needs to know whether its recorded source disappeared, returned, or changed since the previous observation, and whether the evidence is recent enough to act on. The proposed deliverable is a saved watchlist with dated, attributable change reports and exact historical downloads. A report should answer “which of my sources changed, what evidence supports that, and what remains unknown?” without an operator preparing each customer's result.

The current collector observes source websites/repositories. It does not monitor an installed MCP server or a customer's workflow. A source HTTP 404/410 is a missing-at-check observation; a timeout, 401, TLS failure or rate limit remains inconclusive. Two observations do not establish continuous downtime, an outage duration or uptime. Changed complete-body hashes can include page chrome and are a reason to inspect a source, not a compatibility regression. Compatibility, tool behavior, security and publisher identity remain unassessed. The separate public declaration observer and its one RevenueCat 401 receipt do not supply those missing results.

No new recurring product, price, subscription, trial or commercial commitment is created by this change. The existing $49 offer is a one-time packet, its checkout is closed, and it cannot be counted as MRR. The target of $10,000 MRR requires verified recurring subscription revenue. Once a monthly price is separately approved, required active customers are `ceil(10000 / monthly_recurring_price)` before discounts, churn or tax; this is arithmetic, not observed demand or a forecast.

## Current implementation and this bounded release

Existing code already provides bounded public-source collection, body-free immutable receipts, source-to-listing relationships, explicit unknowns and an offline five-listing review queue. Exactly one actual collection receipt is committed: the October 4 manual run, with 120 source attempts (38 reachable, 77 missing at check, five unknown) and 465 unchecked sources. That receipt is historical, not fresh recurring monitoring. GitHub Actions remain disabled and this change does not dispatch or enable them.

The new `source_receipt_history.py` stage consumes explicitly supplied, independently verified receipt hashes and execution metadata. It generates a deterministic watchlist report across admitted receipts, distinguishes repeated cached evidence from a new check, keeps inconclusive attempts separate from successful observations, preserves unresolved findings, and links each change to the actual receipt and observation. Stable slugs retain distinct listing identity even when legacy IDs collide. A watchlist containing both Neon slugs must retain both relationships to the shared URL.

Its content-addressed bundle and recovery command provide an offline storage adapter: immutable JSON/Markdown, tamper rejection, replay-safe writes and exact-byte recovery in a fresh process. They are useful executable boundaries for a later production worker and object/receipt store. A cloud checkout's local filesystem is not an approved durable production store, customer inbox, tenant boundary or paid entitlement. The report remains review-required under the existing publication policy; external automatic delivery is not activated here.

## Acceptance cases for the report stage

Use no network or provider calls. Tests must construct synthetic multi-run receipts through the existing collector's report/schema functions, not assert invented live history. Run the committed actual receipt separately and preserve its real date and provenance.

| Case | Required result |
| --- | --- |
| Valid historical receipt | Correct full inventory, coverage denominator and explicit stale/unchecked evidence at a fixed as-of time; no invented change |
| Shuffled/duplicate receipts and selected slugs | Canonical identical output; distinct slugs retained, source URL deduplicated |
| Successful body changes after an unknown attempt | Change compares complete successful hashes; failed attempt remains visible and cannot clear last success |
| Reachable → missing → unknown → reachable | Dated missing/recovery signals with explicit evidence; unknown is not an outage or automatic recovery |
| Repeated cached receipt / HTTP 304 | No duplicate check or body-change event; dated 304 remains a new successful observation when actually collected |
| Conflicting observation, changed inventory or untrusted provenance | Reject the input before output; no historical reassignment or partial report |
| Missing/deleted previous success, earlier observations in newer receipt | Reject contradictory/regressing evidence rather than quietly claiming freshness |
| Repeated bundle write | Same identity and bytes; existing content cannot be overwritten |
| Recovery after process restart | Same original Markdown bytes and checksum; no rebuild from a changed catalog |
| Corruption, extra/missing files, symlink or unsafe output | Refuse recovery/publication without replacing source or existing bundles |

## Production path that needs no manual fulfillment

The target pipeline is: approved scheduled observation → validated immutable receipt → canonical watchlist report → transactional durable report identity → authenticated inbox/download. Delivery retries should reuse the same report identity; they must not rerun collection or charge the buyer again. A notification, if separately approved, points to the authenticated inbox and does not become the only copy. The inbox and report bytes must remain recoverable after worker restart and a fresh browser session.

Before activating this pipeline, replace per-report human approval with one reviewed deterministic subscriber-delivery policy for these narrowly attributed raw observations. Preserve separate review for public catalog, identity, capability and semantic changes. No operator should need to approve ordinary report generation or fulfill an individual customer's purchase.

| Gate / accountable owner | Exact evidence needed | Current status |
| --- | --- | --- |
| Report source / this lane | Adversarial offline tests, independent exact-source review, hash-preserving recovery, automatic Vercel build for repository composition | Candidate; executed results belong in the release receipt |
| Scheduler / runtime owner | Named already-approved runtime, permitted cadence/budget, two actual scheduled runs and missed-run recovery; no manual dispatch or future-time assumption | Unproved; Actions remain disabled; no replacement scheduler configured |
| Input provenance / monitoring owner | Independently read actual run/job/head/hash for every admitted receipt; prohibit customer-asserted metadata from authenticating origin | Historical receipt available; no newer live input claimed |
| Delivery policy / product owner | Approve automated private subscriber reports of raw dated observations; define stale/missed-run behavior and retention without a fabricated SLA | Existing publication policy is review-required; revision not activated |
| Durable store / existing shared-commerce owner | Approved isolated host, scoped schema/login, immutable receipt/report transactions, tenant isolation, quota and restart proof | Existing private SQL-transfer/installation/access holds preserved; no upload or SQL retry |
| Buyer identity / existing Auth owner | Authoritative verified customer identity and two controlled principals; fresh-session recovery and owner-B denial | Existing controlled signup/email and binding acceptance remain separate |
| Recurring offer / commercial owner | Exact approved product, monthly price, included watchlist/cadence, cancellation, support and refund/dispute policies | No recurring offer approved or implemented; one-time kit terms do not transfer |
| Recurring payments / existing commerce owner | Approved account/test context; subscription lifecycle and period-bound rights, exact product ownership, delayed/duplicate events, payment failure and cancellation | No subscription checkout or recurring entitlement in this candidate |
| Customer notifications / delivery owner | Explicit destination/data consent, approved sender/provider and bounded real delivery receipt | No send authorized or attempted; inbox is the intended recovery source |

## Payment → delivery → recovery → reversals

Run these only in a separately authorized named sandbox after the gates above. Keep a private receipt containing mode, exact account/product/customer/event/report identifiers and actual observed state; never publish customer data. Offline fixtures do not satisfy these steps.

1. **Purchase and delivery:** one approved subscription checkout succeeds; a genuine signed event grants only the verified owner/period/watchlist. One scheduled report commits atomically before an inbox reference is exposed. A crash between commit and acknowledgement retries to the same report, with no duplicate paid action or duplicate logical delivery.
2. **Fresh-session recovery:** restart the worker, discard the original return URL and browser state, sign in as the same verified buyer and recover the same report bytes. A second controlled buyer cannot list, enumerate or download them. A changed catalog cannot silently rebuild historical paid bytes.
3. **Renewal and failure:** actual sandbox renewal extends only the proper paid period. Delayed/out-of-order events cannot restore expired/revoked rights. Failed renewal, cancellation and grace-period behavior follow the separately approved policy; no policy is invented by the implementation.
4. **Refund/dispute/reversal:** use separately authorized sandbox cases for full/partial refunds, open/lost/won disputes and reversals. Verify future scheduled access and historical-download rights against the approved recurring policy, including a reversal that arrives before the paid event. Existing one-time-kit decisions do not automatically govern subscriptions. Downloaded files cannot be remotely revoked.
5. **Failure and recovery:** lose a delivery response after commit, exhaust a report run budget, miss a scheduled run, reject corrupt evidence and simulate a store outage. The buyer sees dated unknown/pending states, can recover committed reports, and is never told a failed check proved an MCP outage or asked to repurchase.
6. **Reconciliation:** reconcile actual recurring invoice/period amounts, successful refunds and disputes to the authoritative product/account. Separate fixtures, sandbox and live cash; separate one-time cash from MRR. No monitoring cash or MRR is evidenced today.

## Minimum blocker packet and rollback

Ask the responsible owners for one concrete packet: (a) approved runtime/cadence/resource budget with collection still bounded; (b) the already-owned eligible isolated store/Auth binding and specifically permitted installation/controlled-principal acceptance; (c) approved recurring product/price and lifecycle/refund rights; (d) a bounded sandbox payment/event/recovery/reversal test allowance; (e) the deterministic private-delivery policy and any separately permitted notification trial. Do not request broad credentials or substitute another product's database.

If a dependency is unavailable, retain this report engine and its fixtures as source readiness, keep intake closed, and name the missing row above. Rollback later disables the new scheduler/intake/delivery binding while preserving original report bytes and entitled recovery; it must not delete paid evidence. This candidate changes no existing collection, payment, provider, Auth, database, public catalog or affiliate configuration.


## Default-off workflow integration — November 12 continuation

The report stage is now connected to an internal `MonitoringWorker` through injected worker/owner identity, canonical watchlist, current recurring rights, source provenance and storage interfaces. Its production factory remains unconditionally absent. The existing kit-specific identity/store/entitlement code is untouched. A testing-only local adapter proves prepare-before-index, concurrent winner selection, crash/lost-response recovery, original-byte recovery in a fresh process and current-rights/owner denial around the real history engine. Fifteen focused workflow cases pass; fixtures are not actual Auth, subscription or hosted delivery acceptance.

See [MONITORING-WORKFLOW.md](MONITORING-WORKFLOW.md) for exact adapter signatures, real local artifact hash and the complete nonsecret runtime/store/Auth/recurring-offer/payment/private-delivery decision packet. A period identifies an immutable as-of history snapshot; historical events are not falsely labeled new for that interval. No scheduler, live input, SQL, credential, notification or payment was activated.
