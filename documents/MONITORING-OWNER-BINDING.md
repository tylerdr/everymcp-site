# Monitoring owner identity adapter

Source candidate, November 12, 2026. `lib/monitoring/owner.ts` implements the current-user read needed for private monitoring recovery. It uses the established Supabase Auth protocol and the existing buyer cookie format without modifying the shared buyer, kit, payment or storage code. It does not grant a subscription, create an account, refresh a session, read customer rows or activate the monitoring runtime.

## Exact source contract

`createMonitoringOwner({ scope, project, publishableKey })` returns the real `RuntimeDependencies.authenticateOwner` implementation. These arguments come from future reviewed server configuration, never from a request. Construction validates and snapshots the scope/account/mode/product, lowercase20-character project reference and publishable-key format. No environment variable or request can activate `getMonitoringRuntime()`, which still returns null.

Each call accepts either one valid `__Host-everymcp-buyer` cookie or one Bearer header. Missing/malformed/duplicate credentials and simultaneous cookie/header credentials return no principal before network access. A valid request makes exactly one GET to `https://<fixed-project>.supabase.co/auth/v1/user`, with only its bearer, the configured publishable key and JSON Accept header. Redirects, unexpected response URLs, cached/session-derived identity and retries are not allowed. Normal platform TLS remains required. No admin/service-role key or Auth table query is used.

The complete operation, including response-body reading, has one five-second deadline and a64,000-byte decoded-body limit. It requires status200, JSON content type, strict UTF-8, a canonical UUID, a confirmed email timestamp and explicit `is_anonymous: false`.401/403 deny identity. Other status, transport, malformed, incomplete, oversized or ineligible responses are unavailable; callers receive generic errors without tokens or Auth bodies. Cancellation does not wait indefinitely on a stalled upstream stream.

The principal contains only its copied scope and SHA256 of the JSON tuple:

```text
["everymcp-monitoring-owner-v1", accountId, mode, productKey, authProject, authoritativeUserUuid]
```

Email changes do not change ownership. User/app metadata, paid flags, supplied owner IDs and Starter Kit receipts cannot supply ownership or recurring authorization. The versioned tuple deliberately differs from the kit namespace. Future canonical watchlist creation must derive the same principal server-side; the adapter does not implement that writer or migrate historical records.

## Actual retrieval behavior

The exercised path is `GET /api/monitoring/recovery?jobId=...` → runtime recovery → this current-user adapter → stored owner/scope check → current exact recovery rights → protected original/writer verification → second current-rights check → original bytes with `private, no-store`. No posted watchlist, deployment claim, receipt or entitlement is admitted through this path. Other owners receive no report, even with metadata naming the original owner. A denied, unknown, mismatched or newly revoked rights result cannot expose bytes.

Identity is fresh at its Auth read; it does not prove immediate session revocation. Supabase documents that stronger post-signout guarantees require checking session existence. This adapter performs no such private session-table query and makes no such promise. Recurring rights remain a separate authoritative boundary, including generation versus historical recovery after cancellation/refund/dispute. See [Supabase getUser](https://supabase.com/docs/reference/javascript/auth-getuser), [user fields](https://supabase.com/docs/guides/auth/users) and [session lifetime/revocation](https://supabase.com/docs/guides/auth/sessions), checked November12. The official changelog's recent TLS cipher deprecation requires modern TLS; no protocol/security relaxation was introduced. The installed Auth library's `getUser(jwt)` implementation also confirms the same GET `/user` operation.

## Executed source acceptance

The focused adapter and recovery tests use fictional Auth responses, fake test-account rights and the existing explicitly fictional custody adapter. They exercise actual owner parsing, current-user transport decisions, report production, route handling and original recovery. Coverage includes scope/project separation, email/metadata changes, ambiguous credentials, malformed/anonymous/unconfirmed identities,401/403 versus unavailable, redirected/wrong endpoints, UTF-8/byte limits, stalled headers/body, late responses, owner-B denial, rights revocation during retrieval and fresh-session recovery after reconstructing storage. A separate process invokes the actual owner adapter and recovers the same saved original without collection, inventory, regenerated jobs or changed custody bytes.

These are source tests, not a real Supabase session, sandbox payment, hosted database or production customer acceptance. Exact executed test counts, artifact hashes and automatic Preview identity belong to the PR/lane release receipt. Existing report versions and all genuine historical artifacts are unchanged.

## Remaining integration decisions and custody

This lane owns the monitoring adapter and its tests. `lib/recovery/owner.ts`, `lib/buyer/*`, `lib/recovery/binding.ts`, `lib/recovery/postgres-store.ts`, Stripe readers and PR30/33/35 remain unchanged. Historical source establishes **Supabase Auth + a dedicated PostgreSQL receipt role + Stripe one-time kit payments**, but does not establish an approved monitoring resource, subscription or deployment-bound writer. The kit store validates kit-specific content and permissions; its role/schema cannot simply be reused for monitoring. Existing private-store packet and installation/access denials remain with their owner; they were not opened or retried.

The smallest next binding decision is for the existing Auth/store/commerce owner to confirm the monitoring scope tuple and eligible existing Auth project/publishable key. Canonical watchlists must use this adapter's owner namespace. That is source/config coordination, not approval to create users or install anything. Confirm the existing short-lived bearer/session policy, or explicitly assign stronger session checks if required; neither JWT policy nor Auth settings were changed.

Persistent monitoring custody and writer authentication still need a separately reviewed implementation on an approved isolated PostgreSQL resource with immutable original and period-index transactions, scoped writer authority and restart/isolation proof. Recommendation: keep the established PostgreSQL stack under the existing store owner, using a monitoring-specific schema/role contract rather than adapting the kit ledger or adding a vendor. No such schema/role is created or assumed installed here. The deployment-to-writer authority must independently bind the actual execution; project-scoped Vercel OIDC or environment deployment metadata alone does not satisfy the current contract.

The commerce owner must separately approve/implement a monitoring product and period-bound `generate`/`recover` policy, including cancellation, refund and dispute behavior. No price or public offer is added. Only after those adapters, canonical job writer and hosted controlled-principal acceptance are ready may a reviewed runtime binding be proposed. Real two-period collection, hosted immutable delivery/recovery and genuine recurring payment/reversal acceptance remain unrun. The existing Preview's503 response proves only that intake stays closed.
