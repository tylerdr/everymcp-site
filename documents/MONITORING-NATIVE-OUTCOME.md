# Native custody attempt: stopped before acquisition

November12,2026. One authorized invocation of reviewed source `c69b636e40b5e5c318a0c445bbaa9de15aae7590` failed at the initial namespace probe. **No native PostgreSQL acceptance was reached. The authorized attempt is consumed; no further run is authorized.**

```text
timeout --signal=TERM --kill-after=20s 900s node scripts/run-monitoring-native-postgres.mjs --run-once c69b636e40b5e5c318a0c445bbaa9de15aae7590

Error: /usr/bin/unshare: unshare: cannot open /proc/self/uid_map: Read-only file system
exit code: 1
```

Preflight confirmed a clean matching local/remote head, exact reviewed SQL/runner/native-test hashes, real/effective UID/GID1000 and an absent task root. Official Debian HTML metadata again listed the exact pinned package URL, size and hash; no package bytes were fetched. [Structured outcome](evidence/monitoring-native-c69b636-20261112.json) retains the exact boundaries and diagnostics.

The controller's initial probe precedes directory creation and acquisition. The filesystem refused opening `/proc/self/uid_map`; this was a runtime restriction, not an automatic approval-review rejection. No retry, privilege escalation, host-network route, alternate package/mirror, protected apt read or settings change followed.

| Stage | Observed result |
| --- | --- |
| Controller / initial unshare | Executed once; exited1 on read-only uid-map restriction |
| Package acquisition/extraction | Not attempted |
| Engine, SQL and five native test groups | Unrun; zero SQL statements and pool checkouts |
| PUBLIC/default/direct-login/RLS/integrity cases | Unrun |
| SERIALIZABLE contenders / lost acknowledgement / restart originals | Unrun |
| Hosted Auth, writer authority, monitoring or payment | Not attempted |

Independent read-only cleanup verification found no task root, symlink, archive, engine/data/socket or native receipts, and no visible postgres/postmaster/initdb/pg_ctl/unshare processes. All inspected process-name entries were readable. The synchronous controller returned; no cleanup mutation was needed. These are point-in-time observations, not broad host/process isolation proof. Existing source/original artifacts were preserved.

Retained evidence consists only of nonsecret preflight/provenance, command failure and cleanup receipts. No native original, catalog fingerprint or SQLSTATE diagnostics exist because the engine never started. Prior three passing plan tests and five skipped native tests are source-preparation evidence, not results of this invocation. The1GiB RSS/disk watchdog thresholds remain **soft**; engine watchdogs were never reached.

The current cloud boundary cannot provide the required unprivileged uid mapping. Native acceptance remains blocked pending a separately approved compliant execution boundary and new bounded-run authorization. This outcome does not authorize relaxing security restrictions, changing environments or retrying another route. Hosted target/fingerprint/login binding, independent deployment witness, canonical watchlists, recurring rights and activation remain unresolved. PR36 remains draft; no runtime/commerce source changed.
