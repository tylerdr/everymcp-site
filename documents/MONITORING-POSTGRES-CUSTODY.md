# Protected PostgreSQL monitoring custody

November 12, 2026 source candidate. This implements the existing monitoring runtime's persistence contract using the installed PostgreSQL client, with an **unapplied** schema proposal. It does not select a database, connect to a provider, install SQL, issue credentials, activate a runtime, create watchlists or grant recurring rights. The shared kit store and private installation packet are unchanged.

## Implemented path

`PostgresCustodyStore(pool, {scope, access, expectedDefinitionSha256})` implements all five `CustodyStore` methods with real parameterized SQL. The trusted server supplies an approved dedicated pool with normal verified TLS and bounded connection/query timeouts. The constructor snapshots account/mode/product and the producer or recovery access class. No environment factory or request body chooses the connection, role, owner, expected schema fingerprint or scope.

Every operation uses one client and a SERIALIZABLE transaction, pins `search_path=pg_catalog`, and applies five-second statement/lock/idle-transaction timeouts. It checks actual session/effective role, protected scope binding, effective privileges and the independently reviewed installation fingerprint before custody queries. Missing or changed installation fails closed; no ACL repair is attempted. Acknowledged serialization/deadlock failures retry at most twice using SQL-only closures. Transport failure, including a lost COMMIT acknowledgement, does not automatically retry an uncertain write. Later explicit retrieval or idempotent retry finds the original.

Three append-only record types preserve the original:

| Record | Immutable relationship |
| --- | --- |
| Execution start | Account/mode/product, execution ID, unique nonce, job/owner and exact canonical start bytes/hash |
| Completed execution | Exact referenced start, receipt digest/bytes, one source or report payload, its digest/length and actual database writer role |
| Period commit | Scoped job identity and canonical job/owner bytes, pointing to a matching completed execution |

Metadata is capped at 65,536 bytes; source/report payloads at 2 MiB each. Exactly one payload is present. Application validation and proposed database checks enforce hashes, lengths and start/receipt/job cross-bindings. Read queries cap selected bytea values before driver allocation; malformed, missing or corrupted data refuses recovery. Exact duplicate start/completion requests are idempotent; conflicting bytes or reused nonces fail. Competing period commits return the verified existing winner rather than overwriting it. This does not promise exactly-once collection.

The actual recovery handler uses the existing current-user adapter, then retrieves only scoped job metadata to check ownership. It reads report bytes only after that check and current recovery rights. Writer authorization and another current-rights check still precede response bytes. Recovery-role adapter methods refuse every write before acquiring a client. Ordinary owner requests cannot submit source evidence, receipt bytes, deployment identity or paid flags to the producer route. Canonical watchlist/job creation remains a separately unimplemented trusted input; this change preserves stored ownership but does not create a user watchlist editor or authoritative job scheduler.

## Unapplied isolation proposal

[`monitoring-custody.proposal.sql`](monitoring-custody.proposal.sql) proposes PostgreSQL 15+ private schema `everymcp_monitoring`, three NOLOGIN role placeholders and four tables. It ends with ROLLBACK. It is **not an executable installation recommendation**: no scope bindings, logins, credentials or host/project values are supplied. The existing infrastructure owner must review and separately authorize any native execution or installation.

- `everymcp_monitor_owner` owns the schema/tables and exclusively manages scope bindings. Application roles have no membership or SET ROLE path to it.
- `everymcp_monitor_producer` may select scoped custody and insert explicitly named columns. The database supplies `writer_role`; the producer cannot overwrite that column, alter bindings, update/delete originals or mutate the schema.
- `everymcp_monitor_recovery` may only select scoped custody. There are no grants to browser-facing `anon`/`authenticated` roles or a broad `service_role` credential.
- FORCE RLS consults the actual role's protected account/mode/product mapping. No caller-set GUC claim supplies scope. This is database isolation by product/account; verified per-owner authorization remains the handler's responsibility.

The deny-only guard covers effective PUBLIC and column grants, role membership/session identity, ownership/BYPASSRLS/superuser/administrative privileges, foreign-schema CREATE, foreign relation/sequence privileges and usable SECURITY DEFINER functions. It does not categorically prohibit foreign-schema USAGE alone or ordinary invoker-function execution. It includes MAINTAIN on PostgreSQL 17+ without requesting that unsupported privilege on older versions. Unexpected relations, user triggers, rewrite rules and both directions of table inheritance are refused. No such feature is required by the proposal.

An existing PostgreSQL15+ database can qualify if its effective privileges already meet this contract; a dedicated database is not inherently necessary. Ordinary tables/sequences have no PUBLIC privileges by default, and grants limited to unrelated `anon`/`authenticated` roles do not reach custom runtime roles without membership. However, PUBLIC-executable SECURITY DEFINER functions, PUBLIC-readable tables (even with denying RLS), or legacy PUBLIC CREATE on public cause refusal. NOINHERIT does not remove PUBLIC privileges. Revoking grants only from a login cannot cancel PUBLIC grants. Do not repair unrelated ACLs to make readiness pass. If the established target has these capabilities, its owner must choose a separate eligible database or independently review the wider privilege change; this lane chooses neither.

Later unrelated PUBLIC grants can interrupt original recovery before the monitoring-schema fingerprint check even when that fingerprint is unchanged. This operational dependency requires installation-owner acceptance. Direct runtime logins must satisfy `current_user = session_user`; a login wrapper using SET ROLE and the proposal's NOLOGIN placeholders cannot pass. Local direct-login tests do not prove hosted pooler behavior.

The definition fingerprint includes table ownership/RLS flags, column types/defaults/nullability, constraints, valid indexes and exact policy expressions/roles. **An observed fingerprint is not approval.** The expected value must come from independent native installation review and negative access tests, then be bound in trusted server configuration; the app never learns-and-trusts a value from the same database query. A fingerprint proves equality to the reviewed installation, not its safety by itself. It is installation/version specific and can require reapproval after PostgreSQL changes.

The authenticated database role proves a credential holder performed a database operation. It does **not** attest a Vercel deployment, truthful collection, source identity or execution provenance. `verifyExecutionWriter` remains independently required and unimplemented; the runtime factory remains null. NOLOGIN placeholders intentionally cannot satisfy runtime readiness until separately authorized provisioning occurs.

## Executed source evidence

Forty-four focused tests across eight files pass, plus a separate process recovering through the actual SQL adapter and current-owner adapter. Adapter/handler tests traverse actual queries, encoding, transactions, original verification and current-rights checks against a labeled fictional SQL server model. They cover competing commits, immutable retries/conflicts, unique nonce refusal, scoped permission/fingerprint failure, corruption, read-role write refusal, owner-before-body reads, denied producer requests, missing writer verification and COMMIT uncertainty without retry.

The saved fictional report and separately recovered original are 9,201 bytes, SHA256 `797198ee74396d2ee9b5b1584dc8d2f504eb0d0fa2d40969057132c20292e005`. Its SQL fixture, Auth, rights and writer authority are fictional. The separate process proves adapter decoding/recovery across process state; it does not prove PostgreSQL restart durability.

Two additional retained-original checks pass through the new adapter/model: custody-v1/renderer-v1 remains 7,079 bytes / `c73c2cc42ad5ec2776898dc7cbb3f0321c95358b750179c1cdd0f0a339ad0138`; custody-v2/renderer-v1 remains 7,109 bytes / `f00fe5f1862befeaba02b3c41538ee8eb674ad784c2b57a25eb487256989acb8`. Original fixture files remain unchanged. No historical artifact or renderer was rewritten. TypeScript, repository lint and scoped lint pass; independent security review corrected rewrite/inheritance drift guards and passed the final source.

**Unrun:** SQL syntax/execution against a native database, actual RLS/grants/default privileges, pooler/direct-login behavior, SERIALIZABLE isolation, cross-role/owner isolation on hosted rows, crash/restart durability, genuine Auth/provider/collection and payment acceptance. Static SQL assertions and a fictional server model do not establish any of those properties. Automatic Vercel Preview is an application build gate only.

## Exact remaining decision and acceptance

A disposable local source-contract test does not require choosing a hosted target. [MONITORING-NATIVE-APPROVAL.md](MONITORING-NATIVE-APPROVAL.md) specifies one proposed PostgreSQL17.11 run, prepared but not authorized or executed. It tests this separate monitoring proposal, not the retained private packet. Native acceptance must prove: direct producer/recovery login identity, no membership/broad effective grants; positive same-scope and negative cross-scope reads/inserts; denied role-binding/writer-column/update/delete access; malformed/hash/foreign-key rejection; concurrent period winner and lost-ack recovery; clean-restart original recovery; and rollback/cleanup. Local results would establish only the local source contract. A hosted target, its actual installation fingerprint, login/pooler identity and scope bindings still require separate owner selection, review and acceptance before server configuration. Prior private-packet denials remain untouched.

Protected deployment-writer verification, canonical watchlist/job creation, approved generation versus historical-recovery rights, storage quota/retention and hosted controlled-principal acceptance remain separate requirements. The recommendation is to keep the established PostgreSQL stack under its existing owner with this monitoring-specific private schema/role contract, not reuse the kit ledger or introduce a new vendor. No retention/deletion policy, subscription price, invoice behavior or paid availability is invented.

Primary references checked November 12: [PostgreSQL row security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html), [transaction isolation](https://www.postgresql.org/docs/current/transaction-iso.html), and [node-postgres transactions](https://node-postgres.com/features/transactions). The code uses one client per transaction and preserves the distinction between RLS, role privileges and application owner authorization.
