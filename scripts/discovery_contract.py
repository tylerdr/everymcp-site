#!/usr/bin/env python3
"""Offline normalization of bounded, untrusted MCP declarations. No network calls."""
import hashlib
import json
import math
import re
from datetime import datetime
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
            pending.extend((v, depth + 1) for v in node.values())
        elif isinstance(node, list):
            pending.extend((v, depth + 1) for v in node)
        elif isinstance(node, float) and not math.isfinite(node):
            raise ValueError("non_finite_number")


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


def validate_evidence(report):
    schema = json.loads((ROOT / "documents/public-discovery/evidence.schema.json").read_text())
    Draft202012Validator(schema, format_checker=FormatChecker()).validate(report)
    # date-time format validation can be absent without optional jsonschema extras.
    validate_fixture_clock(report["observedAt"])
    version, transport = report["profile"]["protocolVersion"], report["profile"]["transport"]
    expected_profile = f"mcp-{version}-streamable-http-declarations-v1" if version in VERSIONS and transport == "streamable-http" else "unsupported"
    if report["profile"]["id"] != expected_profile or (expected_profile == "unsupported" and report["exchanges"]):
        raise ValueError("invalid_profile_attribution")
    # JSON Schema shape is supplemented with exact local attribution relationships.
    pending = [report]
    while pending:
        fact = pending.pop()
        if isinstance(fact, list):
            pending.extend(fact)
            continue
        if not isinstance(fact, dict):
            continue
        pending.extend(v for k, v in fact.items() if k not in ("value", "inputSchema", "outputSchema", "capabilities", "annotations"))
        for cite in fact.get("citations", []):
            e = report["exchanges"][cite["exchange"] - 1]
            if e["responseSha256"] != cite["responseSha256"] or e["outcome"] != "observed":
                raise ValueError("invalid_evidence_citation")
    for name, items_key in (("tools", "toolDeclarations"), ("resources", "resourceDeclarations")):
        fact = report[name]
        if fact["state"] == "declared" and fact["value"] != {"count": len(report[items_key]), "complete": True}:
            raise ValueError("invalid_catalogue_count")
    if any(e["sequence"] != i + 1 for i, e in enumerate(report["exchanges"])):
        raise ValueError("invalid_exchange_sequence")
    return report
