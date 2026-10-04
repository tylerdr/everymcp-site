#!/usr/bin/env python3
"""Import a verified public-source receipt into an offline, review-only queue."""
import argparse
import json
import os
import re
import tempfile
from collections import Counter
from pathlib import Path

import monitor_sources as monitor

ROOT = monitor.ROOT
REPOSITORY = "tylerdr/everymcp-site"
PRIORITY_SLUGS = ("revenuecat-mcp", "redash-mcp", "icloud-mcp", "heap-mcp", "hotjar-mcp")
IMPORT_POLICY = "source-receipt-review-v1"
MAX_INPUT_BYTES = 16 * 1024 * 1024


def canonical_bytes(value):
    return json.dumps(value, sort_keys=True, separators=(",", ":"), allow_nan=False).encode() + b"\n"


def strict_json(value):
    def unique_pairs(pairs):
        result = {}
        for key, item in pairs:
            if key in result:
                raise ValueError("Duplicate JSON keys are not a receipt")
            result[key] = item
        return result
    def invalid_constant(_value):
        raise ValueError("Non-finite JSON values are not a receipt")
    try:
        return json.loads(value, object_pairs_hook=unique_pairs, parse_constant=invalid_constant)
    except (TypeError, json.JSONDecodeError, UnicodeError) as error:
        raise ValueError("Invalid receipt JSON") from error


def bounded_read(path):
    with path.open("rb") as file:
        content = file.read(MAX_INPUT_BYTES + 1)
    if len(content) > MAX_INPUT_BYTES:
        raise ValueError("Receipt input exceeds the import size limit")
    return content


def read_receipt(path, expected_hash, job_log=False):
    if not re.fullmatch(r"[a-f0-9]{64}", expected_hash):
        raise ValueError("Expected receipt SHA-256 must be supplied independently")
    content = bounded_read(path)
    if job_log:
        # Match actual output only, never the echoed workflow's print statements.
        prefix = r"(?:\d{4}-\d{2}-\d{2}T[0-9:.]+Z )?"
        hashes, reports = [], []
        for line in content.decode("utf-8-sig").splitlines():
            match = re.fullmatch(prefix + r"SOURCE_RUN_SHA256 ([a-f0-9]{64})", line)
            if match:
                hashes.append(match[1])
            match = re.fullmatch(prefix + r"SOURCE_RUN_JSON (\{.*\})", line)
            if match:
                reports.append(match[1])
        if hashes != [expected_hash] or len(reports) != 1:
            raise ValueError("Expected exactly one matching receipt/hash marker pair")
        content = reports[0]
    report = strict_json(content)
    if monitor.digest(canonical_bytes(report)) != expected_hash:
        raise ValueError("Receipt SHA-256 mismatch")
    monitor.validate_report(report)
    return report


def validate_execution(execution, report, expected_head, as_of):
    if set(execution) != {"repository", "workflowPath", "run", "job"}:
        raise ValueError("Unexpected execution metadata fields")
    if execution["repository"] != REPOSITORY or execution["workflowPath"] != ".github/workflows/source-monitor.yml":
        raise ValueError("Receipt must come from the canonical source workflow")
    run, job = execution["run"], execution["job"]
    if set(run) != {"id", "headSha", "headBranch", "event", "status", "conclusion", "createdAt", "updatedAt", "url"}:
        raise ValueError("Unexpected run metadata fields")
    if set(job) != {"id", "runId", "name", "status", "conclusion", "startedAt", "completedAt", "url"}:
        raise ValueError("Unexpected job metadata fields")
    if any(type(value) is not int or value <= 0 for value in (run["id"], job["id"], job["runId"])):
        raise ValueError("Execution IDs must be positive integers")
    if not re.fullmatch(r"[a-f0-9]{40}", expected_head) or run["headSha"] != expected_head:
        raise ValueError("Execution head differs from the independently verified commit")
    if run["headBranch"] != "main" or run["event"] not in {"workflow_dispatch", "schedule"}:
        raise ValueError("Untrusted workflow event or branch")
    if any(item["status"] != "completed" or item["conclusion"] != "success" for item in (run, job)):
        raise ValueError("Incomplete or failed collector execution cannot establish a receipt")
    run_url = f"https://github.com/{REPOSITORY}/actions/runs/{run['id']}"
    if job["name"] != "observe" or job["runId"] != run["id"] or run["url"] != run_url or job["url"] != f"{run_url}/job/{job['id']}":
        raise ValueError("Run/job provenance or citations disagree")
    dates = [monitor.parse_date(value) for value in (run["createdAt"], job["startedAt"], report["generatedAt"], job["completedAt"], run["updatedAt"], as_of)]
    if dates != sorted(dates) or (dates[3] - dates[1]).total_seconds() > 25 * 60:
        raise ValueError("Receipt, execution and as-of times are inconsistent")
    if report["mode"] != "check":
        raise ValueError("A dry-run inventory is not a collection receipt")


def validate_inventory_and_observations(report, catalog, curated, execution):
    listings, expected, rejected = monitor.inventory(catalog, curated)
    if report["listings"] != listings or report["rejectedInputs"] != rejected:
        raise ValueError("Receipt listing identities differ from the committed catalog")
    actual = {source["url"]: source for source in report["sources"]}
    if len(actual) != len(report["sources"]) or set(actual) != set(expected):
        raise ValueError("Receipt source URLs differ from the committed inventory")
    generated = monitor.parse_date(report["generatedAt"])
    started = monitor.parse_date(execution["job"]["startedAt"])
    attempts, counts, stale, received = 0, Counter(), 0, 0
    for url, source in actual.items():
        if {key: source[key] for key in ("url", "relationships", "priority")} != expected[url]:
            raise ValueError("Receipt URL-to-listing relationships differ from committed evidence")
        observation, success = source["observation"], source["lastSuccessfulObservation"]
        for value in (observation, success):
            if value and (not monitor.valid_observation(value) or monitor.parse_date(value["checkedAt"]) > generated or value["receivedBytes"] > monitor.MAX_BODY_BYTES + 1):
                raise ValueError("Contradictory or future-dated observation")
        if success and (success["state"] != "reachable" or not observation or monitor.parse_date(success["checkedAt"]) > monitor.parse_date(observation["checkedAt"])):
            raise ValueError("Last successful read is inconsistent with the latest attempt")
        if observation and observation["state"] == "reachable" and observation != success:
            raise ValueError("A successful latest attempt must remain the last successful read")
        for finding in source["reviewFindings"]:
            if not (monitor.parse_date(finding["firstObservedAt"]) <= monitor.parse_date(finding["lastObservedAt"]) <= generated):
                raise ValueError("Invalid finding chronology")
        due = observation is None or monitor.is_due(source, observation, generated, 7)
        if source["stale"] != due:
            raise ValueError("Receipt freshness disagrees with the canonical cadence")
        stale += due
        counts[observation["state"] if observation else "not_checked"] += 1
        if source["runDisposition"] == "checked_this_run":
            if not observation or monitor.parse_date(observation["checkedAt"]) < started:
                raise ValueError("Checked cohort lacks an observation from this execution")
            attempts += 1
            received += observation["receivedBytes"]
        elif observation and monitor.parse_date(observation["checkedAt"]) >= started:
            raise ValueError("Observation from this execution is absent from its checked cohort")
        if source["runDisposition"] == "dry_run" or source["runDisposition"] == "fresh_cache" and (not observation or monitor.is_due(source, observation, started, 7)):
            raise ValueError("Collection disposition contradicts its observation")
    summary = report["summary"]
    if summary["distinctListingIdCount"] != len({item["id"] for item in listings}) or summary["stateCounts"] != dict(counts) or summary["staleOrUnchecked"] != stale or summary["attemptsThisRun"] != attempts:
        raise ValueError("Receipt summary disagrees with the actual observation cohort")
    if attempts > 120 or summary["robotsRequestsThisRun"] > 6 or summary["httpRequestsThisRun"] != attempts + summary["robotsRequestsThisRun"]:
        raise ValueError("Receipt exceeds the trusted workflow request budget")
    if summary["receivedBytesThisRun"] < received:
        raise ValueError("Receipt metrics omit checked source requests")
    if summary["receivedBytesThisRun"] > summary["httpRequestsThisRun"] * (monitor.MAX_BODY_BYTES + 1) or summary["requestDurationMsThisRun"] > 25 * 60 * 1000:
        raise ValueError("Receipt metrics exceed the execution bounds")
    # Observation durations include host pacing; aggregate request duration excludes it.
    # They are different measurements and must not be summed as the same metric.
    hosts = set()
    for policy in report["robotsPolicies"]:
        if policy["host"] not in monitor.ALLOWED_HOSTS or policy["host"] in hosts or monitor.parse_date(policy["checkedAt"]) > generated:
            raise ValueError("Invalid robots-policy provenance")
        hosts.add(policy["host"])
        if policy["state"] == "available" and (policy["httpStatus"] != 200 or not policy["contentHash"]):
            raise ValueError("Contradictory robots success")
        if policy["state"] == "absent" and policy["httpStatus"] not in (404, 410):
            raise ValueError("Contradictory robots absence")
        if policy["state"] != "available" and policy["contentHash"] is not None:
            raise ValueError("Unexpected robots content hash")
    ids = Counter(item["id"] for item in listings)
    expected_findings = [{"kind": "duplicate_listing_id", "id": ident, "slugs": [item["slug"] for item in listings if item["id"] == ident], "resolution": "review_required"} for ident, count in sorted(ids.items()) if count > 1]
    if report["inventoryFindings"] != expected_findings:
        raise ValueError("Receipt omits or changes the existing identity collision")


def availability_from_status(status):
    if 200 <= status < 300 and status != 206:
        return "reachable"
    return "missing_at_check" if status in (404, 410) else "unknown"


def build_queue(report, execution, receipt_hash, as_of, catalog, curated):
    monitor.validate_report(report)
    if monitor.digest(canonical_bytes(report)) != receipt_hash:
        raise ValueError("Receipt SHA-256 mismatch")
    validate_execution(execution, report, execution["run"]["headSha"], as_of)
    validate_inventory_and_observations(report, catalog, curated, execution)
    catalog_by_slug = {item["slug"]: item for item in catalog}
    evidence_by_slug = {item["slug"]: item for item in curated}
    if set(evidence_by_slug) != set(PRIORITY_SLUGS) or len(evidence_by_slug) != len(curated):
        raise ValueError("Priority evidence set requires an explicit importer policy update")
    now = monitor.parse_date(as_of)
    entries = []
    for slug in PRIORITY_SLUGS:
        listing, evidence = catalog_by_slug[slug], evidence_by_slug[slug]
        rows = []
        for index, source in enumerate(report["sources"]):
            for relation in source["relationships"]:
                if relation["slug"] != slug:
                    continue
                if relation["role"] == "indexed_repository":
                    public_evidence = {"label": "Previously indexed repository", "kind": "unknown", **evidence["indexedRepository"]}
                else:
                    matches = [ref for ref in evidence["references"] if monitor.normalize_url(ref["url"]) == source["url"]]
                    if len(matches) != 1:
                        raise ValueError("Ambiguous curated reference citation")
                    public_evidence = matches[0]
                if monitor.normalize_url(public_evidence["url"]) != source["url"]:
                    raise ValueError("Curated indexed citation differs from the catalog source")
                observation = source["observation"]
                state = observation["state"] if observation else "not_checked"
                freshness = "unchecked" if not observation else "stale" if monitor.is_due(source, observation, now, 7) else "current"
                comparison = "not_checked" if not observation else "inconclusive" if state == "unknown" else "same_observed_availability" if state == availability_from_status(public_evidence["httpStatus"]) else "different_observed_availability"
                reasons = ["identity_and_capability_review_required"]
                if state != "reachable":
                    reasons.append(state)
                if freshness == "stale":
                    reasons.append("stale_at_as_of")
                if comparison == "different_observed_availability":
                    reasons.append("availability_differs_from_public_evidence")
                if observation and monitor.parse_date(observation["checkedAt"]) > monitor.parse_date(public_evidence["checkedAt"]):
                    reasons.append("newer_attempt_than_public_note")
                reasons.extend(finding["kind"] for finding in source["reviewFindings"])
                rows.append({"url": source["url"], "sourceCitation": public_evidence["url"], "reportPointer": f"/sources/{index}",
                             "relationship": relation, "allRelationships": source["relationships"], "curatedEvidence": public_evidence,
                             "observation": observation, "lastSuccessfulObservation": source["lastSuccessfulObservation"],
                             "availabilityState": state, "freshnessAsOf": freshness, "staleAtReceipt": source["stale"],
                             "runDisposition": source["runDisposition"], "reviewFindings": source["reviewFindings"],
                             "publicEvidenceComparison": comparison, "reviewReasons": sorted(set(reasons))})
        rows.sort(key=lambda row: (row["relationship"]["role"] != "indexed_repository", row["url"]))
        entries.append({"id": listing["id"], "slug": slug, "name": listing["name"], "listingUrl": f"https://everymcp.com/mcp/{slug}",
                        "status": "review_required", "publisherAssessment": "unknown", "curatedSummary": evidence["summary"],
                        "curatedCheckMethod": evidence["checkMethod"], "sources": rows})
    return {"schemaVersion": 1, "importPolicyVersion": IMPORT_POLICY, "sourcePolicyVersion": report["policyVersion"],
            "asOf": as_of, "receiptGeneratedAt": report["generatedAt"], "receiptSha256": receipt_hash,
            "execution": execution, "catalogSha256": monitor.digest(canonical_bytes(catalog)),
            "publicEvidenceSha256": monitor.digest(canonical_bytes(curated)), "inventorySummary": report["summary"],
            "inventoryFindings": report["inventoryFindings"], "assessment": report["assessment"],
            "publication": report["publication"], "entries": entries}


def render_queue(queue):
    execution = queue["execution"]
    lines = ["# Priority listing evidence review", "", f"As of: {queue['asOf']} · receipt generated: {queue['receiptGeneratedAt']}", "",
             f"Receipt SHA-256: `{queue['receiptSha256']}`. [Collection run]({execution['run']['url']}) · [Observe job / source logs]({execution['job']['url']}) · event: `{execution['run']['event']}` · head: `{execution['run']['headSha']}`.", "",
             "This is an internal review queue. HTTP availability does not establish MCP behavior, publisher identity or capability conformance. Public catalog/evidence changes require a separate reviewed change; score, badge and applicability denominator remain null.", "",
             "Freshness is calculated at the explicit as-of date using the existing UTC calendar-day cadence. An unknown attempt preserves the previous successful read and its date. Missing sources are dated HTTP observations; they are not failed MCP evaluations.", ""]
    for entry in queue["entries"]:
        lines += [f"## [{entry['name']}]({entry['listingUrl']})", "", f"Stable identity: `{entry['id']}` / `{entry['slug']}` · review required.", "", entry["curatedSummary"], "",
                  "| Source and relationship | Availability / status | Latest attempt | Last success | Freshness | Disposition |",
                  "| --- | --- | --- | --- | --- | --- |"]
        for row in entry["sources"]:
            obs, success = row["observation"], row["lastSuccessfulObservation"]
            relation = row["relationship"]
            lines.append(f"| [{row['url']}]({row['sourceCitation']}) · {relation['role']} · {relation['identityEvidence']} | {row['availabilityState']} / {obs['httpStatus'] if obs else '—'} · {obs['reason'] if obs else 'no_observation'} | {obs['checkedAt'] if obs else '—'} | {success['checkedAt'] if success else '—'} | {row['freshnessAsOf']} | {row['runDisposition']} |")
        lines += [""]
        for row in entry["sources"]:
            public = row["curatedEvidence"]
            lines += [f"- [{public['label']}]({row['sourceCitation']}): public note {public['checkedAt']} (HTTP {public['httpStatus']}); receipt pointer `{row['reportPointer']}`; comparison `{row['publicEvidenceComparison']}`."]
            if public.get("note"):
                lines += [f"  {public['note']}"]
            lines += [f"  Review reasons: {', '.join(row['reviewReasons'])}."]
        lines += [""]
    lines += ["Review exact source identity, curated notes, observation dates, last success and unresolved findings before proposing a public refresh. Keep community candidates separate, and retain the iCloud archive and Heap ingestion/deletion/localhost cautions unless new primary evidence justifies a reviewed correction.", ""]
    return "\n".join(lines).encode()


def validate_output_directory(directory, inputs):
    resolved = directory.resolve()
    if resolved.is_relative_to(ROOT) and not resolved.is_relative_to(ROOT / "tmp/source-monitor"):
        raise ValueError("Repository imports must stay under tmp/source-monitor; no automatic publication")
    if any(path.resolve().is_relative_to(resolved) for path in inputs):
        raise ValueError("Import inputs must stay outside the immutable output directory")


def write_import(directory, report, queue):
    # A content-addressed bundle never replaces a previously published bundle.
    files = {"receipt.json": canonical_bytes(report), "execution.json": canonical_bytes(queue["execution"]),
             "queue.json": canonical_bytes(queue), "queue.md": render_queue(queue)}
    target = directory / monitor.digest(files["queue.json"])
    directory.mkdir(parents=True, exist_ok=True)
    if target.exists():
        if {path.name for path in target.iterdir()} != set(files) or any((target / name).read_bytes() != content for name, content in files.items()):
            raise ValueError("Immutable import collision")
        return target
    with tempfile.TemporaryDirectory(prefix=".import-", dir=directory) as temporary:
        staging = Path(temporary) / "bundle"
        staging.mkdir()
        for name, content in files.items():
            (staging / name).write_bytes(content)
        os.rename(staging, target)
    return target


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    inputs = parser.add_mutually_exclusive_group(required=True)
    inputs.add_argument("--receipt", type=Path, help="Previously saved report JSON")
    inputs.add_argument("--job-log", type=Path, help="Observe job log containing one JSON/hash pair")
    parser.add_argument("--sha256", required=True, help="Independently verified canonical report hash")
    parser.add_argument("--execution", type=Path, required=True, help="Verified canonical run and observe-job metadata")
    parser.add_argument("--head-sha", required=True, help="Independently verified trusted-main execution commit")
    parser.add_argument("--as-of", required=True, help="Explicit timestamp for reproducible queue freshness")
    parser.add_argument("--output-dir", type=Path, default=ROOT / "tmp/source-monitor/imports")
    args = parser.parse_args()
    try:
        input_path = args.receipt or args.job_log
        validate_output_directory(args.output_dir, [input_path, args.execution])
        report = read_receipt(input_path, args.sha256, job_log=bool(args.job_log))
        execution = strict_json(bounded_read(args.execution))
        validate_execution(execution, report, args.head_sha, args.as_of)
        catalog = strict_json((ROOT / "data/mcps.json").read_bytes())
        curated = strict_json((ROOT / "data/listing-evidence.json").read_bytes())
        queue = build_queue(report, execution, args.sha256, args.as_of, catalog, curated)
        target = write_import(args.output_dir, report, queue)
    except (ValueError, KeyError, TypeError, OSError) as error:
        parser.error(str(error))
    print(json.dumps({"bundle": str(target), "receiptSha256": args.sha256, "listingCount": len(queue["entries"]),
                      "sourceCount": sum(len(entry["sources"]) for entry in queue["entries"]), "publication": "review_required"}, sort_keys=True))


if __name__ == "__main__":
    main()
