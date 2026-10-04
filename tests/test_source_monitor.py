import copy
import importlib.util
import json
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path
from unittest.mock import Mock, patch

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location("monitor", ROOT / "scripts/monitor_sources.py")
monitor = importlib.util.module_from_spec(spec)
spec.loader.exec_module(monitor)
NOW = "2026-10-04T22:00:00Z"
URL = "https://github.com/example/mcp"


def cached_success(body=b"source"):
    observation = monitor.observe(200, {"etag": '"v1"', "last-modified": "Sun, 04 Oct 2026 20:00:00 GMT"}, body, {}, NOW)
    return monitor.update_cache({}, observation)


def robots_fixture(text="User-agent: *\nAllow: /\n"):
    return {host: {"checkedAt": monitor.stamp(), "httpStatus": 200, "state": "available", "text": text,
                   "contentHash": monitor.digest(text.encode()), "receivedBytes": len(text), "durationMs": 0}
            for host in monitor.ALLOWED_HOSTS}


class SourceMonitorTests(unittest.TestCase):
    def setUp(self):
        self.catalog = json.loads((ROOT / "data/mcps.json").read_text())
        self.curated = json.loads((ROOT / "data/listing-evidence.json").read_text())

    def test_full_inventory_keeps_every_slug_and_deduplicates_only_urls(self):
        listings, sources, rejected = monitor.inventory(self.catalog, self.curated)
        self.assertEqual([x["slug"] for x in listings], [x["slug"] for x in self.catalog])
        self.assertEqual(len(listings), 616)
        self.assertEqual(len(sources), 585)
        self.assertEqual(rejected, [])
        neon = sources["https://github.com/neondatabase/mcp-server-neon"]
        self.assertEqual({x["slug"] for x in neon["relationships"]}, {"neon-mcp", "neon-mcp-server"})
        self.assertTrue(all(x["identityEvidence"] == "unknown" for x in neon["relationships"]))
        report = monitor.build_report(listings, sources, [], {}, NOW, 0, "dry_run", {url: "dry_run" for url in sources}, 7)
        self.assertEqual(report["summary"]["stateCounts"], {"not_checked": 585})
        self.assertEqual(report["inventoryFindings"][0]["id"], "neon-mcp")
        self.assertIsNone(report["assessment"]["score"])
        self.assertIsNone(report["assessment"]["totalApplicableCriteria"])

    def test_normalization_and_source_identity_do_not_substitute_publishers(self):
        self.assertEqual(monitor.normalize_url("https://www.github.com/Example/MCP.git/"), URL)
        _, sources, _ = monitor.inventory(self.catalog, self.curated)
        indexed = sources["https://github.com/community/heap-mcp"]
        alternative = sources["https://github.com/rivit-studio/heap-mcp-server"]
        self.assertEqual(indexed["relationships"][0]["identityEvidence"], "unknown")
        self.assertEqual(alternative["relationships"][0]["identityEvidence"], "community")
        self.assertEqual(alternative["relationships"][0]["basis"], "documented")

    def test_rejects_private_credentials_queries_and_ambiguous_paths(self):
        for url in ["http://github.com/e/r", "https://localhost/a", "https://127.0.0.1/a", "https://[::1]/a",
                    "https://github.com@127.0.0.1/a", "https://u:p@github.com/e/r", "https://github.com:444/e/r",
                    "https://github.com/e/r?api_key=secret", "https://github.com/e/r#token", "https://github.com/e/%2e%2e",
                    "https://github.com/e/../r", "https://github.com/e/r\r\nAuthorization: secret", "https://github.com.evil.test/e/r"]:
            with self.subTest(url=url), self.assertRaises(ValueError):
                monitor.normalize_url(url)
        bad = [{"id": "example", "slug": "example", "repo": "https://u:secret@github.com/e/r"}]
        _, sources, rejected = monitor.inventory(bad, [])
        self.assertEqual(sources, {})
        self.assertNotIn("secret", json.dumps(rejected))

    def test_dns_blocks_mixed_private_resolution_and_connection_pins_ip_with_tls(self):
        answers = [(2, 1, 6, "", ("140.82.114.3", 443)), (2, 1, 6, "", ("10.0.0.1", 443))]
        with patch.object(monitor.socket, "getaddrinfo", return_value=answers), self.assertRaises(ValueError):
            monitor.public_addresses("github.com")
        with patch.object(monitor.socket, "getaddrinfo", return_value=[(2, 1, 6, "", ("224.0.0.1", 443))]), self.assertRaises(ValueError):
            monitor.public_addresses("github.com")
        connection = monitor.PinnedHTTPSConnection("github.com", "140.82.114.3", 8)
        connection._context = Mock()
        sock = Mock()
        with patch.object(monitor.socket, "create_connection", return_value=sock) as connect:
            connection.connect()
        connect.assert_called_once_with(("140.82.114.3", 443), 8)
        connection._context.wrap_socket.assert_called_once_with(sock, server_hostname="github.com")

    def test_fetch_uses_only_public_get_and_safe_conditional_headers(self):
        connection = Mock()
        response = connection.getresponse.return_value
        response.status = 304; response.getheaders.return_value = []; response.read.return_value = b""
        previous = cached_success()
        previous["lastSuccessfulObservation"]["etag"] = 'bad\r\nAuthorization: secret'
        with patch.object(monitor, "public_addresses", return_value=["140.82.114.3"]), patch.object(monitor, "PinnedHTTPSConnection", return_value=connection):
            monitor.fetch_source(URL, previous)
        args, kwargs = connection.request.call_args
        self.assertEqual(args, ("GET", "/example/mcp"))
        self.assertNotIn("If-None-Match", kwargs["headers"])
        self.assertIn("If-Modified-Since", kwargs["headers"])
        self.assertNotIn("Authorization", kwargs["headers"])
        self.assertNotIn("Cookie", kwargs["headers"])
        response.read.assert_called_once_with(monitor.MAX_BODY_BYTES + 1)

    def test_304_needs_prior_complete_body_and_retains_original_hash(self):
        previous = cached_success()
        observation = monitor.observe(304, {}, b"", previous, "2026-10-05T22:00:00Z")
        self.assertEqual(observation["contentHash"], previous["observation"]["contentHash"])
        self.assertEqual(observation["state"], "reachable")
        self.assertEqual(observation["httpStatus"], 304)
        self.assertEqual(monitor.observe(304, {}, b"", {}, NOW)["state"], "unknown")

    def test_status_classification_never_turns_blocks_or_partial_reads_into_dead_sources(self):
        for status in [401, 403, 429, 500, 301, 206]:
            self.assertEqual(monitor.observe(status, {}, b"", {}, NOW)["state"], "unknown")
        self.assertEqual(monitor.observe(404, {}, b"", {}, NOW)["state"], "missing_at_check")
        self.assertEqual(monitor.observe(410, {}, b"", {}, NOW)["state"], "missing_at_check")
        self.assertEqual(monitor.observe(200, {}, b"x" * (monitor.MAX_BODY_BYTES + 1), {}, NOW)["state"], "unknown")
        self.assertEqual(monitor.observe(429, {"retry-after": "7200"}, b"", {}, NOW)["retryAfterSeconds"], 7200)

    def test_attempt_and_success_dates_remain_separate_and_findings_survive_recovery(self):
        previous = cached_success()
        blocked = monitor.observe(403, {}, b"", previous, "2026-10-05T22:00:00Z")
        cached = monitor.update_cache(previous, blocked)
        self.assertEqual(cached["observation"]["checkedAt"], "2026-10-05T22:00:00Z")
        self.assertEqual(cached["lastSuccessfulObservation"]["checkedAt"], NOW)
        missing = monitor.update_cache(cached, monitor.observe(404, {}, b"", cached, "2026-10-06T22:00:00Z"))
        recovered = monitor.update_cache(missing, monitor.observe(200, {}, b"new", missing, "2026-10-07T22:00:00Z"))
        self.assertEqual({x["kind"] for x in recovered["reviewFindings"]}, {"source_missing_at_check", "source_body_changed"})
        self.assertTrue(all(x["resolution"] == "review_required" for x in recovered["reviewFindings"]))

    def test_budget_and_host_backoff_limit_actual_coverage(self):
        sources = {URL: {"priority": False}, URL+"2": {"priority": False}, "https://docs.cursor.com/en/context/mcp": {"priority": False}}
        fetch = Mock(return_value=(403, {}, b""))
        cache, attempts, skipped = monitor.run_checks(sources, {}, 1, 1200, 7, robot_policies=robots_fixture(), fetch=fetch, wait=lambda _: None)
        self.assertEqual(attempts, 1)
        self.assertEqual(fetch.call_count, 1)
        self.assertIn("host_backoff", skipped.values())
        self.assertIn("run_budget", skipped.values())
        retry_fetch = Mock(return_value=(200, {}, b""))
        _, attempts, _ = monitor.run_checks(sources, cache, 120, 1200, 7, robot_policies=robots_fixture(), fetch=retry_fetch, wait=lambda _: None)
        self.assertEqual(attempts, 1)  # only the other host; GitHub's persisted cooldown remains active

    def test_daily_priority_weekly_rest_and_polite_host_interval(self):
        now = datetime.now(timezone.utc)
        cached = cached_success()
        for key in ("observation", "lastSuccessfulObservation"):
            cached[key]["checkedAt"] = monitor.stamp(now - timedelta(hours=25))
        sources = {URL: {"priority": True}, URL+"2": {"priority": True}, URL+"3": {"priority": False}}
        cache = {url: copy.deepcopy(cached) for url in sources}
        tick = [0.0]
        pauses = []
        def wait(seconds): pauses.append(seconds); tick[0] += seconds
        fetch = Mock(return_value=(304, {}, b""))
        _, attempts, skipped = monitor.run_checks(sources, cache, 120, 1200, 7, robot_policies=robots_fixture(), fetch=fetch, wait=wait, clock=lambda: tick[0])
        self.assertEqual(attempts, 2)
        self.assertEqual(pauses, [1.0])
        self.assertEqual(skipped[URL+"3"], "fresh_cache")

    def test_cache_validation_fails_closed_and_immutable_runs_do_not_overwrite(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory)/"cache.json"
            data = {"schemaVersion": 1, "policyVersion": monitor.POLICY_VERSION, "sources": {URL: cached_success()}}
            path.write_text(json.dumps(data)); self.assertIn(URL, monitor.read_cache(path, {URL: {}}))
            data["sources"][URL]["observation"]["credential"] = "secret"
            path.write_text(json.dumps(data))
            with self.assertRaises(ValueError): monitor.read_cache(path, {URL: {}})
            first = monitor.write_immutable_run(Path(directory)/"runs", {"generatedAt": NOW, "value": 1})
            monitor.write_immutable_run(Path(directory)/"runs", {"generatedAt": NOW, "value": 1})
            second = monitor.write_immutable_run(Path(directory)/"runs", {"generatedAt": NOW, "value": 2})
            self.assertNotEqual(first, second)
            self.assertEqual(json.loads(first.read_text())["value"], 1)

    def test_report_rejects_scores_or_paid_publication_and_schema_matches_states(self):
        listings, sources, rejected = monitor.inventory(self.catalog, self.curated)
        report = monitor.build_report(listings, sources, rejected, {}, NOW, 0, "dry_run", {}, 7)
        for mutate in [lambda r: r["assessment"].update(score=0.9), lambda r: r["assessment"].update(paidProviderEnabled=True),
                       lambda r: r["publication"].update(catalogWritten=True)]:
            bad = copy.deepcopy(report); mutate(bad)
            with self.assertRaises(ValueError): monitor.validate_report(bad)
        schema = json.loads((ROOT / "documents/source-monitor-report.schema.json").read_text())
        self.assertEqual(set(schema["$defs"]["observation"]["properties"]["state"]["enum"]), monitor.STATES)
        self.assertEqual(set(schema["required"]), set(report))

    def test_summary_cannot_modify_catalog_or_collide_with_mutable_and_immutable_outputs(self):
        path = ROOT / "data/mcps.json"
        before = path.read_bytes()
        run = subprocess.run([sys.executable, str(ROOT / "scripts/monitor_sources.py"), "--dry-run", "--summary", str(path)], capture_output=True)
        self.assertEqual(run.returncode, 2)
        self.assertEqual(path.read_bytes(), before)
        cache, output, runs = [ROOT / "tmp/source-monitor" / name for name in ("cache.json", "report.json", "runs")]
        with self.assertRaises(ValueError): monitor.validate_output_paths(cache, output, runs, cache)
        with self.assertRaises(ValueError): monitor.validate_output_paths(cache, runs / "report.json", runs)
        monitor.validate_output_paths(cache, output, runs, Path(tempfile.gettempdir()) / "github-step-summary")

    def test_contradictory_cache_and_timeout_do_not_become_success(self):
        cached = cached_success()
        cached["observation"]["httpStatus"] = 404
        self.assertFalse(monitor.valid_observation(cached["observation"]))
        fetch = Mock(side_effect=TimeoutError())
        cache, attempts, _ = monitor.run_checks({URL: {"priority": False}}, {}, 1, 1200, 7, robot_policies=robots_fixture(), fetch=fetch)
        self.assertEqual(cache[URL]["observation"]["reason"], "timeout")
        self.assertEqual(cache[URL]["observation"]["state"], "unknown")
        self.assertIsNone(cache[URL]["lastSuccessfulObservation"])

    def test_robots_wildcard_refuses_tree_without_fetching_it_and_honors_delay(self):
        tree = "https://github.com/modelcontextprotocol/servers/tree/main/src/memory"
        sources = {URL: {"priority": False}, URL+"2": {"priority": False}, tree: {"priority": False}}
        fetch = Mock(return_value=(200, {}, b"source"))
        tick = [0.0]; pauses = []
        def wait(seconds): pauses.append(seconds); tick[0] += seconds
        _, attempts, skipped = monitor.run_checks(sources, {}, 120, 1200, 7,
            robot_policies=robots_fixture("User-agent: *\nDisallow: /*/tree/\nCrawl-delay: 2\n"),
            fetch=fetch, wait=wait, clock=lambda: tick[0])
        self.assertEqual(attempts, 2)
        self.assertEqual(skipped[tree], "robots_disallowed")
        self.assertNotIn(tree, [call.args[0] for call in fetch.call_args_list])
        self.assertEqual(pauses, [2.0])

    def test_robots_unknown_withholds_source_get_and_records_only_policy_request(self):
        fetch = Mock(return_value=(503, {}, b"unavailable"))
        metrics, policies = {}, {}
        _, attempts, skipped = monitor.run_checks({URL: {"priority": False}}, {}, 120, 1200, 7,
            fetch=fetch, wait=lambda _: None, robot_policies=policies, metrics=metrics)
        self.assertEqual(attempts, 0)
        self.assertEqual(skipped[URL], "robots_unknown")
        self.assertEqual([call.args[0] for call in fetch.call_args_list], ["https://github.com/robots.txt"])
        self.assertEqual(metrics["robotsRequests"], 1)
        self.assertNotIn("text", {key: value for key, value in policies["github.com"].items() if key != "text"})

    def test_calendar_day_cadence_tolerates_scheduler_jitter(self):
        now = datetime.now(timezone.utc)
        observation = cached_success()["observation"]
        observation["checkedAt"] = monitor.stamp(now - timedelta(hours=23, minutes=59))
        self.assertTrue(monitor.is_due({"priority": True}, observation, now, 7))
        observation["checkedAt"] = monitor.stamp(now - timedelta(days=7, minutes=-1))
        self.assertTrue(monitor.is_due({"priority": False}, observation, now, 7))


if __name__ == "__main__":
    unittest.main()
