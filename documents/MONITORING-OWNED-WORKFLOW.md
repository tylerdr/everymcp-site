# Owned monitoring workflow — unbound source candidate

This continuation joins watchlist configuration, canonical jobs, fresh recurring rights and signed report recovery. It does not activate a route/factory, create an enrollment or offer, choose a price, configure a provider or establish payment readiness.

## Implemented customer path

1. An eligible current user configures their single owned watchlist through the actual handler factory. The body accepts only stable catalog slugs, enabled state, expected version and mutation UUID. Owner identity comes from the existing current-user adapter. Same-origin mutation checks, strict bounded JSON, private/no-store responses and server-derived identity prevent client owner, URL, price or paid-flag authority.
2. The server resolves every selected slug and all its canonical sources. It rejects missing sources, more than two total URLs and multiple hosts; it never silently drops references. A private PostgreSQL adapter persists an immutable version plus a compare-and-swap head. Ownership cannot be reassigned. The original mutation is looked up before today's catalog, so exact retries survive catalog drift; reused UUID with different input and stale updates conflict.
3. Only protected owner↔customer↔subscription enrollment can confer eligibility. Runtime roles cannot write that binding. The real installed Stripe SDK performs bounded fresh GETs to verify account, mode, customer, exact recurring product/price and paid invoice/line/payment/charge relationships. Metadata, matching email, a one-time kit purchase or client identifiers cannot enroll an owner.
4. The server selects a deterministic bounded period, exact watchlist/inventory version and admitted predecessor receipts. Job, supporting invoice and expected-period coverage are committed together as one immutable record. Concurrent creation chooses the original; a retry cannot refresh expiry or replace invoice/coverage. Generation rechecks enabled state, current version, inventory, TTL and rights at runtime boundaries. Stale, paused or superseded jobs cannot collect.
5. Actual Node collection/admission/report code produces the new signed owned report. Missing periods remain explicit coverage gaps. Latest bounded representation is labeled changed, unchanged, unknown or baseline, with source links and asserted dates. Missing/stale/incomplete observations never become unchanged. Useful before/after previews and complete source/receipt/section references remain in the shared comparison component.
6. Recovery validates the authenticated owner, immutable historical job/version, current recurring rights and the original invoice's current revocation state. A paused/edited watchlist does not rewrite its historical original. A separate process with public signing keys and recovery-only adapters can return exactly the stored bytes without a collector, producer bearer, signing key or current inventory.

## Timing and missed periods

The schedule is required server configuration, not a selected or published cadence. Source bounds are cadence 1–30 days, history 2–32 periods and at most90 days, job age 60 seconds–24 hours and no longer than cadence. Fixtures explicitly use seven days/four periods/60 seconds; these are fictional acceptance inputs, not an offer.

The first capture boundary is the configured timestamp rounded up to a second plus one second. Later boundaries follow the configured cadence. Capture must finish within its bounded window. The corresponding report becomes due when that capture window closes, so its as-of time can truthfully include completed observations. It has its own bounded execution window. Expired windows are not reopened or backdated. A report requires a current admitted capture; an entirely missing run returns waiting/not-due, never a fabricated observation. Prior missing periods are retained in the signed report context and survive retry/recovery.

Owner edits reset the version's capture timeline and require a new baseline. This deliberately avoids claiming comparability across a changed watchlist/inventory identity. Current catalog drift requires a reviewed new watchlist version; original mutation replay and recovery still use their stored identities.

## Draft recurring-access policy — not approved terms

`current-paid-subscription-v1` is an explicit conservative **implementation proposal requiring acceptance or revision before activation**. It requires a current active paid subscription for generation **and historical recovery**. It is not a promise that cancellation deletes files or a final retention policy.

| Fresh evidence | Source decision |
| --- | --- |
| Exact active recurring item, current fully paid simple invoice, complete payment chain, no reversal | Active; generate only for the authorized current period. Historical recovery also rechecks its original invoice. |
| Scheduled cancellation at the period end while status remains active and current period is paid | Active until that period ends under this draft policy. |
| Canceled, expired, unpaid, past_due, incomplete, trial or other non-active subscription | Denied. |
| Any successful refund, issued credit note, open/lost dispute | Denied under this conservative draft policy, including partial refunds. No inherited kit-refund policy. |
| Pending/ambiguous refund, restored dispute, incomplete pagination/linkage, provider failure, changed snapshot | Unknown; fail closed. |
| Pauses, pending updates/schedules, tax, discounts, credits/balance adjustment, proration, mixed items, split/out-of-band/payment-record settlement | Unsupported/unknown, never mislabeled as proven nonpayment. |

The source supports one licensed per-unit recurring item, quantity 1, one full-period positive invoice, no tax/discount/balance adjustment, and one fully allocated PaymentIntent/charge. Exact product, price, currency, interval and account/mode are required configuration; no actual IDs or price were selected. Unknown evidence is distinct from a known rights denial. No cash/MRR accounting or payment creation is implemented here.

Every evaluation has a 20 second elapsed bound,24 GET maximum,1,500 ms request/body deadlines, zero SDK retries and at most100 items per complete single-page list. Normal current-period verification uses14 GETs; checking a distinct original invoice uses24. Refund, dispute, credit-note and PaymentIntent allocation lists must be complete. Final subscription/invoice rereads catch observed state changes; they cannot provide an atomic cross-provider snapshot. A change immediately after the last check remains a known race. No instantaneous cancellation or exactly-once collection claim is made.

The implemented links follow the installed Stripe 20.4.0 / API 2026-02-25.clover schema. Primary references checked November 12: [subscription item periods](https://docs.stripe.com/api/subscription_items/object), [invoice relationships and credits](https://docs.stripe.com/api/invoices/object), [line-item relationships](https://docs.stripe.com/api/invoice-line-item/object), [invoice-payment allocation](https://docs.stripe.com/api/invoice-payment/object). The documentation connector was used; the absent CLI was not installed and no account API was called.

## Persistent control and source custody

[monitoring-control-proposal.sql](monitoring-control-proposal.sql) is an unapplied, rollback-only source proposal. It creates a fresh private owner, objects under that owner's defaults, FORCE-RLS tables and NOLOGIN runtime placeholders. It grants no access to anon/authenticated/service_role or the existing custody roles, and changes no unrelated PUBLIC grant. Runtime role/scope enrollment is absent.

- Configurator: read versions/heads, append versions and advance only the head version; no jobs or billing bindings.
- Job writer: read canonical control state/binding and append jobs; cannot alter watchlists or enrollment.
- Control recovery: read only.
- Existing source custody: unchanged independent roles/connection; control roles cannot read/write source originals through that database role.

The actual adapter checks direct-login identity, effective privilege/membership, exact schema/table/column ACL allowlists, role/scope binding and an independently approved installation fingerprint on every transaction. Foreign accessible relations/sequences, usable SECURITY DEFINER routines and foreign-schema CREATE remain refusal conditions. It does not weaken the existing custody guard. SQL scope is account/mode/product; owner isolation is implemented by verified server identity and exact predicates, not falsely presented as per-user database credentials.

Billing enrollment remains a separate trusted commerce-owner integration. There is no public or runtime-role binding-write API. No actual project, scope rows, credentials, roles or fingerprint were selected or installed. Later unexpected grants can cause fail-closed interruption. All native syntax/grant/RLS/isolation behavior remains **UNRUN** under the retained namespace hold; the SQL response model is not PostgreSQL.

## Evidence and version preservation

Owned source uses explicit `everymcp-service-custody-v2` receipts and `source-receipt-history-owned-service-v1` reports. V1 receipts still require their original report policy; V2 reports require the owned policy. Start/completion policy swapping is rejected before signing and on verification. Context—including immutable expected-period coverage—is part of the signed report bytes. Old job namespaces/original winners remain stable. Existing Python/GitHub, Node-v1/v2 and service-v1 original bytes are not migrated or rewritten.

Actual end-to-end fixtures use loopback HTTP, the installed Stripe SDK with a no-socket fictional HTTP transport, real SQL adapters with fictional transaction models, and fictional Auth/current-owner responses. Tests include ownership, CSRF, client flags, mutation replay across drift, CAS races, unconfigured/ambiguous enrollment, stale jobs, cancellation/refunds/credits, changed/unchanged/unknown comparisons, retained coverage and fresh-process recovery after signer issuance expiry with a simulated renewed subscription. Final counts, exact source and byte hashes are in the accompanying acceptance receipt.

The earlier native attempt remains consumed: initial unshare failed opening read-only `/proc/self/uid_map`, before acquisition or SQL. No retry, alternate runner, native acquisition or environment switch occurred. All genuine hosted/real-source/payment acceptance remains unrun. A Vercel READY build proves source compilation only.

## Remaining setup requirements

Before activation, the responsible owners must approve the recurring product/price identity and this generation/recovery/reversal/retention policy; implement trusted subscription enrollment without using email/metadata; approve and verify exact control/custody/Auth targets, direct-login roles, fingerprints, secure key/producer custody and bounded pool configuration; then bind the currently disabled handlers/factory and a controlled schedule/delivery path. Native acceptance remains blocked and is not bypassed by fictional SQL tests.

After those gates, genuine acceptance must cover two permitted source periods, owner-A/B isolation, immutable delivery and fresh-session recovery, authentic sandbox payment and renewals, cancellation/expiry, refund/credit/dispute/reversal, provider outage and lost acknowledgement. No live charges, customer communication, new commercial commitment or production activation is authorized by this source continuation. Reserved PR30/33/35 stay untouched.


## Actual catalog qualification and policy alternative

[Offline qualification](MONITORING-CATALOG-QUALIFICATION.md) covers every actual catalog route/pair and full-inventory synthetic report/recovery journeys. Unsupported selections now receive 422 reasons/counts instead of stale-edit guidance; source caps and originals are unchanged. The [90-day earned-original recovery alternative](MONITORING-RECOVERY-POLICY-ALTERNATIVE.md) is for review only: the current disabled policy above remains implemented, and no retention/financial terms changed.
