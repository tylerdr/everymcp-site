# Default-off internal monitoring workflow

The report engine now has a concrete internal orchestration seam in `scripts/monitoring_workflow.py`. `get_production_binding()` returns `None` unconditionally. There is no environment opt-in, HTTP endpoint, cron dispatch, scheduler registration, provider binding or customer notification. Constructing the worker with local fixtures exercises source behavior only.

## Ownership reconciliation

- This lane owns the new report engine, internal worker, tests and documentation on PR36. PR35 remains held; no merge/native-browser retry. PR30 and PR33 remain reserved.
- `scripts/monitor_sources.py` and the existing source workflow retain their current collection rules. GitHub Actions remain disabled. No replacement collection or scheduler is created.
- `lib/recovery/owner.ts`, `lib/buyer/*`, `lib/recovery/binding.ts`, the existing store and payment files are untouched. The current kit owner-key function explicitly namespaces identity to `everymcp-starter-kit`; the kit ledger validates Starter Kit content. Monitoring must obtain verified identity and separately scoped recurring rights from the existing owners. It cannot fabricate a kit purchase or reuse its product-specific owner key/entitlement as monitoring authorization.
- Shared storage/Auth/commerce installation remains parent-coordinated under the existing private packet and denials. Current records establish these component boundaries, but do not identify a verified active thread ID for each infrastructure owner. Parent must route the concrete adapters below; an inactive PR is not evidence of vacant custody.
- The testing-only adapter lives under `tests/monitoring_workflow_fixture.py`. It is not a production schema, Auth subsystem or payment implementation.

## Worker contract and invariant

`MonitoringWorker.run_period(worker_context, PeriodJob)` accepts only an authenticated worker in its configured scope. The job contains a watchlist ID/version and canonical UTC start/end, never a caller-supplied owner. `load_watchlist` supplies the canonical owner and sorted stable slugs. Generation rights must be active for that exact scope, owner, watchlist version, period and action before source loading or writes; they are checked again before commit. Unknown rights or adapter failures remain retryable unavailable outcomes.

The job ID hashes scope/account/mode/product, server-supplied owner, watchlist ID/version, period and report-policy version. Changed receipts, retries and catalog edits cannot create a different identity for that same job. A changed watchlist with the same version is a conflict. Periods must end by the injected UTC clock, start before end and span at most 90 days (an input bound, not a promised cadence or retention policy). Explicit selection remains bounded to 100 stable slugs.

Before generating, the worker checks for a committed job. If present, it verifies and returns the original bytes without loading newer sources or rebuilding against today's catalog. Otherwise it calls the real receipt-history engine using the period end as `asOf`. The report is a full retained-history snapshot at that date, not a claim that every historical event occurred during this period. A later inbox/digest must preserve event dates and stable IDs rather than send every old event as a new alert.

The prepared artifact's Markdown hash and length must match the report the worker generated. Its stored bytes must be readable and verified before committing an index. `commit_if_absent` returns the authoritative winner; concurrent workers with different candidates return that same original, not their losing candidate. A crash before the index can leave an invisible orphan bundle. A lost acknowledgement after index commit recovers through the existing record without regeneration. This provides one immutable logical report per job under the adapter contract, not exactly-once network delivery.

`recover(request_context, job_id)` authenticates a current owner, checks stored scope/ownership, obtains current recovery rights for that precise record and verifies the original bytes before returning them. Wrong owner/scope, unverified identity, absent records and denied rights return no report. Unknown rights and corrupt/unavailable storage fail retryably. No ownership or access is accepted from an HTTP body/query, and no public route is introduced. Generation and historical-recovery rights are distinct decisions: cancellation, grace, refund and dispute rules are deliberately left to the existing recurring-commerce owner. Rights are authoritative at check time, not an instantaneous revocation guarantee across a remote check and response.

## Exact adapter packet for existing owners

| Owner boundary | Required interface | Actual state |
| --- | --- | --- |
| Runtime/scheduler | Approved Python 3.12 Linux worker with existing pinned report dependencies; invokes `run_period` with bounded canonical jobs and a verified worker context | No production binding/runtime/schedule; Actions disabled |
| Worker authentication | `authenticate_worker(context) -> VerifiedWorker(scope, worker_key)` | Fixture only; no credential created/read |
| Existing buyer identity | `authenticate_owner(context) -> Principal(scope, owner_key)` derived from authoritative server identity, correctly namespaced for monitoring | Fixture only; no signup/email/principal trial |
| Watchlist owner | `load_watchlist(job) -> CanonicalWatchlist(scope, owner_key, watchlist_id, version, slugs)` from trusted persisted configuration | Fixture only; no customer data read |
| Existing recurring commerce | `current_rights(scope, owner, watchlist_id, version, period_start, period_end, action) -> RightsDecision(..., active/denied/unknown)`; `action` is `generate` or `recover` | No recurring offer/entitlement adapter; kit rights cannot substitute |
| Source evidence ingestion | `load_verified_sources(job, watchlist) -> EngineInputs(snapshots, catalog, curated)` with independently verified canonical receipt/run/job/head metadata | Historical example and synthetic transitions only |
| Existing durable storage | `get(job_id)`, `prepare(report_dict)`, `commit_if_absent(CommittedReport)` and `read_bytes(Artifact)` with immutable original bytes, atomic index winner, scope/owner isolation, quota and restart proof | Test-only local filesystem implementation; no SQL or hosted resource changes |
| Delivery/inbox | Authenticated customer inbox calls `recover`; notification failure must not remove recovery. Approve private deterministic raw-observation delivery independently of public catalog review | No inbox/notification binding or send; report remains review-required |

The `CommittedReport` binds job ID, scope, owner key, watchlist ID/version/slugs, period, report policy and artifact identity/hash/length. These private delivery records are distinct from the body-free public-source report. A production adapter must preserve these relationships transactionally; the interface is not a SQL installation proposal. Do not log full private records or authentication context in public receipts.

## Reproducible provider-free acceptance

With the existing pinned Python environment:

```sh
python -m unittest discover -s tests -p 'test_monitoring_workflow.py' -v
python tests/monitoring_workflow_fixture.py generate \
  --directory tmp/source-monitor/workflow-fixture
python tests/monitoring_workflow_fixture.py recover \
  --directory tmp/source-monitor/workflow-fixture --job-id <returned-job-id>
```

The helper explicitly uses fixture worker/owner identities, a fake test account and injected active/denied/unknown rights. It performs no network request, real Auth, payment, live collection or send. It uses the real history engine and real local immutable bundle/index operations. Do not wire the helper into application routes or production bindings.

Acceptance covers actual historical report generation with five stale sources (two missing at check, three reachable), synthetic missing→unknown→recovery/body changes, three concurrent processes, different losing candidates, crashes before index, lost response after commit, changed-input retry without rebuilding, fresh-process original recovery, wrong-owner/scope denial, revoked/unknown/mismatched rights, same-version watchlist conflict, wrong prepared bytes and corrupt storage. The historical recovered Markdown is 4,861 bytes with SHA-256 `187072dc5ef9342e21c415bf29ee4b97e5e430763e72a68d031f788b67c33237` at the fixture's fixed as-of time. This is local workflow acceptance, not customer-session or payment acceptance.

## Nonsecret activation and commercial decisions

Existing repository: `tylerdr/everymcp-site`, PR36, branch `feature/monitoring-watchlist-reports-20261112`. Existing Vercel app: project `prj_cIe9v9wLzCsZmPwBrGJ4QpRKVota`, team `team_a6j754ztWo6nDnWjVfIGnPEm`. Its Next.js Preview does not run this standalone Python worker. No hosted integration can be enabled by changing an environment flag in this candidate.

Parent needs the following explicit decisions; no secret values belong in this packet:

1. **Runtime:** nominate the approved existing Python/Linux job host, owner, scheduler cadence, per-run CPU/time/source-request budget, included capacity and missed-run/backfill policy. Existing source policy is daily for priority/unknown reads and seven UTC days for other sources; do not sell a faster guarantee without separate collection/runtime acceptance. Keep Actions disabled.
2. **Store/Auth:** route to the existing isolated-store/Auth owner with the current private installation packet. Supply approved resource identities and the authorized installation/controlled-principal acceptance scope. Preserve prior shared-store rejection, SQL-transfer/install denials and credential custody; this lane proposes no alternative host or ACL change.
3. **Recurring offer:** approve one exact tuple: monitoring product key, monthly price/currency, listing cap (code ceiling100), observation/report cadence, report retention, support contact, cancellation/renewal/grace behavior, and full/partial refund/dispute/reversal rights for generation versus historical recovery. No tuple is approved or activated today. Useful scope is dated source availability/change evidence with persistent history; no compatibility, uptime or security promise. The existing $49 kit is one-time and closed, not MRR.
4. **Payment context:** existing source names sandbox account `acct_1Re4ltEQ7c58oLZ4` for the kit's preview-only path; that literal is not proof of a current monitoring account binding or approval to reuse it. Existing commerce owner must confirm the monitoring seller/account/test context and separately scoped recurring product/price/period rights. No monitoring Stripe object, webhook, subscription or credential is created here.
5. **Acceptance allowance:** authorize a specifically bounded named-sandbox sequence covering paid subscription, genuine signed event, report commit/inbox, same-owner fresh-session original recovery, owner-B denial, failed renewal/cancel, full/partial refund, open/lost/won dispute and reversal-before-paid behavior. Retain mode/account/product/owner/event/report identities privately; distinguish actual provider evidence from fixtures. Do not use a one-session allowance to claim all lifecycle cases.
6. **Private delivery:** approve deterministic private reports without per-report Tyler fulfillment, dated stale/unknown/missed-run presentation and customer retention/access behavior. Public catalog/capability changes remain separately reviewed. Choose an authenticated inbox first; email or other destinations require separate sender/data/consent and bounded delivery authority.

Until these decisions and corresponding hosted acceptance pass, the worker remains default-off, checkout and monitoring intake stay closed, and payment→delivery→fresh-session recovery→refund/dispute/reversal evidence is unrun outside fixtures. No MRR or collected-cash claim follows from this source implementation or its Vercel build.
