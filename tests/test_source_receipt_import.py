import copy
import json
import subprocess
import sys
import tempfile
import unittest
from collections import Counter
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import import_source_receipt as importer
import monitor_sources as monitor

SNAPSHOT = ROOT / "documents/source-monitor-reviews/2026-10-04-manual"
HASH = "2196cc1d41678e4ac23cda41751bfb5eceb6a2c114dc6a6a53ebda070c87d347"
HEAD = "a3f2affc5a8e354428ecc66ed11c33ea1ec4dca8"
AS_OF = "2026-10-04T23:15:00Z"


class SourceReceiptImportTests(unittest.TestCase):
    def setUp(self):
        self.report = json.loads((SNAPSHOT / "receipt.json").read_text())
        self.execution = json.loads((SNAPSHOT / "execution.json").read_text())
        self.catalog = json.loads((ROOT / "data/mcps.json").read_text())
        self.curated = json.loads((ROOT / "data/listing-evidence.json").read_text())

    def queue(self, report=None, as_of=AS_OF):
        report = self.report if report is None else report
        return importer.build_queue(report, self.execution, monitor.digest(importer.canonical_bytes(report)), as_of, self.catalog, self.curated)

    def source(self, url):
        return next(source for source in self.report["sources"] if source["url"] == url)

    def recount(self):
        sources = self.report["sources"]
        summary = self.report["summary"]
        summary["stateCounts"] = dict(Counter(source["observation"]["state"] if source["observation"] else "not_checked" for source in sources))
        summary["staleOrUnchecked"] = sum(source["stale"] for source in sources)
        summary["attemptsThisRun"] = sum(source["runDisposition"] == "checked_this_run" for source in sources)
        summary["httpRequestsThisRun"] = summary["attemptsThisRun"] + summary["robotsRequestsThisRun"]

    def test_actual_receipt_hash_schema_and_reproducible_snapshot(self):
        report = importer.read_receipt(SNAPSHOT / "receipt.json", HASH)
        self.assertEqual(report, self.report)
        importer.validate_execution(self.execution, report, HEAD, AS_OF)
        queue = self.queue()
        self.assertEqual(importer.canonical_bytes(queue), (SNAPSHOT / "queue.json").read_bytes())
        self.assertEqual(importer.render_queue(queue), (SNAPSHOT / "queue.md").read_bytes())
        self.assertEqual(report["summary"]["stateCounts"], {"reachable": 38, "missing_at_check": 77, "unknown": 5, "not_checked": 465})

    def test_all_routes_urls_and_neon_collision_are_preserved(self):
        queue = self.queue()
        self.assertEqual(len(self.report["listings"]), 616)
        self.assertEqual(len({item["id"] for item in self.report["listings"]}), 615)
        indexed = {source["url"] for source in self.report["sources"] if any(relation["role"] == "indexed_repository" for relation in source["relationships"])}
        references = {source["url"] for source in self.report["sources"] if any(relation["role"] == "separate_reference" for relation in source["relationships"])}
        self.assertEqual((len(indexed), len(references), len(indexed | references)), (578, 7, 585))
        self.assertEqual(queue["inventoryFindings"], [{"id": "neon-mcp", "kind": "duplicate_listing_id", "resolution": "review_required", "slugs": ["neon-mcp-server", "neon-mcp"]}])
        self.assertEqual({r["slug"] for r in self.source("https://github.com/neondatabase/mcp-server-neon")["relationships"]}, {"neon-mcp", "neon-mcp-server"})

    def test_priority_joins_citations_and_curated_cautions_survive(self):
        queue = self.queue()
        self.assertEqual([entry["slug"] for entry in queue["entries"]], list(importer.PRIORITY_SLUGS))
        rows = [row for entry in queue["entries"] for row in entry["sources"]]
        self.assertEqual(len(rows), 12)
        self.assertEqual(Counter(row["availabilityState"] for row in rows), {"missing_at_check": 5, "reachable": 7})
        for entry in queue["entries"]:
            self.assertEqual(entry["listingUrl"], f"https://everymcp.com/mcp/{entry['slug']}")
            self.assertEqual(entry["publisherAssessment"], "unknown")
            for row in entry["sources"]:
                self.assertEqual((row["relationship"]["id"], row["relationship"]["slug"]), (entry["id"], entry["slug"]))
                original = self.report["sources"][int(row["reportPointer"].split("/")[-1])]
                self.assertEqual(row["allRelationships"], original["relationships"])
                self.assertEqual(importer.monitor.normalize_url(row["sourceCitation"]), row["url"])
                self.assertEqual(row["publicEvidenceComparison"], "same_observed_availability")
                if row["relationship"]["role"] == "indexed_repository":
                    self.assertEqual(row["relationship"]["identityEvidence"], "unknown")
                    self.assertIsNone(row["lastSuccessfulObservation"])
        text = importer.render_queue(queue).decode()
        for phrase in ("Archived by its owner on October 2, 2026", "destructive user deletion", "no built-in authentication", "legacy Hotjar account"):
            self.assertIn(phrase, text)
        self.assertIn("https://github.com/RevenueCat/revenuecat-mcp", text)
        self.assertEqual(queue["publication"]["mode"], "review_required")
        for field in ("score", "badge", "totalApplicableCriteria", "protocolVersion"):
            self.assertIsNone(queue["assessment"][field])

    def test_job_log_extraction_ignores_echoes_and_refuses_ambiguity(self):
        payload = importer.canonical_bytes(self.report).decode().strip()
        log = ("2026-10-04T22:41:27Z print('SOURCE_RUN_SHA256', value)\n"
               f"2026-10-04T22:41:27.1Z SOURCE_RUN_SHA256 {HASH}\n"
               f"2026-10-04T22:41:27.2Z SOURCE_RUN_JSON {payload}\n")
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "job.log"
            path.write_text(log)
            self.assertEqual(importer.read_receipt(path, HASH, job_log=True), self.report)
            for malformed in (log + f"SOURCE_RUN_SHA256 {HASH}\n", log + f"SOURCE_RUN_JSON {payload}\n", log.replace(HASH, "0" * 64), log.replace("SOURCE_RUN_JSON", "OTHER_JSON")):
                path.write_text(malformed)
                with self.assertRaises(ValueError):
                    importer.read_receipt(path, HASH, job_log=True)

    def test_hash_schema_duplicate_keys_and_nonfinite_values_fail_closed(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "receipt.json"
            path.write_text(json.dumps(self.report, indent=2))
            self.assertEqual(importer.read_receipt(path, HASH), self.report)
            with self.assertRaises(ValueError):
                importer.read_receipt(path, "0" * 64)
            for mutate in (lambda r: r.update(extra="unexpected"), lambda r: r["assessment"].update(score=0.9), lambda r: r["publication"].update(catalogWritten=True)):
                report = copy.deepcopy(self.report)
                mutate(report)
                content = importer.canonical_bytes(report)
                path.write_bytes(content)
                with self.assertRaises(ValueError):
                    importer.read_receipt(path, monitor.digest(content))
        for content in ('{"value":1,"value":2}', '{"value":NaN}', '{"value":Infinity}'):
            with self.assertRaises(ValueError):
                importer.strict_json(content)

    def test_untrusted_or_inconsistent_execution_is_rejected(self):
        mutations = (lambda e: e.update(repository="tylerdr/praxium"), lambda e: e.update(workflowPath="other.yml"),
                     lambda e: e["run"].update(event="pull_request"), lambda e: e["run"].update(headBranch="feature/other"),
                     lambda e: e["run"].update(headSha="0" * 40), lambda e: e["run"].update(conclusion="failure"),
                     lambda e: e["job"].update(runId=1), lambda e: e["job"].update(name="verify"),
                     lambda e: e["job"].update(url="https://github.com/other/repo"), lambda e: e["job"].update(status="in_progress"),
                     lambda e: e["job"].update(completedAt="2026-10-04T23:10:00Z"), lambda e: e["job"].update(id=True))
        for mutate in mutations:
            execution = copy.deepcopy(self.execution)
            mutate(execution)
            with self.subTest(execution=execution), self.assertRaises(ValueError):
                importer.validate_execution(execution, self.report, HEAD, AS_OF)
        for as_of in ("2026-10-04T22:00:00Z", "2026-10-04T23:15:00"):
            with self.assertRaises(ValueError):
                importer.validate_execution(self.execution, self.report, HEAD, as_of)

    def test_inventory_relationship_summary_and_freshness_tampering_is_rejected(self):
        mutations = (lambda r: r["sources"].append(copy.deepcopy(r["sources"][0])),
                     lambda r: r["sources"][0]["relationships"][0].update(slug="redash-mcp"),
                     lambda r: r["sources"][0]["relationships"][0].update(identityEvidence="community"),
                     lambda r: r["sources"][0].update(priority=False), lambda r: r["sources"][0].update(stale=True),
                     lambda r: r["sources"][0].update(runDisposition="fresh_cache"),
                     lambda r: r["summary"]["stateCounts"].update(reachable=39),
                     lambda r: r["summary"].update(attemptsThisRun=121), lambda r: r["summary"].update(robotsRequestsThisRun=7),
                     lambda r: r["summary"].update(httpRequestsThisRun=120), lambda r: r["summary"].update(receivedBytesThisRun=0),
                     lambda r: r["summary"].update(receivedBytesThisRun=999999999),
                     lambda r: r["summary"].update(requestDurationMsThisRun=1500001),
                     lambda r: r.update(inventoryFindings=[]), lambda r: r["sources"][0]["observation"].update(httpStatus=404),
                     lambda r: r["sources"][0]["lastSuccessfulObservation"].update(state="unknown"))
        for mutate in mutations:
            report = copy.deepcopy(self.report)
            mutate(report)
            with self.subTest(mutation=mutate), self.assertRaises(ValueError):
                self.queue(report)

    def test_unknown_failed_read_retains_prior_success_and_findings(self):
        source = self.source("https://github.com/rivit-studio/heap-mcp-server")
        prior = monitor.observe(200, {}, b"previous source", {}, "2026-10-03T22:00:00Z")
        previous = monitor.update_cache({}, prior)
        previous["reviewFindings"] = [{"kind": "source_missing_at_check", "firstObservedAt": "2026-10-02T22:00:00Z", "lastObservedAt": "2026-10-02T22:00:00Z", "resolution": "review_required"}]
        failed = monitor.observe(403, {}, b"", previous, "2026-10-04T22:40:00Z")
        source.update(monitor.update_cache(previous, failed))
        self.recount()
        queue = self.queue()
        row = next(row for entry in queue["entries"] for row in entry["sources"] if row["url"] == source["url"])
        self.assertEqual(row["availabilityState"], "unknown")
        self.assertEqual(row["observation"]["reason"], "blocked")
        self.assertEqual(row["lastSuccessfulObservation"], prior)
        self.assertEqual(row["reviewFindings"], previous["reviewFindings"])
        self.assertEqual(row["publicEvidenceComparison"], "inconclusive")
        self.assertIn("unknown / 403 · blocked", importer.render_queue(queue).decode())

    def test_unchecked_and_stale_are_separate_from_availability(self):
        source = self.source("https://www.revenuecat.com/docs/tools/mcp/setup")
        source.update(observation=None, lastSuccessfulObservation=None, stale=True, runDisposition="run_budget")
        self.recount()
        queue = self.queue(as_of="2026-10-05T00:00:00Z")
        rows = [row for entry in queue["entries"] for row in entry["sources"]]
        unchecked = next(row for row in rows if row["url"] == source["url"])
        self.assertEqual((unchecked["availabilityState"], unchecked["freshnessAsOf"], unchecked["runDisposition"]), ("not_checked", "unchecked", "run_budget"))
        self.assertTrue(all(row["freshnessAsOf"] == "stale" for row in rows if row != unchecked))
        self.assertEqual(Counter(row["availabilityState"] for row in rows), {"reachable": 6, "missing_at_check": 5, "not_checked": 1})
        self.assertIsNone(queue["assessment"]["score"])

    def test_recovered_source_keeps_unresolved_findings(self):
        source = self.source("https://github.com/redash/redash-mcp")
        previous = {key: source[key] for key in ("observation", "lastSuccessfulObservation", "reviewFindings")}
        source.update(monitor.update_cache(previous, monitor.observe(200, {}, b"recovered", previous, "2026-10-04T22:40:00Z")))
        self.recount()
        row = self.queue()["entries"][1]["sources"][0]
        self.assertEqual(row["availabilityState"], "reachable")
        self.assertEqual(row["publicEvidenceComparison"], "different_observed_availability")
        self.assertIn("source_missing_at_check", row["reviewReasons"])
        self.assertEqual(row["relationship"]["identityEvidence"], "unknown")

    def test_cli_replays_offline_and_never_writes_public_data(self):
        public_files = [ROOT / "data/mcps.json", ROOT / "data/listing-evidence.json"]
        before = [path.read_bytes() for path in public_files]
        with tempfile.TemporaryDirectory() as directory:
            args = [sys.executable, str(ROOT / "scripts/import_source_receipt.py"), "--receipt", str(SNAPSHOT / "receipt.json"),
                    "--sha256", HASH, "--execution", str(SNAPSHOT / "execution.json"), "--head-sha", HEAD, "--as-of", AS_OF,
                    "--output-dir", str(Path(directory) / "imports")]
            first = subprocess.run(args, capture_output=True, text=True)
            self.assertEqual(first.returncode, 0, first.stderr)
            bundle = Path(json.loads(first.stdout)["bundle"])
            self.assertEqual((bundle / "queue.json").read_bytes(), (SNAPSHOT / "queue.json").read_bytes())
            self.assertEqual(subprocess.run(args, capture_output=True).returncode, 0)
            (bundle / "queue.md").write_text("tampered")
            self.assertEqual(subprocess.run(args, capture_output=True).returncode, 2)
            for output in (ROOT / "data", ROOT / "documents", ROOT / "tmp/source-monitor/../source-review"):
                args[-1] = str(output)
                self.assertEqual(subprocess.run(args, capture_output=True).returncode, 2)
        self.assertEqual([path.read_bytes() for path in public_files], before)

    def test_output_symlinks_and_overlapping_inputs_are_rejected(self):
        with tempfile.TemporaryDirectory(dir=ROOT / "tmp/source-monitor") as directory:
            path = Path(directory)
            (path / "alias").symlink_to(ROOT / "data", target_is_directory=True)
            with self.assertRaises(ValueError):
                importer.validate_output_directory(path / "alias", [])
            with self.assertRaises(ValueError):
                importer.validate_output_directory(path, [path / "receipt.json"])

    def test_import_has_no_network_or_collector_calls(self):
        with patch.object(monitor, "fetch_source", side_effect=AssertionError("unexpected collection")), patch.object(monitor.socket, "getaddrinfo", side_effect=AssertionError("unexpected DNS")):
            self.queue()

    def test_midnight_crossing_keeps_start_disposition_and_end_freshness(self):
        self.execution["job"].update(startedAt="2026-10-04T23:59:00Z", completedAt="2026-10-05T00:01:10Z")
        self.execution["run"]["updatedAt"] = "2026-10-05T00:01:11Z"
        self.report["generatedAt"] = "2026-10-05T00:01:00Z"
        for source in self.report["sources"]:
            if source["observation"]:
                source["runDisposition"] = "fresh_cache"
            source["stale"] = source["observation"] is None or monitor.is_due(source, source["observation"], monitor.parse_date(self.report["generatedAt"]), 7)
        self.report["summary"].update(robotsRequestsThisRun=0, receivedBytesThisRun=0, requestDurationMsThisRun=0)
        self.recount()
        row = self.queue(as_of="2026-10-05T00:02:00Z")["entries"][0]["sources"][0]
        self.assertEqual((row["runDisposition"], row["staleAtReceipt"], row["freshnessAsOf"]), ("fresh_cache", True, "stale"))


if __name__ == "__main__":
    unittest.main()
