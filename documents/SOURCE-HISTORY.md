# Source watchlist history and exact report recovery

The offline history stage converts admitted source-monitor receipts into a report for selected catalog slugs. It makes no network requests, calls no MCP methods, sends no notifications, changes no catalog and accepts no customer or payment data. Collection, execution provenance, publication, payment and tenant access remain separate boundaries. See [the monitoring acceptance packet](MONITORING-ACCEPTANCE.md) for the production path and unresolved gates.

## Run the existing historical example

Use Python 3.12 on Linux with the existing pinned `scripts/requirements-source-monitor.txt` installed in an isolated environment. Immutable publication requires Linux `renameat2(RENAME_NOREPLACE)` and directory/file `fsync`; there is no overwrite fallback. This is a tested local filesystem adapter, not an approved production durable store.

```sh
python scripts/source_receipt_history.py build \
  --manifest documents/source-monitor-reviews/history-inputs-2026-11-12.json \
  --as-of 2026-11-12T00:00:00Z \
  --slug revenuecat-mcp --slug heap-mcp \
  --output-dir tmp/source-monitor/history

python scripts/source_receipt_history.py recover \
  --bundle tmp/source-monitor/history/<content-addressed-directory>

python -m unittest discover -s tests -p 'test_source_receipt_history.py' -v
```

Build prints only the completed bundle path. Recovery writes the original Markdown bytes to stdout after validating the bundle identity, file lengths/hashes and canonical JSON/Markdown agreement. Save stdout to a new file if needed. A fresh process does not rebuild a historical report from today's catalog.

The example manifest points to the **actual October 4 manual collection**, not a new run. At the fixed November 12 as-of time its checked observations are stale. Across the complete catalog it contains 120 dated checks: 38 reachable, 77 missing at check, five unknown, and 465 sources not checked. With one supplied receipt, the report establishes baseline coverage, not newly observed changes. Multi-run test transitions are synthetic fixtures and are never saved as real execution evidence.

## Input admission and repeatability

A manifest contains exactly `schemaVersion: 1` and a `receipts` list of one to 32 entries. Each entry supplies `receiptPath`, `executionPath`, `sha256` and `headSha`. Relative paths resolve against the manifest directory. Each file is read with the existing 16 MiB bound. Obtain the expected canonical receipt SHA, exact trusted-main head and canonical run/job metadata independently; a customer-supplied hash or metadata object cannot authenticate its own origin. The importer checks content integrity and consistency, not access to GitHub or author authenticity.

Each receipt is admitted with the existing pinned schema, exact current catalog/source relationships, null assessments, complete counters and bounded execution/time checks. This stage calls `validate_execution` with the manifest's separate expected head. Different reports cannot claim the same run/job. Inventory/mapping drift, ambiguous evidence at one URL/time, backward latest-attempt or last-success dates, and lost previously known success refuse the whole report. No partial output is published.

`--slug` selects one to 100 stable slugs; omit it for the complete catalog. Duplicate selections do not double-count coverage. The two Neon slugs preserve their separate listing identities and shared source relationship; legacy ID alone is never the join key. Source rows retain indexed versus separate-reference roles and documented versus unknown attribution. Ordering, repeated identical receipts and selected-slug ordering cannot change report bytes. Explicit as-of time controls freshness, not an implicit wall clock.

## Interpreting the output

`source-receipt-history-v1` reports the selected slug/source denominator, latest states, stale/unchecked count, distinct dated observations and event counts deduplicated by URL. Entries retain all related slugs. Every current row and history event links a receipt SHA, run/job URL and exact JSON pointer. Changes include both comparison observations/evidence; complete body changes include both hashes. Prior successful evidence remains distinct from an unknown latest attempt.

- **Baseline observation:** the earliest supplied dated evidence. A baseline can itself be reachable, missing or unknown; it is not a newly discovered outage.
- **Source missing at check:** prior conclusive reachable evidence followed by HTTP 404/410. Intermediate unknown attempts remain visible.
- **Source reachable again:** prior conclusive missing evidence followed by a complete successful response. This does not establish how long a source was unavailable.
- **Complete source bytes changed:** different hashes across complete successful observations, preserving the comparison across unknown attempts. Page chrome may be responsible; semantic or compatibility impact is unknown.
- **Inconclusive check:** a later dated unknown attempt, with its actual reason/status. Authentication, timeout, server or scanner failures are not MCP downtime claims.

An actual later 304 is a dated check backed by a prior complete hash, not a body change. The same cached observation repeated across receipts adds no check or event. Reports preserve unresolved review findings after recovery or later omission; freshness expiry cannot resolve them. Check history is sparse: missing intervals, unavailable receipts and unobserved behavior remain unknown. Event IDs identify evidence facts for deduplication, not exactly-once delivery or globally authenticated truth.

HTTP source checks never establish MCP functionality, compatibility, security, tool outcomes, publisher identity, continuous availability, uptime percentage or an SLA. Compatibility output needs a separately reviewed version-specific declaration/behavior contract. A complete listing denominator does not mean a complete successful observation denominator.

## Immutable storage and recovery

Each bundle contains only `report.json`, `report.md` and `manifest.json`. The directory name is the SHA-256 of the canonical manifest; the manifest pins both report files by length and SHA-256. Files and the staging directory are flushed before an atomic non-replacing directory publication; the destination parent is flushed afterward. Concurrent identical publication converges on the same validated bundle. Existing different, empty, corrupt or partial targets are never replaced.

Recovery rejects extra/missing files, symlinks in the path or bundle, hash/length mismatches, changed Markdown and noncanonical JSON. Generated files are each bounded to 16 MiB. Inside this repository, outputs must remain under `tmp/source-monitor`; source inputs cannot be inside the output directory. The CLI does not overwrite an arbitrary output file. Preserve the original bundle identity in a trusted delivery record; changing an entire bundle and its identity is not prevented by checksums alone. This adapter is not an adversarial multi-user filesystem sandbox and does not implement customer authorization, backups or a retention promise.

The subscription worker will later need a transactional `(verified owner, watchlist version, covered interval, report identity)` record in the approved isolated store. A failed notification or lost response must recover those exact original bytes without new collection, regenerated purchases or another charge. No such production binding is activated here, and no tenant identity should be added to this public source report format.
