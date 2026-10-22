# Offline collections reconciliation

This operator-only tool is a first reporting slice, not provider integration or proof of revenue. It does not activate commerce, change PR29, read credentials, contact a provider or determine entitlement. No production runtime or dependency changes.

Run `node --test tests/reconcile-revenue.test.mjs` and `node scripts/reconcile-revenue.mjs /private/normalized-evidence.json`. Keep all real inputs and provider references outside Git. Output contains aggregate values only. Error output is fixed to avoid leaking private parser excerpts.

## Input contract

Input schema `everymcp.revenue-evidence.1` has:
- `period`: explicit-offset ISO `start` and exclusive `end`. October LA is `2026-10-01T00:00:00-07:00` through `2026-11-01T00:00:00-07:00`.
- `coverage`: each of `collection`, `refund`, `processing_fee`, `settlement`, `booked_unpaid` has `status` (`complete`, `partial`, `unknown`) and `sourceRefs` (private statement/export references). Complete requires at least one reference. Operator must independently establish coverage of the entire period and all relevant seller accounts; software cannot authenticate a reference or infer missing pages/accounts.
- `events`: array of normalized rows with `id`, `paymentId`, `sourceRef`, `product` (`everymcp-starter-kit`), `currency` (`usd`), `mode` (`test` or `live`), `kind` (one coverage key), `amountCents` (nonnegative safe integer) and `at` (explicit-offset ISO). Refund/fee/settlement dates are their own effective financial dates, not the original purchase date. Refunds from prior-period purchases can reduce this period. Do not represent outstanding booked amounts as collected money. `booked_unpaid` is an effective-dated snapshot; normalize to one row per outstanding booking at the snapshot date, not a history of booking changes.

Collections and refunds are product-attributed amounts excluding collected/refunded tax. Separately retain tax obligations in private accounting. Fees must be actual product-attributed processing fees, not estimated percentages. Settlements are attributable settled transfer amounts, not additional revenue. Shared bundles, currency conversion, disputes and unallocated balances require upstream reconciliation; never attribute another product's cash to EveryMCP. Test rows must be correctly labeled upstream. The tool rejects mixed products/currencies rather than silently including them.

Use stable canonical financial IDs, not webhook delivery IDs: normalize multiple webhook/event/export views of the same collection into one payment. Exact repeated event rows deduplicate; conflicting IDs and separate collection IDs for the same payment fail closed. Deduplicate refunds/fees/settlements by their canonical financial object ID before supplying input. IDs must be globally scoped across seller accounts. No per-order refund cap is enforced because partial statements can contain refunds for earlier purchases; an operator must reconcile adjustments against provider records.

## Interpretation

`observedCents` is only a supplied-row subtotal. `reportedCents` remains null unless coverage is declared complete. Empty unknown input is never zero revenue. Complete empty input is a **reported** zero requiring independent evidence, never automatic verification. `collectedRevenueNetOfRefundsCents` is the confirmed October target metric: collections minus refunds, excluding tax and test rows. Fees do not reduce this metric. It is null unless both collections and refunds have complete coverage. Net collections after refunds and processing fees is a separate measure and is null if any of those three coverages is incomplete. It is neither contribution nor owner-distributable cash; fulfillment costs, reserves, disputes, tax, hosting and obligations remain separate. Settled cash is a distinct measure. MRR, earned revenue and owner-distributable cash remain null. The current $49 one-time offer adds no MRR; account-wide MRR is not established.

No provider export has been obtained or reconciled in this session. This tool fixes reporting semantics and permits a future private evidence import; it does not satisfy readiness gate6.

## Next evidence request, no activation

Obtain approved read-only, redacted seller-account payment/refund/fee/settlement exports for the LA October window, retaining account/mode/product provenance and pagination/coverage evidence privately. Obtain separately the analytics planner/copy/paid-intent denominators and delivery/support obligations. Reconcile totals to provider statements before labeling revenue verified. Do not read secrets, switch modes or run checkout to populate a report. Seller/test context and all PR29 activation approvals remain separate.
