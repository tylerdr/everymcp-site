#!/usr/bin/env python3
"""Offline normalization of bounded, untrusted MCP declarations. No network calls."""
import hashlib
import copy
import json
import math
import re
from datetime import datetime
from urllib.parse import urlsplit
from pathlib import Path

from jsonschema import Draft202012Validator, FormatChecker

ROOT = Path(__file__).resolve().parents[1]
CONTRACT = "everymcp.public-discovery.v1"
VERSIONS = ("2026-07-28", "2025-11-25")
META_PREFIX = "io.modelcontextprotocol/"
MAX_BODY = 65536
MAX_DEPTH = 24
MAX_NODES = 4096
MAX_SCHEMA = 16384
MAX_ITEMS = 40
MAX_PAGES = 3
MAX_REQUESTS = 8
APP_ID = META_PREFIX + "ui"
DEFAULT_DIALECT = "https://json-schema.org/draft/2020-12/schema"


def canonical(value):
    return (json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
                       allow_nan=False) + "\n").encode("utf-8")


def sha(data):
    return hashlib.sha256(data).hexdigest()


def bounded_tree(value):
    pending = [(value, 0)]
    count = 0
    while pending:
        node, depth = pending.pop()
        count += 1
        if depth > MAX_DEPTH or count > MAX_NODES:
            raise ValueError("structure_limit")
        if isinstance(node, dict):
            for key in node:
                if not isinstance(key, str):
                    raise ValueError("invalid_object_key")
                key.encode("utf-8")  # Reject escaped lone surrogates before projection/hashing.
            pending.extend((v, depth + 1) for v in node.values())
        elif isinstance(node, list):
            pending.extend((v, depth + 1) for v in node)
        elif isinstance(node, float) and not math.isfinite(node):
            raise ValueError("non_finite_number")
        elif isinstance(node, str):
            node.encode("utf-8")


def strict_json(raw):
    if len(raw) > MAX_BODY:
        raise ValueError("body_limit")
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("duplicate_json_key")
            result[key] = value
        return result
    try:
        value = json.loads(raw.decode("utf-8"), object_pairs_hook=pairs,
                           parse_constant=lambda _: (_ for _ in ()).throw(ValueError("non_finite_number")))
        bounded_tree(value)
        return value
    except (UnicodeError, json.JSONDecodeError, RecursionError) as exc:
        raise ValueError("invalid_or_truncated_json") from exc


def protocol_schema(version):
    if version not in VERSIONS:
        raise ValueError("unsupported_profile")
    manifest = json.loads((ROOT / "documents/public-discovery/spec-provenance.json").read_text())
    artifact = next(a for a in manifest["artifacts"] if a["path"].startswith(version))
    raw = (ROOT / "documents/public-discovery" / artifact["path"]).read_bytes()
    if sha(raw) != artifact["sha256"]:
        raise ValueError("protocol_artifact_hash_mismatch")
    return strict_json(raw)


def validate_declaration(version, name, value):
    schema = protocol_schema(version)
    schema["$ref"] = "#/$defs/" + name
    if not Draft202012Validator(schema).is_valid(value):
        raise ValueError("declaration_schema_mismatch")
    # The observer handles final results only and negotiates no interactive extension.
    if version == VERSIONS[0] and value.get("resultType") != "complete":
        raise ValueError("unsupported_result_type")


def request(version, method, request_id, cursor=None):
    allowed = {"server/discover", "tools/list", "resources/list"} if version == VERSIONS[0] else {
        "initialize", "notifications/initialized", "tools/list", "resources/list"}
    if version not in VERSIONS or method not in allowed:
        raise ValueError("disabled_method_or_profile")
    params = {}
    if method == "initialize":
        params = {"protocolVersion": version, "clientInfo": {"name": "EveryMCPFixtureObserver", "version": "1"},
                  "capabilities": {}}
    elif method != "notifications/initialized":
        if cursor is not None:
            if not isinstance(cursor, str) or not 0 < len(cursor) <= 256 or any(ord(c) < 32 for c in cursor):
                raise ValueError("invalid_cursor")
            params["cursor"] = cursor
        if version == VERSIONS[0]:
            params["_meta"] = {META_PREFIX + "protocolVersion": version,
                               META_PREFIX + "clientInfo": {"name": "EveryMCPFixtureObserver", "version": "1"},
                               META_PREFIX + "clientCapabilities": {}}
    message = {"jsonrpc": "2.0", "method": method}
    if method != "notifications/initialized":
        message.update(id=request_id, params=params)
    return message


def response_message(raw, content_type, request_id):
    """Finite JSON/SSE response subset: never service peer requests or input requests."""
    messages = []
    if content_type.split(";", 1)[0].strip().lower() == "application/json":
        messages = [strict_json(raw)]
    elif content_type.split(";", 1)[0].strip().lower() == "text/event-stream":
        try:
            text = raw.decode("utf-8").replace("\r\n", "\n")
        except UnicodeError as exc:
            raise ValueError("invalid_sse") from exc
        if not text.endswith("\n\n"):
            raise ValueError("truncated_sse")
        events = text.split("\n\n")
        if len(events) > 18:
            raise ValueError("sse_event_limit")
        for event in events:
            data = []
            for line in event.split("\n"):
                if line.startswith("data:"):
                    data.append(line[5:].lstrip(" "))
                elif line and not (line.startswith(":") or line.startswith("event:") or line.startswith("id:") or line.startswith("retry:")):
                    raise ValueError("invalid_sse")
            if data:
                messages.append(strict_json("\n".join(data).encode()))
    else:
        raise ValueError("unsupported_content_type")
    finals = []
    for message in messages:
        if not isinstance(message, dict) or message.get("jsonrpc") != "2.0":
            raise ValueError("invalid_jsonrpc_envelope")
        if "method" in message:
            if "id" in message:
                raise ValueError("client_interaction_required")
            # Notifications are hashed with the response, never executed or interpreted.
            continue
        if type(message.get("id")) is not type(request_id) or message.get("id") != request_id:
            raise ValueError("response_id_mismatch")
        if ("result" in message) == ("error" in message):
            raise ValueError("invalid_jsonrpc_envelope")
        finals.append(message)
    if len(finals) != 1:
        raise ValueError("ambiguous_or_missing_response")
    message = finals[0]
    if "error" in message:
        error = message["error"]
        if not isinstance(error, dict) or type(error.get("code")) is not int or not isinstance(error.get("message"), str):
            raise ValueError("invalid_jsonrpc_error")
        raise ValueError("unsupported_version" if error["code"] == -32022 else "peer_rpc_error")
    if not isinstance(message["result"], dict):
        raise ValueError("invalid_result")
    return message["result"]


def unknown(reason):
    return {"state": "unknown", "reason": reason, "value": None, "citations": []}


def declared(value, citation):
    return {"state": "declared", "reason": None, "value": value, "citations": [citation]}


def citation(exchange, pointer):
    return {"exchange": exchange["sequence"], "responseSha256": exchange["responseSha256"], "pointer": pointer}


def fixture_response_bytes(reply, request_id):
    """Exact deterministic fixture body, shared by the listener and offline verifier."""
    if "raw" in reply:
        raw = reply["raw"].encode()
    else:
        payload = copy.deepcopy(reply.get("message", {}))
        if payload.get("id") == "$requestId":
            payload["id"] = request_id
        raw = canonical(payload) if payload else b""
        if reply.get("sse"):
            raw = b": fixture heartbeat\n\n" + b"event: message\ndata: " + raw.rstrip(b"\n") + b"\n\n"
    return raw + b" " * reply.get("paddingBytes", 0)


def fixture_header(reply, name, default=None):
    headers = {"Content-Type": "text/event-stream" if reply.get("sse") else "application/json",
               **reply.get("headers", {})}
    values = [str(v) for k, v in headers.items() if k.lower() == name.lower()]
    return ", ".join(values) if values else default


def validate_observed_transport(reply, version, method, fixture_case, request_seconds):
    if fixture_header(reply, "Content-Encoding", "identity").lower() != "identity":
        raise ValueError("observed_encoded_response")
    assigned = fixture_header(reply, "Mcp-Session-Id")
    if method == "initialize" and fixture_case.get("session"):
        assigned = "fixture-session-only"
    if assigned is not None:
        if version == VERSIONS[0]:
            raise ValueError("observed_modern_session")
        if method != "initialize" or not 0 < len(assigned) <= 256 or any(not 33 <= ord(c) <= 126 for c in assigned):
            raise ValueError("observed_invalid_legacy_session")
    if reply.get("delaySeconds", 0) >= request_seconds:
        raise ValueError("observed_fixture_timeout")
    if sum(len(str(k).encode()) + len(str(v).encode()) + 4 for k, v in reply.get("headers", {}).items()) >= 8192:
        raise ValueError("observed_oversized_headers")
    return assigned


def pointer_value(document, pointer):
    node = document
    if not isinstance(pointer, str) or not pointer.startswith("/"):
        raise ValueError("invalid_evidence_pointer")
    for segment in pointer[1:].split("/"):
        if re.search(r"~(?![01])", segment):
            raise ValueError("invalid_evidence_pointer")
        key = segment.replace("~1", "/").replace("~0", "~")
        try:
            if isinstance(node, list):
                if not re.fullmatch(r"0|[1-9]\d*", key):
                    raise ValueError("invalid_evidence_pointer")
                node = node[int(key)]
            else:
                node = node[key]
        except (IndexError, KeyError, TypeError) as exc:
            raise ValueError("invalid_evidence_pointer") from exc
    return node


def auth_challenge(value):
    result = {"scheme": "Bearer" if re.match(r"(?i)^Bearer(?:\s|$)", value) else "unknown",
              "resourceMetadataUri": None, "followed": False, "authenticationVerified": False}
    match = re.search(r'(?:^|[, ])resource_metadata="([^"\s]+)"', value)
    if match and len(match[1]) <= 2048:
        try:
            p = urlsplit(match[1])
            if p.scheme == "https" and p.hostname and not p.username and not p.password and not p.query and not p.fragment:
                result["resourceMetadataUri"] = match[1]
        except ValueError:
            pass
    return result


def discovery_value(original, version):
    identity = original.get("serverInfo") if version == VERSIONS[1] else original.get("_meta", {}).get(META_PREFIX + "serverInfo")
    state = "declared" if isinstance(identity, dict) and all(
        isinstance(identity.get(k), str) and 0 < len(identity[k]) <= 512 for k in ("name", "version")) else "unknown"
    return {"supportedVersions": original.get("supportedVersions", [original.get("protocolVersion")]),
            "capabilities": original["capabilities"], "identity": identity if state == "declared" else None,
            "identityState": state, "identityTrust": "unverified_self_declaration", "selectedVersion": version}


def schema_declaration(schema):
    """Syntax inspection only. No instance execution or network/reference resolution."""
    raw = canonical(schema)
    out = {"state": "unknown", "reason": None, "dialect": schema.get("$schema", DEFAULT_DIALECT),
           "sha256": sha(raw), "value": schema, "externalReferences": [], "instanceValidation": "disabled"}
    if len(raw) > MAX_SCHEMA:
        out.update(reason="schema_size_limit", value=None)
        return out
    if out["dialect"] not in (DEFAULT_DIALECT, DEFAULT_DIALECT + "#"):
        out["reason"] = "unsupported_schema_dialect"
        return out
    try:
        bounded_tree(schema)
        Draft202012Validator.check_schema(schema)
    except TimeoutError:
        raise
    except Exception:
        out["reason"] = "invalid_or_bounded_schema"
        return out
    pending = [schema]
    while pending:
        node = pending.pop()
        if isinstance(node, dict):
            # Also refuse dynamic/external references and schema base URI changes.
            for field in ("$ref", "$dynamicRef", "$id"):
                if isinstance(node.get(field), str) and not node[field].startswith("#"):
                    out["externalReferences"].append(node[field])
            pending.extend(node.values())
        elif isinstance(node, list):
            pending.extend(node)
    out["externalReferences"] = sorted(set(out["externalReferences"]))
    if out["externalReferences"]:
        out["reason"] = "references_not_resolved"
    else:
        out.update(state="syntax_valid", reason=None)
    return out


def tool_declaration(tool, cite):
    # Prose remains untrusted plain text; unknown vendor metadata is not promoted.
    item = {k: tool[k] for k in ("name", "title", "description", "annotations") if k in tool}
    item.update(inputSchema=schema_declaration(tool["inputSchema"]),
                outputSchema=schema_declaration(tool["outputSchema"]) if "outputSchema" in tool else None,
                citations=[cite], trust="unverified_self_declaration", execution="disabled",
                apps=unknown("not_declared_in_tool"))
    ui = tool.get("_meta", {}).get("ui")
    if ui is not None:
        if isinstance(ui, dict) and isinstance(ui.get("resourceUri"), str) and ui["resourceUri"].startswith("ui://"):
            value = {"resourceUri": ui["resourceUri"], "resourceFetched": False, "renderingVerified": False}
            if "visibility" in ui:
                if not isinstance(ui["visibility"], list) or not ui["visibility"] or any(x not in ("app", "model") for x in ui["visibility"]):
                    item["apps"] = unknown("unsupported_ui_visibility")
                    return item
                value["visibility"] = ui["visibility"]
            item["apps"] = declared(value, cite)
        else:
            item["apps"] = unknown("unsupported_ui_declaration")
    return item


def validate_fixture_clock(value):
    if not isinstance(value, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", value):
        raise ValueError("invalid_fixture_clock")
    datetime.fromisoformat(value.replace("Z", "+00:00"))


def validate_evidence(report, fixture_case=None):
    schema = json.loads((ROOT / "documents/public-discovery/evidence.schema.json").read_text())
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(report)
    # date-time format validation can be absent without optional jsonschema extras.
    validate_fixture_clock(report["observedAt"])
    version, transport = report["profile"]["protocolVersion"], report["profile"]["transport"]
    expected_profile = f"mcp-{version}-streamable-http-declarations-v1" if version in VERSIONS and transport == "streamable-http" else "unsupported"
    if report["profile"]["id"] != expected_profile or (expected_profile == "unsupported" and report["exchanges"]):
        raise ValueError("invalid_profile_attribution")
    # A saved fixture receipt resolves its committed source. Ad-hoc trusted test
    # cases must be supplied explicitly by their owned runner, never a live URI.
    source_id = report["attribution"]["source"].removeprefix("fixture://")
    if fixture_case is None:
        cases = json.loads((ROOT / "tests/fixtures/public-discovery.json").read_text())["cases"]
        fixture_case = next((c for c in cases if c["id"] == source_id), None)
    if fixture_case is None or fixture_case["id"] != source_id or sha(canonical(fixture_case)) != report["attribution"]["fixtureSha256"]:
        raise ValueError("invalid_fixture_attribution")
    if version != fixture_case["version"] or transport != fixture_case.get("transport", "streamable-http"):
        raise ValueError("invalid_profile_attribution")
    bodies = {}
    method_counts = {}
    cursors = {}
    for i, e in enumerate(report["exchanges"]):
        method = e["method"]
        if e["sequence"] != i + 1:
            raise ValueError("invalid_exchange_sequence")
        first = "server/discover" if version == VERSIONS[0] else "initialize"
        if (i == 0 and method != first) or (i > 0 and method == first) or (
                version == VERSIONS[1] and i == 1 and method != "notifications/initialized"):
            raise ValueError("invalid_profile_method_sequence")
        expected_request = request(version, method, i + 1, cursors.get(method))
        if sha(canonical(expected_request)) != e["requestSha256"]:
            raise ValueError("invalid_request_attribution")
        if method == "notifications/initialized":
            reply = {"status": 202}
        else:
            candidates = fixture_case["replies"][method]
            index = method_counts.get(method, 0)
            reply = candidates[min(index, len(candidates) - 1)]
            method_counts[method] = index + 1
        raw = fixture_response_bytes(reply, i + 1)
        if e["httpStatus"] is not None and e["httpStatus"] != reply.get("status", 200):
            raise ValueError("invalid_http_attribution")
        expected_challenge = auth_challenge(fixture_header(reply, "WWW-Authenticate", "")) if e["httpStatus"] in (401, 403) else None
        if e["authChallenge"] != expected_challenge:
            raise ValueError("invalid_auth_attribution")
        if e["responseSha256"] is not None and (len(raw) > MAX_BODY or sha(raw) != e["responseSha256"]):
            raise ValueError("invalid_response_attribution")
        if e["outcome"] == "observed":
            assigned = validate_observed_transport(reply, version, method, fixture_case, report["limits"]["requestSeconds"])
            if e["reason"] is not None or e["httpStatus"] != reply.get("status", 200) or e["httpStatus"] != (202 if method == "notifications/initialized" else 200):
                raise ValueError("invalid_observed_exchange")
            if e["capturedBytes"] != len(raw) or e["responseSha256"] != sha(raw):
                raise ValueError("invalid_response_attribution")
            if e["sessionAssigned"] != bool(assigned):
                raise ValueError("invalid_session_attribution")
            if method != "notifications/initialized":
                content_type = fixture_header(reply, "Content-Type", "")
                value = response_message(raw, content_type, i + 1)
                root = {"server/discover": "DiscoverResult", "initialize": "InitializeResult", "tools/list": "ListToolsResult", "resources/list": "ListResourcesResult"}[method]
                validate_declaration(version, root, value)
                bodies[i + 1] = {"result": value}
                cursors[method] = value.get("nextCursor")
                expected_hint = {"ttlMs": value["ttlMs"], "scope": value["cacheScope"], "reused": False} if version == VERSIONS[0] else None
                if e["cacheHint"] != expected_hint:
                    raise ValueError("invalid_cache_attribution")
        elif not e["reason"]:
            raise ValueError("missing_unknown_reason")

    def cited(cite, method, expected_pointer):
        if cite["exchange"] not in bodies:
            raise ValueError("invalid_evidence_citation")
        e = report["exchanges"][cite["exchange"] - 1]
        if e["responseSha256"] != cite["responseSha256"] or e["method"] != method or cite["pointer"] != expected_pointer:
            raise ValueError("invalid_evidence_citation")
        return pointer_value(bodies[cite["exchange"]], cite["pointer"])

    discovery_method = "server/discover" if version == VERSIONS[0] else "initialize"
    if report["discovery"]["state"] == "declared":
        for cite in report["discovery"]["citations"]:
            original = cited(cite, discovery_method, "/result")
            supported = original.get("supportedVersions", [original.get("protocolVersion")])
            if report["discovery"]["value"] != discovery_value(original, version) or version not in supported:
                raise ValueError("invalid_discovery_attribution")
    for name, items_key in (("tools", "toolDeclarations"), ("resources", "resourceDeclarations")):
        fact = report[name]
        for cite in fact["citations"]:
            original = cited(cite, discovery_method if fact["state"] == "not_declared" else name + "/list",
                             "/result" if fact["state"] == "not_declared" else "/result/" + name)
            if fact["state"] == "not_declared" and name in original["capabilities"]:
                raise ValueError("invalid_capability_absence")
        for item in report[items_key]:
            if len(item["citations"]) != 1:
                raise ValueError("invalid_item_attribution")
            cite = item["citations"][0]
            if not re.fullmatch(r"/result/" + name + r"/(0|[1-9]\d*)", cite["pointer"]):
                raise ValueError("invalid_evidence_pointer")
            original = cited(cite, name + "/list", cite["pointer"])
            if name == "tools":
                expected = tool_declaration(original, cite)
            else:
                expected = {**{k: original[k] for k in ("uri", "name", "title", "description", "mimeType") if k in original},
                            "citations": [cite], "trust": "unverified_self_declaration", "contentFetched": False}
            if item != expected:
                raise ValueError("invalid_item_or_schema_attribution")
    if report["apps"]["state"] == "declared":
        for cite in report["apps"]["citations"]:
            original = cited(cite, discovery_method, "/result")
            expected = {"extension": original["capabilities"].get("extensions", {}).get(APP_ID),
                        "interpretationVersion": "2026-01-26", "negotiated": False,
                        "renderingVerified": False, "resourceContentFetched": False}
            if report["apps"]["value"] != expected or expected["extension"] is None:
                raise ValueError("invalid_apps_attribution")
    for name, items_key in (("tools", "toolDeclarations"), ("resources", "resourceDeclarations")):
        fact = report[name]
        if fact["state"] == "declared" and fact["value"] != {"count": len(report[items_key]), "complete": True}:
            raise ValueError("invalid_catalogue_count")
        if fact["state"] == "declared":
            all_observed = [citation(e, "/result/" + name) for e in report["exchanges"]
                            if e["method"] == name + "/list" and e["outcome"] == "observed"]
            if fact["citations"] != all_observed:
                raise ValueError("invalid_catalogue_page_coverage")
            expected_count = sum(len(pointer_value(bodies[c["exchange"]], "/result/" + name)) for c in fact["citations"])
            last = bodies[fact["citations"][-1]["exchange"]]["result"]
            if last.get("nextCursor") is not None or expected_count != len(report[items_key]):
                raise ValueError("invalid_catalogue_completeness")
            expected_points = [(c["exchange"], "/result/" + name + "/" + str(i)) for c in fact["citations"]
                               for i in range(len(pointer_value(bodies[c["exchange"]], "/result/" + name)))]
            actual_points = [(item["citations"][0]["exchange"], item["citations"][0]["pointer"]) for item in report[items_key]]
            if actual_points != expected_points or len({c["exchange"] for c in fact["citations"]}) != len(fact["citations"]):
                raise ValueError("invalid_catalogue_item_coverage")
    state = report["auth"]["state"]
    challenges = any(e["authChallenge"] for e in report["exchanges"])
    if (state == "challenge_observed") != challenges or (state == "no_challenge_observed_for_these_requests" and
            (not report["exchanges"] or any(e["outcome"] != "observed" for e in report["exchanges"]))):
        raise ValueError("invalid_auth_summary")
    return report
