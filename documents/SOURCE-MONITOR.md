# Public source observations, policy v1

This foundation inventories all 616 existing listing URLs and 585 deduplicated source URLs. It observes unauthenticated HTTP availability. Publisher identity, capabilities, protocol conformance, authorization enforcement and tool behavior are separate questions. The report leaves scores, badges and applicable-criteria denominators null; Jev and paid providers are disabled.

## Run locally

Use Python 3.12 in an isolated environment. The application build does not depend on this Python tooling.

```sh
python3 -m venv tmp/source-monitor/venv
tmp/source-monitor/venv/bin/python -m pip install -r scripts/requirements-source-monitor.txt
tmp/source-monitor/venv/bin/python -m unittest discover -s tests -p 'test_source_monitor.py' -v
tmp/source-monitor/venv/bin/python scripts/monitor_sources.py --dry-run
tmp/source-monitor/venv/bin/python scripts/monitor_sources.py --check --max-checks 120
```

Dry run is the default and makes no requests. `--check` explicitly permits bounded public GETs. No cookies, authorization headers, local credentials, proxies, package installation from catalog instructions, model calls or MCP methods are used by the collector. The initial host allowlist covers only hosts already present in the catalog or reviewed five-page references. Other hosts are recorded as rejected inputs with a hash; credentials/query strings are never copied into reports. All A/AAAA answers must be public, the connection is pinned to a checked address, TLS still verifies the hostname, and a complete fetch including DNS has an eight-second deadline. Redirects are recorded as unknown and are not followed. GitHub owner/repo casing and trailing slashes are normalized; document paths retain meaningful casing and trailing slashes.

The CLI writes only operational outputs: an atomically replaced cache/report and content-addressed immutable run files. Outputs inside the repository must stay in `tmp/source-monitor`. Source bodies are hashed and discarded, never executed or stored. The JSON Schema is pinned in `source-monitor-report.schema.json`, validated with the pinned `jsonschema` dependency and local references only. Unknown fields and contradictory cached observations fail closed.

## Cadence and costs

The `Source observations` GitHub workflow schedules daily runs at 22:47 UTC using the existing public repository and standard Ubuntu 24.04 runner, with repository contents read-only and no provider secrets. Each run prioritizes the 12 URLs associated with the five corrected pages once per UTC calendar day; the remaining URLs rotate by oldest/absent observation and become due after seven UTC calendar days. Unknown reads are eligible for a daily retry. Calendar-day comparisons tolerate scheduler jitter. A maximum of 120 source attempts and 20 minutes per run makes a complete first pass possible in roughly six daily runs if sources cooperate. This is a coverage plan, not a claim that all sources have been checked.

A bounded robots.txt read is cached for the UTC day and parsed with pinned Protego, including wildcard exclusions, crawl delay and request rate. Disallowed paths or unknown/redirected/unreadable policy remain uncollected; unsupported visit windows or delays above a minute also remain unknown. Policy source dates/status/hash are included without publishing its body. Up to six policy reads are counted separately from at most 120 source attempts (126 total requests). One request per host per second or a stricter declared delay, sequential collection, an eight-second fetch deadline, and a stop on that host's 403/429 prevent a burst. A bounded Retry-After cooldown survives in the operational cache. There are no in-run retries. The 25-minute job timeout is an outer bound. A failed, skipped, blocked or budget-limited run remains explicit.

Standard GitHub-hosted runner minutes for a public repository are free under [GitHub's published billing policy](https://docs.github.com/en/billing/concepts/product-billing/github-actions). The workflow stores only the compact operational cache in the existing included cache allowance and uses run logs for immutable report receipts, without uploading billable artifacts. Shared account quota and successful scheduling still require actual receipts; this code does not change budgets or guarantee zero account charges. Reports expose attempt count, received bytes and request duration. Provider calls are zero; infrastructure/quota costs are not inferred from that fact.

PR events run fixtures and a whole-catalog dry run only. Actual collection runs only on trusted `main`, for the canonical public repository, on schedule or an explicit workflow dispatch. PRs do not restore or save the production cache. Checkout credentials are not persisted. The cache has a policy prefix and unique run key, and only `cache.json` is retained. Immutable JSON is printed after validation with its SHA-256 in the job log; the GitHub run's event, commit, timestamps and conclusion are the execution receipt. A committed workflow or a manually successful run is not evidence that a future scheduled due run occurred. [GitHub documents](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule) that scheduled events can be delayed or dropped, and public-repository schedules can be disabled after 60 days without repository activity. A dated last successful receipt must therefore be checked before claiming freshness; this foundation does not establish a delivery SLA.

## Interpret the report

- `reachable`: a complete successful HTTP response, or 304 backed by the previous complete body hash. This is source availability only.
- `missing_at_check`: 404/410 at the explicit date. It does not establish abandonment or permanent unavailability.
- `unknown`: authentication needed, blocked/rate-limited, timeout/DNS/TLS/transport failure, redirect, oversized/partial body or another unclassified response.
- No observation: not checked. `runDisposition` explains fresh cache, host cooldown, robots refusal/unknown, dry run or budget limits. `stale` uses the collection cadence, never a quality grade.

The last attempt (`observation`) and `lastSuccessfulObservation` retain separate dates and content hashes. A failed read cannot replace last known content with a capability claim. Content hash changes are raw HTTP byte changes, potentially including page chrome; they require review and are not semantic regression claims. Unresolved missing-source and changed-body findings survive recovery and expiry until a reviewer resolves them through an explicit later policy. No rank or grade can improve on expiry.

All legacy indexed sources start with unknown identity evidence. Only curated references carry documented publisher/community attribution and their own dated evidence; a community alternative never replaces the original listing. Report relationship IDs/slugs match the existing catalog. The pre-existing duplicate `neon-mcp` ID across `neon-mcp` and `neon-mcp-server` is flagged and preserved.

## Publication and next steps

`publication.mode` is `review_required`; the collector never writes the public catalog or five-page evidence file. Review exact URL mappings, dates, availability transitions and primary-source content before refreshing a public note. Do not copy installation claims, publisher names or capability prose from an HTTP status or a model proposal. Public notes retain dated observations until a reviewed replacement is published.

The reviewed research bundle `2026-10-04-r2` is verified locally (archive and eight per-file SHA-256 entries) and intentionally has `readyForExecutableUse=false`. It is input for later rule validation, not an executable scorer. Bounded version-specific discovery, optional-feature applicability, client/server actor boundaries, tenant/private evidence handling, model abstention/provenance and any gateway integration remain separate work. No advertised tools, resources or prompts are executed in this slice.

Release gates: independent review, Python fixture and dry-run/schema validation, unchanged catalog/application checks, exact-head hosted build, then a real workflow execution and first scheduled due-run receipt. Do not call automated monitoring live or claim automatic publication until those respective receipts exist.

## Offline receipt import and priority review, policy v1

`scripts/import_source_receipt.py` accepts a saved report or a single observe-job log marker pair. It makes no network requests and does not collect, restore a production cache, call a model, or update public data. Obtain the expected canonical SHA-256, exact trusted-main commit and run/job metadata through an authorized GitHub read before importing. The hash establishes content integrity; it does not authenticate the claimed origin by itself. Check the actual canonical run and observe job independently, including their event, branch, head, timestamps and successful conclusion. The importer checks those supplied fields and citation URLs, but does not replace that provenance verification.

The committed [manual-run review bundle](source-monitor-reviews/2026-10-04-manual/queue.md) preserves the complete body-free JSON receipt, minimal execution metadata and five-entry JSON/Markdown queue for run [37240814694](https://github.com/tylerdr/everymcp-site/actions/runs/37240814694), observe job [111549047496](https://github.com/tylerdr/everymcp-site/actions/runs/37240814694/job/111549047496), at `a3f2affc5a8e354428ecc66ed11c33ea1ec4dca8`. It is manual-run evidence, not a scheduled-run receipt. All 12 priority sources were attempted: five historical indexed repositories returned 404, and seven distinct curated references returned 200. The full receipt still covers only 120 source attempts: 38 reachable, 77 missing at check, five unknown, 465 not checked.

Replay this fixed snapshot without network access:

```sh
tmp/source-monitor/venv/bin/python -m unittest discover -s tests -p 'test_source*.py' -v
tmp/source-monitor/venv/bin/python scripts/import_source_receipt.py \
  --receipt documents/source-monitor-reviews/2026-10-04-manual/receipt.json \
  --sha256 2196cc1d41678e4ac23cda41751bfb5eceb6a2c114dc6a6a53ebda070c87d347 \
  --execution documents/source-monitor-reviews/2026-10-04-manual/execution.json \
  --head-sha a3f2affc5a8e354428ecc66ed11c33ea1ec4dca8 \
  --as-of 2026-10-04T23:15:00Z
```

Use `--job-log path/to/observe.log` instead of `--receipt` to extract the logged `SOURCE_RUN_SHA256` and `SOURCE_RUN_JSON` output. Echoed workflow source lines are ignored; absent, multiple, truncated or mismatched markers fail closed. The canonical hash is computed from compact sorted JSON plus one newline. Duplicate JSON keys and non-finite values are rejected. Both paths validate the committed report schema, policy/null assessments, exact current catalog URL-to-listing relationships, actual cohort counters, chronological last attempts/successes/findings and the trusted workflow's 120-source/six-policy request limits. An inventory mismatch needs explicit historical mapping review; the importer never silently reassigns a URL or drops a preserved slug.

`--as-of` is required, making freshness deterministic rather than dependent on the reviewer's wall clock. Queue rows keep receipt freshness separately from freshness at that review date. They distinguish reachable, missing at check, unknown and not checked, plus stale/current/unchecked, the collection disposition, precise failure reason, previous successful observation and unresolved findings. A newer unknown/failed read remains inconclusive and keeps its previous success. Recovery and expiry leave unresolved findings visible. Aggregate request duration excludes host pacing, while observation duration includes it; these measurements are retained separately.

The queue joins by stable slug and the exact normalized source URL, preserving each original citation URL, indexed versus separate-reference role, documented publisher/community attribution, curated evidence date/note, all URL relationships and a JSON pointer back to the receipt. Curated iCloud archive status and Heap ingestion/deletion/localhost cautions remain review inputs; an HTTP 200 cannot resolve them. Public-note availability comparisons do not infer changed capabilities or publisher identity. The duplicate Neon ID and both slugs remain intact; the full inventory is 616 routes, 615 legacy IDs, 578 indexed URLs plus seven separate references, 585 unique URLs.

Import outputs are content-addressed immutable bundles under `tmp/source-monitor/imports` by default. Re-importing identical inputs is idempotent; changed existing bundle content is rejected. Outputs within the repository are restricted to `tmp/source-monitor`, including resolved symlinks; source inputs cannot sit inside the destination. A reviewed snapshot may be copied into `documents/source-monitor-reviews` in a PR for durable review. Neither the import command nor CI publishes `data/mcps.json` or `data/listing-evidence.json`. Later public refreshes require a separate reviewed change and exact production readback. This slice adds no workflow collection, scheduler claim, evaluator, grade, badge, provider call or commerce activation.
