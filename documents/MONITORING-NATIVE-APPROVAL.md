# One proposed disposable native custody run

November 12, 2026. **Prepared source only. Acquisition, namespace probe, engine execution and SQL remain pending approval.** This packet is not approval, a hosted installation plan or native acceptance evidence. PR36 remains draft and production monitoring remains unavailable.

## Exact scope and source

Run the reviewed PR36 commit once in this existing cloud workspace. The receipt must record its full commit SHA; the runner rejects a dirty checkout, a different HEAD, a changed SQL proposal or a pre-existing task directory. Do not substitute a newer head without review. Reserved PR30/33/35, shared commerce/Auth and the retained private SQL packet are untouched.

- Plan: `scripts/monitoring-native-plan.mjs` (default prints immutable JSON; all flags refuse).
- Controller: `scripts/run-monitoring-native-postgres.mjs` (default prints plan; the explicit execution entry is pending approval).
- Actual native test: `tests/native/monitoring-postgres.native.test.ts`, using installed `pg`, Vitest and the actual `PostgresCustodyStore` and monitoring runtime.
- SQL: `documents/monitoring-custody.proposal.sql`, SHA256 `d6b71ff5d3e3e8308ad3683272f9dd2723b9781e356f4cc854d299ed18cf66c8`.
- Fresh exclusive task root: `/workspace/everymcp-native-pg1711`, mode0700, uid1000. Existing paths cause a stop; no stale artifact is removed or reused.

Future approved command, from `/workspace/everymcp-site` (replace the literal placeholder with the independently reviewed full commit):

```sh
timeout --signal=TERM --kill-after=20s 900s node scripts/run-monitoring-native-postgres.mjs --run-once <reviewed-40-character-head>
```

Do not run this command now. There is no automatic retry or fallback to Docker, sudo, host networking, another database, another package version or another package mirror.

## Read-only capability evidence and prior restrictions

Observed environment: Debian13.6 trixie, x86_64, uid/gid1000, Linux6.18.57. No postgres/initdb/pg_ctl/psql/pg_config on PATH. Installed `libpq5` is17.11-0+deb13u1; required normal Debian runtime libraries are present. `curl`, `dpkg-deb`, `unshare`, `timeout`, `prlimit`, `taskset` and Node are installed. `gpgv` is absent. Docker CLI exists; no daemon was queried or selected.

The shared environment has a16GiB cgroup memory ceiling and4CPU quota; that is not this run's private resource allocation. Its cgroup directory is not writable by uid1000. Available space was about60GiB under workspace and8.8GiB under tmp. Namespace support is advertised by the installed tool/kernel metadata, but **not probed**. No native binary was acquired, copied from another lane or executed.

One read-only apt metadata inquiry reported `Unable to read /etc/apt/apt.conf.d/80-applied-apt-retries - open (13: Permission denied)`. That protected configuration read was not retried; no install occurred. Public Debian package metadata was consulted independently. The retained private SQL-transfer/access/install holds and repository permissions403 remain untouched; no attempt to rediscover their private packet or bypass them occurred. No local native acquisition/execution denial is recorded in this lane; absence of a recorded attempt is not authorization.

## Proposed acquisition and isolation

One HTTPS GET, no redirects/retries, max60seconds, exact maximum16,678,028bytes:

`https://deb.debian.org/debian/pool/main/p/postgresql-17/postgresql-17_17.11-0+deb13u1_amd64.deb`

Expected SHA256: `d2ce1ddffafa783f9acda4c92c86fc21e8288bff3782d739294f14fa797d7886`. Package identity comes from [official Debian package metadata](https://packages.debian.org/trixie/amd64/postgresql-17/download). This is normal verified HTTPS plus exact size/hash verification, **not GPG verification**. No TLS exception is allowed. `dpkg-deb -x` extracts only into the fresh task root; it does not install packages, run maintainer scripts, change system configuration or resolve dependencies. Missing runtime dependencies stop the run.

Before download, the one proposed namespace probe uses `unshare --user --map-current-user --net --pid --fork --kill-child=KILL --mount-proc /usr/bin/true`. Any denial stops before acquisition; no alternate route. The engine/test controller uses the same isolated namespaces and verifies that network/PID/mount namespace identities differ from the parent. Its private network has no external interface or routing configured. No external source/provider/database traffic is needed.

The engine listens only on a Unix socket inside the mode0700 task root (`listen_addresses=''`, socketmode0700, port55436). Local `trust` is restricted by that filesystem boundary; it isolates other UIDs, **not hostile processes with the same UID**. All roles/data are fictional. There are no credentials, hosted connection strings, customer identities or inherited secret environment variables. The controller passes only fixed PATH/LANG/NODE_ENV and local fixture markers. Namespace isolation is not a claim of an adversarial same-UID sandbox.

## Limits, stop and cleanup

| Boundary | Proposed enforcement |
| --- | --- |
| Overall elapsed time | External900second timeout, TERM then KILL after20seconds; isolated child also capped800seconds |
| Engine/test process tree | Private PID namespace; namespace PID1 exit kills descendants |
| RSS and task-root size |1GiB each, checked every1second; soft watchdog stop thresholds, **not hard aggregate caps** |
| Individual file |128MiB RLIMIT_FSIZE for isolated controller descendants |
| SQL | At most1000conservatively counted statements, including setup/catalog/transaction/retry statements |
| Connections | At most160pool checkouts including failed attempts/retries; at most12active; servermax12 |
| Query/lock/connection waits | Adapter5seconds; pool query5seconds, connect2seconds; explicit bounded engine controls |
| Fixture relations | At most10MiB measured before clean restart |
| Diagnostics | SQL/catalog NDJSON capped1MiB; each captured process output capped512KiB; serverlog watchdog1MiB and retainedprefix64KiB; total retained text/result/report data remains bounded below4MiB |

The source intentionally does not claim a hard1GiB aggregate memory/disk quota. If approval requires those hard caps, this packet is insufficient and the run must remain pending; do not weaken or silently reinterpret that requirement.

Shutdown first requests fast stop (10seconds), then immediate stop (10seconds), checking the task cluster's executable, data directory, PID and start identity. Never signal an unrelated PID. Timeout/namespace teardown is the final process-tree boundary. After isolated controller exit, delete only this invocation's known data/socket/engine/package children. Keep the task root, bounded catalog/SQLSTATE logs, package/binary/source/version identities, test output, cleanup receipt and fictional original/hash. Preserve unknown files. A failed or interrupted run remains failed/interrupted and is not automatically rerun. Abrupt termination of the outer controller may leave task-owned artifacts requiring a separate reviewed cleanup; never claim cleanup without its receipt.

## Native assertions prepared, not executed

The test first executes the exact proposal's rollback transaction and verifies the schema is absent. It then changes **only the final ROLLBACK to COMMIT** after checking the pinned source hash, and installs into the disposable cluster. It verifies NOLOGIN placeholders before enabling direct logins for the fictional fixture. Scope binding is created by the fixture administrator using the owner role; no hosted binding is selected.

Each catalog/SQL operation checkpoints nonsecret diagnostics before assertions, including SQLSTATE and constraint names. Catalog arrays explicitly cast name elements to text. Constraint/policy strings remain exact; they are not normalized to hide differences. Baseline and restart/ambient-case snapshots compare exact native definitions. The fixture's observed fingerprint is labeled local evidence, never trusted hosted configuration.

| Fixture state | Expected result |
| --- | --- |
| Clean PostgreSQL17.11 defaults, proposed schema, direct runtime login | Pass; no assertion that every hosted PostgreSQL15+ target shares these defaults |
| NOLOGIN runtime placeholder | Authentication refusal28000 |
| Wrapper login followed by SET ROLE producer | Refuse readiness because current_user differs from session_user |
| Unrelated PUBLIC-executable SECURITY DEFINER | Refuse; monitoring fingerprint unchanged |
| Unrelated PUBLIC-readable table | Refuse |
| Same PUBLIC-readable table with FORCE RLS and no allowing policy | Direct read yields no rows, but readiness still refuses; fingerprint unchanged |
| Grants only to fictional anon/authenticated, with no runtime membership | Pass; grants do not flow to custom runtime roles |
| Foreign-schema USAGE plus ordinary invoker function only | Pass |
| Legacy PUBLIC CREATE on public | Refuse; fixture removes only the grant that it created |

Further actual adapter/runtime assertions: native cross-scope insert/read restrictions, reader write refusal, denied writer-column and role-binding mutation, immutable delete/truncate refusal, malformed/empty/hash/FK rejection, exact idempotent originals, current owner/rights recovery denial, simultaneous SERIALIZABLE period contenders with observed40001, and original-byte recovery after an injected acknowledgement loss **after a real COMMIT**. The acknowledgement injection is not a real network-fault claim. A clean fast restart with fsync/full-page/synchronous writes enabled must recover the same original; it does not prove crash/power-loss durability. Source observations, Auth responses, rights and writer claims remain fictional throughout. No actual public collection, payment or customer delivery is exercised.

## Infrastructure choice and next writer prerequisite

No dedicated database is inherently required. An existing PostgreSQL15+ target may qualify if its actual ambient effective privileges already meet the deny-only contract. A target with conflicting PUBLIC grants requires its owner to choose an eligible separate database or independently review wider privilege changes. This packet selects neither and never revokes unrelated privileges. Later PUBLIC grants can interrupt recovery before fingerprint comparison even if the monitoring schema is unchanged. Foreign-schema USAGE alone and ordinary invoker execution are not categorically prohibited. Local direct-login proof would not prove a hosted pooler maintains current_user=session_user.

There is also no currently wired independent deployment execution witness. A database role proves a credential holder's write; [Vercel OIDC](https://vercel.com/docs/oidc/reference) establishes owner/project/environment, not this report's execution and content. [KMS project grants](https://vercel.com/docs/kms/concepts/project-grants) do not turn caller-provided deployment labels/digests into provider attestation. The next concrete decision is an approved independent witness binding approved deployment/SHA, one-time execution/nonce, canonical job/scope and completion digests to protected custody. [Vercel log fields](https://vercel.com/docs/drains/reference/logs) expose deployment/request/invocation IDs and may provide an existing evidence channel, but require independently authenticated retrieval, reviewed nonce correlation and deployment-to-approved-SHA verification; logs alone do not establish exclusive writer authority. No logs, provider access or configuration were requested here.

**Requested next decision:** approve or reject exactly this one local run and its stated soft resource limits. Hosted database choice, installation fingerprint, login/scope binding, deployment witness, canonical watchlists, recurring rights/retention and activation remain separate unresolved decisions. No subscription price, new recurring offer or revenue is established.
