#!/usr/bin/env python3
"""Owned loopback HTTP fixtures only. Intentionally no URL, auth or live mode."""
import argparse
import copy
import http.client
import json
import signal
import socket
import threading
import time
from contextlib import contextmanager
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

import discovery_contract as contract

FIXTURES = contract.ROOT / "tests/fixtures/public-discovery.json"
REQUEST_SECONDS = 1.0
RUN_SECONDS = 8.0
MAX_HEADERS = 8192


class HeaderReader:
    """Bound status/header bytes before http.client parses them."""
    def __init__(self, reader):
        self.reader = reader
        self.header_bytes = 0
        self.headers = True

    def readline(self, limit=-1):
        if self.headers:
            line = self.reader.readline(min(limit if limit > 0 else MAX_HEADERS + 1, MAX_HEADERS + 1))
            self.header_bytes += len(line)
            if self.header_bytes > MAX_HEADERS:
                raise ValueError("header_limit")
            return line
        return self.reader.readline(limit)

    def __getattr__(self, name):
        return getattr(self.reader, name)


class BoundedResponse(http.client.HTTPResponse):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fp = HeaderReader(self.fp)

    def begin(self):
        super().begin()
        if self.fp is not None:
            self.fp.headers = False


class LoopbackConnection(http.client.HTTPConnection):
    response_class = BoundedResponse

    def connect(self):
        # Literal IPv4 socket: no proxy, resolver, redirects or environment credentials.
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.sock.settimeout(self.timeout)
        self.sock.connect(("127.0.0.1", self.port))
        if self.sock.getpeername() != ("127.0.0.1", self.port):
            raise ValueError("fixture_peer_mismatch")


@contextmanager
def deadline(seconds):
    if threading.current_thread() is not threading.main_thread():
        raise ValueError("fixture_runner_requires_main_thread")
    old_handler = signal.getsignal(signal.SIGALRM)
    old_timer = signal.getitimer(signal.ITIMER_REAL)
    def expired(_signum, _frame):
        raise TimeoutError("request_deadline")
    signal.signal(signal.SIGALRM, expired)
    signal.setitimer(signal.ITIMER_REAL, seconds)
    try:
        yield
    finally:
        signal.setitimer(signal.ITIMER_REAL, *old_timer)
        signal.signal(signal.SIGALRM, old_handler)


class OwnedFixture:
    """The runner creates and owns this exact listener; a hostname/URL is never accepted."""
    def __init__(self, case):
        self.case = copy.deepcopy(case)
        self.calls = []
        self.initialized = False
        self.ready = False
        self.method_counts = {}
        fixture = self

        class Handler(BaseHTTPRequestHandler):
            protocol_version = "HTTP/1.0"

            def log_message(self, *_args):
                pass

            def do_POST(self):
                try:
                    length = int(self.headers.get("Content-Length", "0"))
                    if self.path != "/mcp" or not 0 < length <= contract.MAX_BODY:
                        self.send_error(400)
                        return
                    message = contract.strict_json(self.rfile.read(length))
                    fixture.calls.append({"message": message, "headers": dict(self.headers)})
                    reply = fixture.reply(message, self.headers)
                    raw = contract.fixture_response_bytes(reply, message.get("id"))
                    self.send_response(reply.get("status", 200))
                    headers = {"Content-Type": "text/event-stream" if reply.get("sse") else "application/json",
                               **reply.get("headers", {})}
                    for key, value in headers.items():
                        self.send_header(key, value)
                    if not reply.get("omitLength"):
                        self.send_header("Content-Length", str(len(raw)))
                    self.end_headers()
                    delay = reply.get("delaySeconds", 0)
                    if reply.get("trickle"):
                        for byte in raw:
                            self.wfile.write(bytes([byte]))
                            self.wfile.flush()
                            time.sleep(delay)
                    else:
                        time.sleep(delay)
                        self.wfile.write(raw)
                except (BrokenPipeError, ConnectionResetError):
                    pass

        self.server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        self.server.daemon_threads = True
        self.thread = threading.Thread(target=self.server.serve_forever, kwargs={"poll_interval": 0.02}, daemon=True)

    def __enter__(self):
        self.thread.start()
        return self

    def __exit__(self, *_args):
        self.server.shutdown()
        self.server.server_close()
        self.thread.join(timeout=1)

    def reply(self, message, headers):
        method = message["method"]
        version = self.case["version"]
        if any(headers.get(h) for h in ("Authorization", "Cookie", "Proxy-Authorization")):
            raise AssertionError("credentials forbidden in fixtures")
        assert headers.get("Accept") == "application/json, text/event-stream"
        assert headers.get("Origin") == "http://127.0.0.1:" + str(self.server.server_port)
        if version == contract.VERSIONS[0]:
            assert method in ("server/discover", "tools/list", "resources/list")
            assert "Mcp-Session-Id" not in headers
            assert headers.get("Mcp-Method") == method
            assert headers.get("MCP-Protocol-Version") == version
            meta = message["params"]["_meta"]
            assert meta[contract.META_PREFIX + "protocolVersion"] == version
            assert meta[contract.META_PREFIX + "clientCapabilities"] == {}
        elif method == "initialize":
            assert not self.initialized and "Mcp-Session-Id" not in headers
            assert message["params"]["protocolVersion"] == version
            self.initialized = True
        else:
            assert self.initialized
            assert headers.get("MCP-Protocol-Version") == version
            if self.case.get("session"):
                assert headers.get("Mcp-Session-Id") == "fixture-session-only"
            if method == "notifications/initialized":
                self.ready = True
                return {"status": 202}
            assert self.ready and "_meta" not in message.get("params", {})
        replies = self.case["replies"].get(method, [])
        index = self.method_counts.get(method, 0)
        self.method_counts[method] = index + 1
        reply = copy.deepcopy(replies[min(index, len(replies) - 1)])
        if method == "initialize" and self.case.get("session"):
            reply.setdefault("headers", {})["Mcp-Session-Id"] = "fixture-session-only"
        return reply


def exchange(fixture, version, method, seq, session=None, cursor=None, timeout=REQUEST_SECONDS):
    if not isinstance(fixture, OwnedFixture) or not fixture.thread.is_alive():
        raise ValueError("owned_fixture_required")
    message = contract.request(version, method, seq, cursor)
    body = contract.canonical(message)
    headers = {"Content-Type": "application/json", "Accept": "application/json, text/event-stream",
               "Accept-Encoding": "identity", "Origin": f"http://127.0.0.1:{fixture.server.server_port}"}
    if method != "initialize":
        headers["MCP-Protocol-Version"] = version
    if version == contract.VERSIONS[0]:
        headers["Mcp-Method"] = method
    if session is not None and version == contract.VERSIONS[1]:
        headers["Mcp-Session-Id"] = session
    observation = {"sequence": seq, "method": method, "requestSha256": contract.sha(body),
                   "responseSha256": None, "capturedBytes": 0, "httpStatus": None,
                   "outcome": "unknown", "reason": None, "cacheHint": None,
                   "sessionAssigned": False, "authChallenge": None}
    connection = LoopbackConnection("127.0.0.1", fixture.server.server_port, timeout=timeout)
    result = None
    try:
        with deadline(timeout):
            connection.request("POST", "/mcp", body=body, headers=headers)
            response = connection.getresponse()
            observation["httpStatus"] = response.status
            if 300 <= response.status < 400:
                raise ValueError("redirect_refused")
            if response.status in (401, 403):
                challenge = response.getheader("WWW-Authenticate", "")
                # Fixed bounded public challenge hints only; no tokens, registration or follow-up.
                observation["authChallenge"] = contract.auth_challenge(challenge)
                raise ValueError("authentication_required" if response.status == 401 else "access_refused")
            if response.getheader("Content-Encoding", "identity").lower() != "identity":
                raise ValueError("encoded_body_refused")
            length = response.getheader("Content-Length")
            if length is not None and (not length.isdigit() or int(length) > contract.MAX_BODY):
                raise ValueError("body_limit")
            raw = response.read(contract.MAX_BODY + 1)
            observation["capturedBytes"] = len(raw)
            if len(raw) > contract.MAX_BODY:
                raise ValueError("body_limit")
            if length is not None and int(length) != len(raw):
                raise ValueError("truncated_body")
            observation["responseSha256"] = contract.sha(raw)
            if method == "notifications/initialized":
                if response.status != 202 or raw:
                    raise ValueError("invalid_initialized_ack")
                result = {}
            else:
                result = contract.response_message(raw, response.getheader("Content-Type", ""), seq)
                if response.status != 200:
                    raise ValueError("unexpected_http_status")
                root = {"initialize": "InitializeResult", "server/discover": "DiscoverResult",
                        "tools/list": "ListToolsResult", "resources/list": "ListResourcesResult"}[method]
                contract.validate_declaration(version, root, result)
                if version == contract.VERSIONS[0]:
                    observation["cacheHint"] = {"ttlMs": result["ttlMs"], "scope": result["cacheScope"], "reused": False}
                assigned = response.getheader("Mcp-Session-Id")
                if assigned is not None:
                    if version == contract.VERSIONS[0]:
                        raise ValueError("unexpected_modern_session")
                    if method != "initialize" or not 0 < len(assigned) <= 256 or any(not 33 <= ord(c) <= 126 for c in assigned):
                        raise ValueError("invalid_legacy_session")
                    observation["sessionAssigned"] = True
                    session = assigned
            observation.update(outcome="observed", reason=None)
    except (TimeoutError, socket.timeout):
        observation["reason"] = "request_deadline"
        result = None
    except (ValueError, OSError, http.client.HTTPException) as exc:
        observation["reason"] = str(exc) if isinstance(exc, ValueError) else "transport_incomplete"
        result = None
    finally:
        connection.close()
    return observation, result, session


def run_case(case, fixture_clock, timeout=REQUEST_SECONDS):
    contract.validate_fixture_clock(fixture_clock)
    if not 0 < timeout <= REQUEST_SECONDS:
        raise ValueError("invalid_fixture_deadline")
    version = case["version"]
    transport = case.get("transport", "streamable-http")
    profile_id = f"mcp-{version}-streamable-http-declarations-v1" if version in contract.VERSIONS and transport == "streamable-http" else "unsupported"
    report = {"contractVersion": contract.CONTRACT, "profile": {"id": profile_id, "protocolVersion": version,
              "transport": transport, "actor": "declaration_observer"},
              "observedAt": fixture_clock, "observedAtBasis": "fixture_clock",
              "attribution": {"kind": "controlled_fixture", "source": "fixture://" + case["id"],
              "fixtureSha256": contract.sha(contract.canonical(case)), "listingRelationship": None},
              "discovery": contract.unknown("not_attempted"), "tools": contract.unknown("not_attempted"),
              "resources": contract.unknown("not_attempted"), "apps": contract.unknown("not_attempted"),
              "toolDeclarations": [], "resourceDeclarations": [], "exchanges": [],
              "auth": {"state": "unknown", "authenticationVerified": False, "credentialsUsed": False},
              "cache": {"enabled": False, "reused": False, "keyRequirementsBeforeLive": ["endpoint", "profile", "auth_context", "request", "page"]},
              "assessments": {"score": None, "badge": None, "applicableDenominator": None, "runtime": "unknown", "security": "unknown"},
              "publication": {"state": "review_required", "eligible": False},
              "limits": {"bodyBytes": contract.MAX_BODY, "headerBytes": MAX_HEADERS, "requestSeconds": timeout,
                         "runSeconds": RUN_SECONDS, "requests": contract.MAX_REQUESTS, "pagesPerList": contract.MAX_PAGES}}
    if version not in contract.VERSIONS or report["profile"]["transport"] != "streamable-http":
        report["discovery"] = contract.unknown("unsupported_profile")
        return contract.validate_evidence(report, case)
    started = time.monotonic()
    with OwnedFixture(case) as fixture:
        session = None
        def send(method, cursor=None):
            nonlocal session
            if len(report["exchanges"]) >= contract.MAX_REQUESTS or time.monotonic() - started >= RUN_SECONDS:
                return None, "request_or_run_budget", None
            obs, result, session = exchange(fixture, version, method, len(report["exchanges"]) + 1,
                                            session, cursor, min(timeout, RUN_SECONDS - (time.monotonic() - started)))
            report["exchanges"].append(obs)
            if obs["authChallenge"]:
                report["auth"]["state"] = "challenge_observed"
            return result, obs["reason"], obs

        first_method = "server/discover" if version == contract.VERSIONS[0] else "initialize"
        result, reason, obs = send(first_method)
        if result is None:
            report["discovery"] = contract.unknown(reason)
            return contract.validate_evidence(report, case)
        if (version == contract.VERSIONS[0] and version not in result["supportedVersions"]) or (
                version == contract.VERSIONS[1] and result["protocolVersion"] != version):
            report["discovery"] = contract.unknown("unsupported_negotiated_version")
            return contract.validate_evidence(report, case)
        capabilities = result["capabilities"]
        value = contract.discovery_value(result, version)
        report["discovery"] = contract.declared(value, contract.citation(obs, "/result"))
        if version == contract.VERSIONS[1]:
            ack, reason, _ = send("notifications/initialized")
            if ack is None:
                report["tools"] = contract.unknown(reason)
                report["resources"] = contract.unknown(reason)
                return contract.validate_evidence(report, case)

        for name in ("tools", "resources"):
            if name not in capabilities:
                report[name] = {"state": "not_declared", "reason": "absent_capability", "value": None,
                                "citations": report["discovery"]["citations"]}
                continue
            items = report["toolDeclarations" if name == "tools" else "resourceDeclarations"]
            cursor = None
            seen_cursors, seen_names = set(), set()
            citations = []
            for page in range(contract.MAX_PAGES):
                result, reason, obs = send(name + "/list", cursor)
                if result is None:
                    report[name] = contract.unknown(reason)
                    break
                cite = contract.citation(obs, "/result/" + name)
                citations.append(cite)
                if len(items) + len(result[name]) > contract.MAX_ITEMS:
                    report[name] = contract.unknown("item_limit")
                    break
                duplicate = False
                for i, item in enumerate(result[name]):
                    ident = item["name"] if name == "tools" else item["uri"]
                    if ident in seen_names:
                        duplicate = True
                        break
                    seen_names.add(ident)
                    point = contract.citation(obs, "/result/" + name + "/" + str(i))
                    if name == "tools":
                        items.append(contract.tool_declaration(item, point))
                    else:
                        items.append({**{k: item[k] for k in ("uri", "name", "title", "description", "mimeType") if k in item},
                                      "citations": [point], "trust": "unverified_self_declaration", "contentFetched": False})
                if duplicate:
                    report[name] = contract.unknown("duplicate_catalogue_identity")
                    break
                cursor = result.get("nextCursor")
                if cursor is None:
                    report[name] = {"state": "declared", "reason": None, "value": {"count": len(items), "complete": True}, "citations": citations}
                    break
                if not isinstance(cursor, str) or not 0 < len(cursor) <= 256 or any(ord(c) < 32 for c in cursor):
                    report[name] = contract.unknown("invalid_cursor")
                    break
                if cursor in seen_cursors:
                    report[name] = contract.unknown("repeated_cursor")
                    break
                seen_cursors.add(cursor)
                report[name] = contract.unknown("page_limit")

        ui = capabilities.get("extensions", {}).get(contract.APP_ID)
        if ui is not None:
            report["apps"] = contract.declared({"extension": ui, "interpretationVersion": "2026-01-26", "negotiated": False,
                "renderingVerified": False, "resourceContentFetched": False}, report["discovery"]["citations"][0])
        else:
            report["apps"] = contract.unknown("extension_not_declared")
        if report["auth"]["state"] == "unknown" and all(e["outcome"] == "observed" for e in report["exchanges"]):
            report["auth"]["state"] = "no_challenge_observed_for_these_requests"
    return contract.validate_evidence(report, case)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--case", choices=[c["id"] for c in json.loads(FIXTURES.read_text())["cases"]])
    parser.add_argument("--fixture-clock", default="2026-10-05T00:00:00Z", help="Explicit simulated timestamp; never a live check date")
    args = parser.parse_args()
    cases = json.loads(FIXTURES.read_text())["cases"]
    reports = [run_case(c, args.fixture_clock) for c in cases if not args.case or c["id"] == args.case]
    print(contract.canonical({"reports": reports, "fixtureManifestSha256": contract.sha(FIXTURES.read_bytes()),
                              "liveProbes": 0, "toolCalls": 0, "modelCalls": 0, "costUsd": 0}).decode(), end="")


if __name__ == "__main__":
    main()
