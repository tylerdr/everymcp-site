# EveryMCP — October 29 source and revenue-readiness handoff

## Current source and release state

Fresh normal GitHub reads: PR29 remains `9d41a585dc714813974e5b652dee901c8de2c7d8`; main is `f181b0fc450ba4ef7bd24b86c27ff1b255521c9d`. PR30 remains separate. The source candidate combines PR29 with all newer main discovery/worksheet changes by a clean local merge, then adds the sample change. Do not publish a historical full tree over current main.

Exact production `dpl_GcD7qo1Ah6hqgwAjBjwcnKsPtA2H` is READY at main f181b0fc, serving everymcp.com. Live pricing still closes checkout. Retained PR29 Preview `dpl_9vaYUe4ku4UkZqQS2nGs3X5DZndk` at 9d41 is READY; this is historical build evidence, not new hosted acceptance. The new candidate has not been deployed. GitHub Actions remains disabled.

## Completed source change

Research/default paid packets now include a filled, explicitly hypothetical boundary example in section 5. Pricing uses that exact section as its public sample. Expected fields, missing-field behavior, no-write boundary, proposed timeout and disable verification are concrete; observed result is explicitly NOT RUN. Other valid goals keep their worksheet. Download copy describes verified-account/current-rights recovery conditionally. Stored original packets, price, entitlement logic and production gate are unchanged.

Three new focused tests pass, as do standalone TypeScript and changed-file lint. Independent read-only review found no P1/P2. Prior suites/native checks were not repeated. See `revenue-path/sample-source-2026-10-29.json` for command receipts and changed-source hashes. This proves source behavior only.

## Exact remaining payment integration

Stripe reconnection is confirmed through the normal connector. Named sandbox inventory has no EveryMCP webhook. Checkout creates inline price_data, so no duplicate Product/Price fixture is needed. The protected Preview configuration is still missing the app's Stripe, Auth, receipt database and webhook bindings; having a connected Stripe app is not equivalent to runtime configuration.

Root/shared infrastructure owner must use the already reviewed private store packet and actual current metadata before installation. The retained independent source packet tree is `f7beb496b6c9055d8d0b5f6cb5d33c8ed506a315`; this candidate does not supersede or modify it. Its private rendered SQL/receipts stay outside this public repository. Last actual discovery showed the dedicated role/schema absent; no later installation is claimed. The old source-rendering time window is not SQL authority. Preserve all hook-digest, effective-privilege/PG17 MAINTAIN and RLS-empty-rollback guards. No duplicate generic DDL, Storage bucket or native tenant/workspace integration.

After root-owned install/postchecks, separately scoped credential custody must bind only the exact Preview branch: `EVERYMCP_RECEIPT_DATABASE_URL` (dedicated role, TLS), sandbox `STRIPE_SECRET_KEY`, `EVERYMCP_STRIPE_WEBHOOK_SECRET`; public configuration `STRIPE_MODE=test`, `STRIPE_ACCOUNT_ID`, `EVERYMCP_AUTH_PROJECT`, `EVERYMCP_AUTH_PUBLISHABLE_KEY`, exact `NEXT_PUBLIC_SITE_URL`, and `EVERYMCP_PREVIEW_RECOVERY=named-sandbox-v1`. Never print secret values or apply these to Production. Auth needs two controlled, independently verified buyer principals and an expressly scoped email/signup acceptance; none were created here.

Then prove in the exact deployed Preview: goal/listing attribution through sign-in and checkout; authentic sandbox signed event; one original packet stored atomically; return/reload/lost-return recovery yields identical bytes; owner B cannot access owner A; duplicate/out-of-order event safety; partial refund retains rights, full refund denies return and recovery, dispute pauses access; failure retries never require repurchase. Keep actual test receipts separate from revenue. See existing DURABLE-RECOVERY and REFUND-ACCEPTANCE for detailed cases; do not substitute synthetic source tests for these steps. Production remains source-disabled until those gates and release review pass.

## Commercial next step

The offer remains a $49 one-time editable general MCP selection/rollout packet for a developer owning a first integration. Its Filesystem configuration example is not a configured web-scraping integration. Existing main contains the web-retrieval guide and free fixture worksheet; retained campaign drafts are in `monetization-2026-10-28/CAMPAIGN.md`. No sends occurred. Once actual paid delivery passes, the smallest campaign is one authorized owned-social post linking the useful guide, sample and current checkout availability. Verify backend instrument receipts before interpreting click counts; GA variable presence alone proves no conversion.

Cash remains a separate private reconciliation; no revenue claim follows from this source work. At $49, a hypothetical 205 unrefunded sales collect $10,045 excluding sales tax; a 2% conversion scenario needs 10,250 qualified visits, not observed demand. MRR is separate; the offer is one-time. Support owner/contact, refund-request process and fulfillment/support capacity remain unverified commercial gates; do not invent a response SLA or legal promise. Public pricing states the effect of refunds on access but that alone does not establish a refund-request policy.

No SQL, provider/config/credential mutation, customer messages, charges, remote commits/refs or deployments were performed by this lane. Root retains release ownership.
