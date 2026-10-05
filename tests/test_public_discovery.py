"""Adversarial evidence acceptance against actual owned HTTP fixtures; no live targets."""
import copy
import json
import signal
import socket
import subprocess
import sys
import time
import unittest
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import discovery_contract as contract
import run_discovery_fixtures as runner

CLOCK = "2026-10-05T00:00:00Z"
CASES = {c["id"]: c for c in json.loads(runner.FIXTURES.read_text())["cases"]}


def run(name, **kwargs):
    return runner.run_case(copy.deepcopy(CASES[name]), CLOCK, **kwargs)


def reply(result, **kwargs):
    return {"message": {"jsonrpc": "2.0", "id": "$requestId", "result": result}, **kwargs}


class DiscoveryAcceptance(unittest.TestCase):
    def test_modern_metadata_and_sse_pagination(self):
        for name, count in (("modern-json", 1), ("modern-sse-pages", 2)):
            with self.subTest(case=name), runner.OwnedFixture(CASES[name]) as fixture:
                for i, method in enumerate(("server/discover", "tools/list", "resources/list"), 1):
                    obs, result, session = runner.exchange(fixture, "2026-07-28", method, i)
                    self.assertEqual(obs["outcome"], "observed")
                    self.assertIsNotNone(result)
                    self.assertIsNone(session)
                for call in fixture.calls:
                    meta = call["message"]["params"]["_meta"]
                    self.assertEqual(meta[contract.META_PREFIX + "protocolVersion"], "2026-07-28")
                    self.assertEqual(meta[contract.META_PREFIX + "clientCapabilities"], {})
                    self.assertEqual(call["headers"]["Mcp-Method"], call["message"]["method"])
            result = run(name)
            self.assertEqual(result["discovery"]["state"], "declared")
            self.assertEqual(result["tools"]["value"], {"count": count, "complete": True})
            self.assertEqual(result["apps"]["state"], "declared")
            self.assertFalse(result["apps"]["value"]["negotiated"])
            self.assertEqual(result["toolDeclarations"][0]["outputSchema"]["value"]["type"], "array")

    def test_legacy_initialize_session_and_stateless_are_separate(self):
        for name, session in (("legacy-session", True), ("legacy-stateless-sse", False)):
            report = run(name)
            self.assertEqual(report["discovery"]["state"], "declared")
            self.assertEqual([e["method"] for e in report["exchanges"]],
                             ["initialize", "notifications/initialized", "tools/list", "resources/list"])
            self.assertEqual(report["exchanges"][0]["sessionAssigned"], session)
            self.assertNotIn("fixture-session-only", contract.canonical(report).decode())
            self.assertTrue(all(e["cacheHint"] is None for e in report["exchanges"]))

    def test_unknowns_cannot_become_passes_or_badges(self):
        expected = {"auth-challenge": "authentication_required", "redirect": "redirect_refused",
                    "unsupported-version": "unsupported_version", "missing-method": "peer_rpc_error",
                    "truncated-json": "invalid_or_truncated_json", "oversized-body": "body_limit",
                    "encoded-body": "encoded_body_refused", "unsupported-legacy-version": "unsupported_negotiated_version",
                    "modern-session-refused": "unexpected_modern_session", "stdio-disabled": "unsupported_profile",
                    "http-sse-disabled": "unsupported_profile"}
        for name, reason in expected.items():
            with self.subTest(case=name):
                report = run(name)
                self.assertEqual(report["discovery"], contract.unknown(reason))
                self.assertIsNone(report["assessments"]["score"])
                self.assertIsNone(report["assessments"]["badge"])
                self.assertIsNone(report["assessments"]["applicableDenominator"])
                self.assertFalse(report["publication"]["eligible"])
                self.assertLessEqual(len(report["exchanges"]), 1)

    def test_auth_is_only_a_public_challenge_not_registration_or_credential_proof(self):
        report = run("auth-challenge")
        challenge = report["exchanges"][0]["authChallenge"]
        self.assertEqual(challenge["scheme"], "Bearer")
        self.assertEqual(challenge["resourceMetadataUri"], "https://auth.example.test/.well-known/oauth-protected-resource")
        self.assertFalse(challenge["followed"])
        self.assertFalse(report["auth"]["authenticationVerified"])
        partial = run("auth-tools-only")
        self.assertEqual(partial["discovery"]["state"], "declared")
        self.assertEqual(partial["tools"]["state"], "unknown")
        self.assertEqual(partial["resources"]["state"], "declared")

    def test_partial_pages_and_repeated_cursors_preserve_partial_declarations_without_count(self):
        for name, reason in (("partial-pages", "invalid_or_truncated_json"),
                             ("repeated-cursor", "repeated_cursor"), ("truncated-sse", "truncated_sse")):
            report = run(name)
            self.assertEqual(report["tools"], contract.unknown(reason))
            self.assertEqual(len(report["toolDeclarations"]), 0 if name == "truncated-sse" else (1 if name == "partial-pages" else 2))
            self.assertIsNone(report["assessments"]["score"])

    def test_optional_capability_absence_is_not_failure(self):
        report = run("optional-absent")
        self.assertEqual(report["tools"]["state"], "not_declared")
        self.assertEqual(report["resources"]["state"], "not_declared")
        self.assertEqual(len(report["exchanges"]), 1)

    def test_private_cache_is_a_hint_and_never_shared_or_replayed(self):
        report = run("private-cache")
        self.assertEqual(report["exchanges"][1]["cacheHint"], {"scope": "private", "ttlMs": 60000, "reused": False})
        self.assertFalse(report["cache"]["enabled"])
        self.assertFalse(report["publication"]["eligible"])

    def test_external_schema_refs_and_unsupported_dialects_remain_unknown_without_fetch(self):
        with patch.object(socket, "getaddrinfo", side_effect=AssertionError("DNS prohibited")):
            for name, reason in (("external-schema", "references_not_resolved"),
                                 ("unsupported-schema-dialect", "unsupported_schema_dialect")):
                report = run(name)
                schema = report["toolDeclarations"][0]["inputSchema"]
                self.assertEqual(schema["state"], "unknown")
                self.assertEqual(schema["reason"], reason)
                self.assertEqual(schema["instanceValidation"], "disabled")

    def test_wrong_ids_duplicate_json_and_result_types_are_inconclusive(self):
        for raw, reason in ((b'{"jsonrpc":"2.0","id":true,"result":{}}', "response_id_mismatch"),
                            (b'{"jsonrpc":"2.0","id":1,"id":1,"result":{}}', "duplicate_json_key"),
                            (b'{"jsonrpc":"2.0","id":1,"result":{},"error":{}}', "invalid_jsonrpc_envelope"),
                            (b'{"jsonrpc":"2.0","id":1,"method":"sampling/create"}', "client_interaction_required")):
            with self.assertRaisesRegex(ValueError, reason):
                contract.response_message(raw, "application/json", 1)
        case = copy.deepcopy(CASES["modern-json"])
        case["replies"]["server/discover"][0]["message"]["result"]["resultType"] = "input_required"
        self.assertEqual(runner.run_case(case, CLOCK)["discovery"]["reason"], "unsupported_result_type")

    def test_current_official_cache_fields_required_separately_from_legacy(self):
        for field in ("ttlMs", "cacheScope", "resultType"):
            case = copy.deepcopy(CASES["modern-json"])
            del case["replies"]["server/discover"][0]["message"]["result"][field]
            self.assertEqual(runner.run_case(case, CLOCK)["discovery"]["state"], "unknown")
        case = copy.deepcopy(CASES["modern-json"])
        case["replies"]["server/discover"][0]["message"]["result"]["ttlMs"] = -1
        self.assertEqual(runner.run_case(case, CLOCK)["discovery"]["state"], "unknown")

    def test_page_item_and_duplicate_limits(self):
        case = copy.deepcopy(CASES["modern-json"])
        base = case["replies"]["tools/list"][0]["message"]["result"]
        t = copy.deepcopy(base["tools"][0])
        case["replies"]["tools/list"] = [reply({**base, "tools": [{**t, "name": f"tool{i}"}], "nextCursor": f"page-{i+1}"}) for i in range(4)]
        report = runner.run_case(case, CLOCK)
        self.assertEqual(report["tools"]["reason"], "page_limit")
        self.assertEqual(len(report["toolDeclarations"]), 3)
        self.assertLessEqual(len(report["exchanges"]), contract.MAX_REQUESTS)
        base["tools"] = [{**t, "name": f"tool{i}"} for i in range(41)]
        case["replies"]["tools/list"] = [reply(base)]
        self.assertEqual(runner.run_case(case, CLOCK)["tools"]["reason"], "item_limit")
        base["tools"] = [t, t]
        self.assertEqual(runner.run_case(case, CLOCK)["tools"]["reason"], "duplicate_catalogue_identity")

    def test_deadline_applies_to_trickle_body_and_restores_signal_state(self):
        case = copy.deepcopy(CASES["modern-json"])
        case["replies"]["server/discover"][0].update(trickle=True, delaySeconds=0.02, omitLength=True)
        handler = signal.getsignal(signal.SIGALRM)
        start = time.monotonic()
        report = runner.run_case(case, CLOCK, timeout=0.1)
        self.assertLess(time.monotonic() - start, 0.8)
        self.assertEqual(report["discovery"]["reason"], "request_deadline")
        self.assertEqual(signal.getsignal(signal.SIGALRM), handler)

    def test_header_limit_and_unknown_size_body_limit(self):
        case = copy.deepcopy(CASES["modern-json"])
        first = case["replies"]["server/discover"][0]
        first["headers"] = {"X-Fixture": "x" * 8200}
        self.assertEqual(runner.run_case(case, CLOCK)["discovery"]["reason"], "header_limit")
        first.pop("headers")
        first.update(paddingBytes=65536, omitLength=True)
        self.assertEqual(runner.run_case(case, CLOCK)["discovery"]["reason"], "body_limit")

    def test_body_structure_numeric_and_schema_bounds(self):
        for raw in (b'{"a":NaN}', b'{"a":Infinity}', b'{"a":1e999}', b'\xff'):
            with self.assertRaises(ValueError):
                contract.strict_json(raw)
        with self.assertRaises(ValueError):
            contract.strict_json(("[" * 26 + "0" + "]" * 26).encode())
        schema = contract.schema_declaration({"type": "object", "description": "x" * 17000})
        self.assertEqual(schema["reason"], "schema_size_limit")
        self.assertIsNone(schema["value"])
        self.assertEqual(contract.schema_declaration({"type": "object", "properties": []})["state"], "unknown")

    def test_no_endpoint_cli_and_no_tool_or_execution_methods(self):
        for version in contract.VERSIONS:
            for method in ("tools/call", "resources/read", "prompts/get", "sampling/create", "ui/initialize", "register", "subscriptions/listen"):
                with self.assertRaises(ValueError):
                    contract.request(version, method, 1)
        with self.assertRaisesRegex(ValueError, "owned_fixture_required"):
            runner.exchange("https://example.com/mcp", "2026-07-28", "server/discover", 1)
        proc = subprocess.run([sys.executable, str(ROOT / "scripts/run_discovery_fixtures.py"), "--url", "https://example.com/mcp"], capture_output=True)
        self.assertEqual(proc.returncode, 2)

    def test_report_attribution_and_immutable_semantics_reject_forgery(self):
        report = run("modern-json")
        self.assertEqual(contract.canonical(report), contract.canonical(run("modern-json")))
        for mutate in (lambda r: r["publication"].update(eligible=True),
                       lambda r: r["assessments"].update(score=100),
                       lambda r: r["attribution"].update(listingRelationship={"slug": "heap-mcp"}),
                       lambda r: r["tools"]["citations"][0].update(responseSha256="0" * 64),
                       lambda r: r["tools"]["value"].update(count=100),
                       lambda r: r.update(observedAt="2026-02-30T00:00:00Z")):
            changed = copy.deepcopy(report); mutate(changed)
            with self.assertRaises(Exception):
                contract.validate_evidence(changed)
        self.assertEqual(report["attribution"]["fixtureSha256"], contract.sha(contract.canonical(CASES["modern-json"])))

    def test_every_committed_case_validates_with_unknown_runtime_and_zero_publication(self):
        for case in CASES.values():
            with self.subTest(case=case["id"]):
                report = runner.run_case(case, CLOCK)
                contract.validate_evidence(report)
                self.assertEqual(report["assessments"]["runtime"], "unknown")
                self.assertEqual(report["assessments"]["security"], "unknown")
                self.assertEqual(report["publication"]["state"], "review_required")


if __name__ == "__main__":
    unittest.main()
