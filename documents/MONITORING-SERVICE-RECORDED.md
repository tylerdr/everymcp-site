# Service-recorded monitoring — source contract, not activation

The parent-approved source decision is a **distinct service-recorded origin**, not a relaxation of existing platform-evidence verification. It makes the existing Node collector, bounded comparisons and immutable recovery usable under a precise service trust model. No hosted factory is bound by this change; `getMonitoringRuntime()` remains `null`.

## What the record proves

`everymcp-service-custody-v1` authenticates an EveryMCP service assertion using a fixed server-configured Ed25519 public-key registry. A valid signature means the corresponding trusted signer/credential holder endorsed the exact bytes. It does **not** prove truthful fetching, independent observation time, exact-build execution, Vercel attestation, uptime, MCP compatibility or security. A compromised service/signing-key holder can create false assertions. This is explicit near the start of every new report and in its source citations.

New service records omit deployment ID, team/project ID and Git SHA. Source/observation dates are signed assertions; there is no independent clock witness. `server-collection` denotes the configured collector's evidence class, not platform attestation. Fictional fixtures use `synthetic-fixture`, test scope and conspicuous fictional labels. Published RFC8032 fixture keys cannot be configured as production authority.

## Actual source path

1. `createServiceProducer` binds a fixed scope/service, a server-side signing key and a **separate** producer bearer. Strict POST authentication rejects absent, incorrect, combined or ambient-cookie credentials. It never authenticates from caller owner, deployment, paid flag, request body or URL metadata. No key generation, environment discovery or configuration action is implemented.
2. `createServiceRecordedRuntime` loads a canonical job from the server dependency, checks scope/job identity and current generation rights, and signs/reserves a nonce before work. The service origin has its own stable job namespace. Only canonical inventory source URLs can enter the existing bounded collector. That collector retains its current source/robots/time/body limits and conservative unknown/incomplete semantics.
3. Domain-separated start and completion signatures bind the exact canonical job, inventory, nonce, service/key identity, asserted interval, evidence class, predecessor handles and original-byte hashes/lengths. The completion additionally binds the hash of the **signed** start. A source digest or caller-supplied success flag alone is insufficient.
4. `ServicePostgresCustodyStore` uses the existing parameterized transactional adapter mechanics, with a fixed service-only codec and authoritative verifier. Legacy and service wrappers have no cross-origin fallback or caller-selected validator. Originals and period winners remain immutable, exact retries are idempotent, nonce reuse/conflicts fail, and transport-uncertain COMMIT is never automatically retried.
5. The real shared comparison engine produces `source-receipt-history-service-v1`: latest complete change with balanced before/after excerpts, source/receipt/section pointers and asserted dates, prior history and honest unknown/stale results. It preserves the 24-word-per-source preview limit. It never regenerates old originals under a new renderer.
6. Recovery uses the existing verified-current-user adapter, server-stored ownership, current recovery rights before and after body retrieval, and the public verifier. It does not need the producer bearer, signing key, collector, current inventory or job regeneration. Cancellation may stop generation while preserving recovery **only if** the eventual recurring-rights adapter explicitly authorizes that policy; it is not a published commercial promise.

## Trust and isolation boundaries

| Adversary / failure | Source behavior and limit |
| --- | --- |
| Anonymous or ordinary authenticated caller | Cannot run the producer, pick ownership/rights, choose a URL or forge a signed record. Authenticated ownership alone grants no generation entitlement. |
| Wrong scope, service, key or origin | Fixed registry/schema/namespace rejects substitution; existing Node/Python evidence is never admitted as service evidence. |
| Corrupted bytes, swapped start/completion, replay | Exact signature, hashes, signed-start binding and immutable nonce/period custody reject mutation or select the existing original. |
| Stolen producer bearer only | May trigger server-loaded currently authorized jobs if the host binds the handler; does not expose the signing key or authorize arbitrary jobs. Rate/quota controls and secure binding remain activation prerequisites. |
| Compromised signing service/key holder | Can lie about observations/time. Signatures are endorsement, not an independent witness. Custody still forbids replacing an existing committed original. |
| Database producer credential holder | Database role identity alone is insufficient: invalid service signatures are rejected. The same proposed SQL roles/tables can hold both origins; **this is not per-origin SQL isolation**. A holder may cause denial of service or write unreadable rows. No grants changed. |
| Recovery service | Needs a read role, current-user verification, current rights and public registry; it has no signing capability in the supplied recovery fixture. A compromised application can leak bytes it legitimately can read; application owner checks are not proof of independent per-customer DB isolation. |
| Key expiry/revocation | Valid historical signatures remain verifiable after issuance expiry. A reviewed registry with `revoked: true` refuses that key's records. Registry objects snapshot configuration; changing an external value does not instantly update already constructed verifiers. A hosted rotation/revocation control plane is not implemented. |

The SQL guard, exact expected installation fingerprint and direct-login/role requirements remain unchanged. Ambient PUBLIC grants can still cause refusal before fingerprint checking. No schema installation or additional grant is part of this change.

## Backward compatibility

The old runtime, `verifyExecutionWriter`, original Node receipt schemas, v1 renderer and Python/GitHub verification policy remain unchanged. Shared history internals and SQL mechanics are extracted behind strict version-specific entry points. Tests pin the pre-change legacy builder and v1/v2 rendered hashes, check original recovery, and refuse both directions of cross-origin SQL and renderer admission. No old stored receipt or report is migrated, relabeled, resigned or overwritten.

## Executed acceptance and its limits

`tests/monitoring-service-runtime.test.ts` exercises actual loopback HTTP → Node collector → signed start/completion → service admission → real SQL adapter against a **fictional SQL response model** → useful report → public-key-only fresh-process recovery. Both test source bodies and Auth/rights/database authority are fictional. The child receives only public verification material, recovers after the signing key's issuance window, and must return the exact original bytes. Local file serialization is fixture transport, not a production store.

Focused authority/history/workflow cases cover strict public-key parsing, malformed/combined credentials, known fixture-key refusal for production, rotation/revocation/expiry, signed-input/body mutations, cross-version refusal, canonical ownership and URL checks, concurrency, nonce reuse, lost acknowledgement, immutable retry, current-rights denial/unknown/revocation, recovery-only role and legacy byte parity. Full counts and exact artifact hashes are recorded in the PR's acceptance receipt.

No PostgreSQL engine was run for this contract. The prior single native attempt stopped at read-only `/proc/self/uid_map` before acquisition or SQL. That attempt remains consumed; no retry or alternative runner is prepared. See [MONITORING-NATIVE-OUTCOME.md](MONITORING-NATIVE-OUTCOME.md). Loopback/fake-SQL success is not native grants/RLS/isolation/durability, real-source history, hosted service trust, payment or revenue evidence. Vercel READY means application build only.

## Smallest next integration and hosted prerequisites

The next coherent source boundary is **canonical watchlist/job ownership with server-derived recurring rights**, using the established owner namespace and custody scope. A kit purchase must never become a monitoring subscription. The responsible commerce/identity owners must specify the recurring product identity and authoritative lifecycle mapping (generation vs retained-original recovery, cancellation/refund/dispute/reversal, unknown-provider behavior), plus watchlist version/period ownership and quotas. Those decisions are not fabricated by this source change; existing PR30/33/35 remain reserved.

Before a hosted trial, separately approve the exact installation/role/fingerprint and Auth/scope target, producer invocation trust boundary, production key registry/rotation custody and read-vs-signing credential isolation. Select the allowed collection cadence/request/storage/retention budget and delivery/recovery policy. Configure none of these from a client request. The source has real signing and SQL adapter implementations, but production factory/job loader/rights wiring, secure runtime key custody and hosted installation remain absent.

Then acceptance must observe two genuine permitted periods, authenticated scheduled invocation, useful source-linked change or explicit unknown, immutable private delivery, fresh-session owner recovery and owner-B denial, cancellation/generation-vs-recovery policy, key revocation behavior, fault/retry recovery, and authentic sandbox payment→rights→delivery→refund/dispute/reversal. No collection, schedule, Auth/provider access, SQL, credentials, payment, external delivery, prices/terms or production release is authorized by this source decision.
