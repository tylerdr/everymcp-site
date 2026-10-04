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

The `Source observations` GitHub workflow proposes daily runs at 22:47 UTC using the existing public repository and standard Ubuntu 24.04 runner, with repository contents read-only and no provider secrets. Each run prioritizes the 12 URLs associated with the five corrected pages once per UTC calendar day; the remaining URLs rotate by oldest/absent observation and become due after seven UTC calendar days. Unknown reads are eligible for a daily retry. Calendar-day comparisons tolerate scheduler jitter. A maximum of 120 source attempts and 20 minutes per run makes a complete first pass possible in roughly six daily runs if sources cooperate. This is a coverage plan, not a claim that all sources have been checked.

A bounded robots.txt read is cached for the UTC day and parsed with pinned Protego, including wildcard exclusions, crawl delay and request rate. Disallowed paths or unknown/redirected/unreadable policy remain uncollected; unsupported visit windows or delays above a minute also remain unknown. Policy source dates/status/hash are included without publishing its body. Up to six policy reads are counted separately from at most 120 source attempts (126 total requests). One request per host per second or a stricter declared delay, sequential collection, an eight-second fetch deadline, and a stop on that host's 403/429 prevent a burst. A bounded Retry-After cooldown survives in the operational cache. There are no in-run retries. The 25-minute job timeout is an outer bound. A failed, skipped, blocked or budget-limited run remains explicit.

Standard GitHub-hosted runner minutes for a public repository are free under [GitHub's published billing policy](https://docs.github.com/en/billing/concepts/product-billing/github-actions). The workflow stores only the compact operational cache in the existing included cache allowance and uses run logs for immutable report receipts, without uploading billable artifacts. Shared account quota and successful scheduling still require actual receipts; this code does not change budgets or guarantee zero account charges. Reports expose attempt count, received bytes and request duration. Provider calls are zero; infrastructure/quota costs are not inferred from that fact.

PR events run fixtures and a whole-catalog dry run only. Actual collection runs only on trusted `main`, for the canonical public repository, on schedule or an explicit workflow dispatch. PRs do not restore or save the production cache. Checkout credentials are not persisted. The cache has a policy prefix and unique run key, and only `cache.json` is retained. Immutable JSON is printed after validation with its SHA-256 in the job log; the GitHub run's event, commit, timestamps and conclusion are the execution receipt. A committed workflow or a manually successful run is not evidence that a future scheduled due run occurred.

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
