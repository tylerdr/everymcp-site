#!/usr/bin/env python3
"""Public source observations, never MCP execution or semantic quality grading."""
import argparse
import hashlib
import http.client
import ipaddress
import json
import math
import os
import re
import signal
import socket
import ssl
import time
from collections import Counter
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit
from jsonschema import Draft202012Validator, FormatChecker
from protego import Protego

ROOT = Path(__file__).resolve().parents[1]
POLICY_VERSION = "public-source-v1"
ALLOWED_HOSTS = frozenset({"github.com", "www.revenuecat.com", "contentsquare.com",
                          "docs.coingecko.com", "stack.convex.dev", "docs.cursor.com"})
STATES = {"reachable", "missing_at_check", "unknown"}
OBSERVATION_FIELDS = {"checkedAt", "httpStatus", "state", "reason", "contentHash", "etag", "lastModified",
                      "bodyComplete", "evidenceType", "retryAfterSeconds", "receivedBytes", "durationMs"}
REASONS = {"http_unknown", "http_success", "not_modified", "not_modified_without_prior_body",
           "partial_or_oversized_body", "http_missing_at_check", "authentication_required", "blocked",
           "rate_limited", "redirect_not_followed", "server_error", "network_or_policy_failure",
           "scanner_policy_refusal", "timeout", "tls_failure", "dns_failure", "transport_failure"}
MAX_BODY_BYTES = 1024 * 1024
MIN_HOST_INTERVAL = 1.0
USER_AGENT = "EveryMCP-SourceMonitor/1.0 (+https://everymcp.com/methodology)"


def stamp(now=None):
    return (now or datetime.now(timezone.utc)).isoformat(timespec="seconds").replace("+00:00", "Z")


def parse_date(value):
    date = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if date.tzinfo is None:
        raise ValueError("An observation needs an explicit timezone")
    return date


def digest(value):
    return hashlib.sha256(value).hexdigest()


def normalize_url(raw):
    if not isinstance(raw, str) or re.search(r"[\s\\\x00-\x1f\x7f]", raw):
        raise ValueError("invalid_url")
    parsed = urlsplit(raw)
    host = (parsed.hostname or "").lower()
    if host == "www.github.com":
        host = "github.com"
    if parsed.scheme != "https" or parsed.username or parsed.password or parsed.port not in (None, 443):
        raise ValueError("https_without_credentials_required")
    if parsed.query or parsed.fragment or host not in ALLOWED_HOSTS:
        raise ValueError("host_or_parameters_not_allowed")
    # No encoded traversal, credentials or alternate URL parsers. Do not strip secret-like queries.
    if "%" in parsed.path or any(x in (".", "..") for x in parsed.path.split("/")):
        raise ValueError("path_not_allowed")
    path = parsed.path or "/"
    if host == "github.com":
        path = path.rstrip("/")
        if path == "/robots.txt":
            return urlunsplit(("https", host, path, "", ""))
        if path.endswith(".git"):
            path = path[:-4]
        if not re.fullmatch(r"/[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+(?:/[A-Za-z0-9_.-]+)*", path):
            raise ValueError("repository_source_path_required")
        parts = path.split("/")
        path = "/".join(["", parts[1].lower(), parts[2].lower(), *parts[3:]])
    return urlunsplit(("https", host, path, "", ""))


def inventory(catalog, curated):
    sources, rejected, listings = {}, [], []
    reviewed = {entry["slug"]: entry for entry in curated}
    seen_slugs = set()
    for listing in catalog:
        ident, slug = listing["id"], listing["slug"]
        if any(not re.fullmatch(r"[a-z0-9][a-z0-9._-]{0,100}", value) for value in (ident, slug)):
            raise ValueError("Invalid stable listing identity")
        if slug in seen_slugs:
            raise ValueError("Duplicate stable listing URL")
        seen_slugs.add(slug)
        listings.append({"id": ident, "slug": slug, "publisherAssessment": "unknown"})
        links = [(listing.get("repo"), "indexed_repository", "unknown", None)]
        for reference in reviewed.get(slug, {}).get("references", []):
            links.append((reference["url"], "separate_reference", reference["kind"], reference["checkedAt"]))
        for raw, role, identity, checked_at in links:
            relation = {"id": ident, "slug": slug, "role": role, "identityEvidence": identity,
                        "curatedCheckedAt": checked_at, "basis": "documented" if checked_at else "unknown"}
            try:
                url = normalize_url(raw)
            except (ValueError, TypeError):
                rejected.append({"id": ident, "slug": slug, "reason": "url_policy_rejected",
                                 "inputHash": digest(str(raw).encode())})
                continue
            source = sources.setdefault(url, {"url": url, "relationships": [], "priority": False})
            source["priority"] = source["priority"] or slug in reviewed
            if relation not in source["relationships"]:
                source["relationships"].append(relation)
    return listings, dict(sorted(sources.items())), rejected


def public_addresses(host):
    addresses = sorted({item[4][0] for item in socket.getaddrinfo(host, 443, type=socket.SOCK_STREAM)})
    if not addresses or any(not ipaddress.ip_address(address).is_global or ipaddress.ip_address(address).is_multicast for address in addresses):
        raise ValueError("non_public_dns")
    return addresses


class PinnedHTTPSConnection(http.client.HTTPSConnection):
    """Connect only to the checked IP; TLS still verifies the allowlisted hostname."""
    def __init__(self, host, address, timeout):
        super().__init__(host, timeout=timeout, context=ssl.create_default_context())
        self.address = address

    def connect(self):
        sock = socket.create_connection((self.address, 443), self.timeout)
        try:
            self.sock = self._context.wrap_socket(sock, server_hostname=self.host)
        except Exception:
            sock.close()
            raise


def safe_header(value, limit=256):
    return value if isinstance(value, str) and 0 < len(value) <= limit and all(32 <= ord(c) < 127 for c in value) else None


def fetch_source(url, previous, timeout=8):
    parsed = urlsplit(normalize_url(url))
    def deadline(_signum, _frame):
        raise TimeoutError("Public GET deadline")
    old_handler = signal.signal(signal.SIGALRM, deadline)
    old_timer = signal.setitimer(signal.ITIMER_REAL, timeout)
    connection = None
    headers = {"User-Agent": USER_AGENT,
               "Accept": "text/html, application/json, text/plain", "Accept-Encoding": "identity"}
    success = previous.get("lastSuccessfulObservation") or {}
    for field, header in (("etag", "If-None-Match"), ("lastModified", "If-Modified-Since")):
        value = safe_header(success.get(field))
        if value:
            headers[header] = value
    try:
        addresses = public_addresses(parsed.hostname)
        connection = PinnedHTTPSConnection(parsed.hostname, addresses[0], timeout)
        # No proxy, auth, cookie, redirect following or content execution.
        connection.request("GET", parsed.path or "/", headers=headers)
        response = connection.getresponse()
        response_headers = {key.lower(): value for key, value in response.getheaders()}
        body = response.read(MAX_BODY_BYTES + 1)
        return response.status, response_headers, body
    finally:
        if connection:
            connection.close()
        signal.setitimer(signal.ITIMER_REAL, *old_timer)
        signal.signal(signal.SIGALRM, old_handler)


def observe(status, headers, body, previous, checked_at, duration_ms=0):
    observation = {"checkedAt": checked_at, "httpStatus": status, "state": "unknown", "reason": "http_unknown",
                   "contentHash": None, "etag": None, "lastModified": None, "bodyComplete": False,
                   "evidenceType": "observed_http", "retryAfterSeconds": None,
                   "receivedBytes": len(body), "durationMs": duration_ms}
    success = previous.get("lastSuccessfulObservation") or {}
    if status == 304:
        if success.get("contentHash") and success.get("bodyComplete"):
            observation.update(success)
            observation.update(checkedAt=checked_at, httpStatus=304, state="reachable", reason="not_modified",
                               receivedBytes=len(body), durationMs=duration_ms)
        else:
            observation["reason"] = "not_modified_without_prior_body"
    elif 200 <= status < 300:
        if status == 206 or len(body) > MAX_BODY_BYTES:
            observation["reason"] = "partial_or_oversized_body"
        else:
            observation.update(state="reachable", reason="http_success", contentHash=digest(body), bodyComplete=True,
                               etag=safe_header(headers.get("etag")), lastModified=safe_header(headers.get("last-modified")))
    elif status in (404, 410):
        observation.update(state="missing_at_check", reason="http_missing_at_check")
    elif status in (401, 403, 429):
        observation["reason"] = {401: "authentication_required", 403: "blocked", 429: "rate_limited"}[status]
        if status in (403, 429):
            delay = 3600
            raw = safe_header(headers.get("retry-after"))
            if raw:
                try:
                    delay = int(raw) if raw.isdigit() else int((parsedate_to_datetime(raw) - parse_date(checked_at)).total_seconds())
                except (TypeError, ValueError, OverflowError):
                    pass
            observation["retryAfterSeconds"] = min(86400, max(60, delay))
    elif 300 <= status < 400:
        observation["reason"] = "redirect_not_followed"
    elif status >= 500:
        observation["reason"] = "server_error"
    return observation


def update_cache(previous, observation):
    entry = {"observation": observation,
             "lastSuccessfulObservation": previous.get("lastSuccessfulObservation"),
             "reviewFindings": [dict(item) for item in previous.get("reviewFindings", [])]}
    success = previous.get("lastSuccessfulObservation") or {}
    changed = observation["state"] == "reachable" and success.get("contentHash") and success["contentHash"] != observation["contentHash"]
    finding = "source_body_changed" if changed else ("source_missing_at_check" if observation["state"] == "missing_at_check" else None)
    if finding:
        # Preserve unresolved history across cache expiry/recovery; no ranking or score exists.
        prior = next((item for item in entry["reviewFindings"] if item["kind"] == finding), None)
        if prior:
            prior["lastObservedAt"] = observation["checkedAt"]
        else:
            entry["reviewFindings"].append({"kind": finding, "firstObservedAt": observation["checkedAt"],
                                            "lastObservedAt": observation["checkedAt"], "resolution": "review_required"})
    if observation["state"] == "reachable":
        entry["lastSuccessfulObservation"] = observation.copy()
    return entry


def valid_observation(observation):
    if not isinstance(observation, dict) or set(observation) != OBSERVATION_FIELDS or observation.get("state") not in STATES:
        return False
    try:
        parse_date(observation["checkedAt"])
    except (ValueError, KeyError, TypeError):
        return False
    content_hash = observation.get("contentHash")
    if content_hash is not None and (not isinstance(content_hash, str) or not re.fullmatch(r"[a-f0-9]{64}", content_hash)):
        return False
    status, retry = observation["httpStatus"], observation["retryAfterSeconds"]
    if status is not None and (type(status) is not int or not 100 <= status <= 599):
        return False
    if retry is not None and (type(retry) is not int or not 60 <= retry <= 86400):
        return False
    if observation["reason"] not in REASONS or observation["evidenceType"] != "observed_http" or type(observation["bodyComplete"]) is not bool:
        return False
    if any(type(observation[key]) is not int or observation[key] < 0 for key in ("receivedBytes", "durationMs")):
        return False
    if any(value is not None and safe_header(value) != value for value in (observation["etag"], observation["lastModified"])):
        return False
    if observation["state"] == "reachable" and (status is None or not (200 <= status < 300 and status != 206 or status == 304) or observation["reason"] not in {"http_success", "not_modified"}):
        return False
    if observation["state"] == "missing_at_check" and (status not in (404, 410) or observation["reason"] != "http_missing_at_check"):
        return False
    if observation["state"] == "unknown" and observation["reason"] in {"http_success", "not_modified", "http_missing_at_check"}:
        return False
    return bool(content_hash and observation["bodyComplete"]) if observation["state"] == "reachable" else content_hash is None and not observation["bodyComplete"]


def read_cache(path, sources):
    if not path.exists():
        return {}
    raw = json.loads(path.read_text())
    if raw.get("schemaVersion") != 1 or raw.get("policyVersion") != POLICY_VERSION:
        raise ValueError("Incompatible cache policy; inspect it before replacing")
    result = {}
    for url, entry in raw.get("sources", {}).items():
        if url not in sources:
            continue
        if not isinstance(entry, dict) or not valid_observation(entry.get("observation")):
            raise ValueError("Invalid cached observation")
        success = entry.get("lastSuccessfulObservation")
        if success and (not valid_observation(success) or success["state"] != "reachable" or not success.get("bodyComplete")):
            raise ValueError("Invalid cached successful observation")
        if not isinstance(entry.get("reviewFindings", []), list):
            raise ValueError("Invalid review findings")
        for finding in entry.get("reviewFindings", []):
            if set(finding) != {"kind", "firstObservedAt", "lastObservedAt", "resolution"} or finding["kind"] not in {"source_body_changed", "source_missing_at_check"} or finding["resolution"] != "review_required":
                raise ValueError("Invalid review finding")
            parse_date(finding["firstObservedAt"]); parse_date(finding["lastObservedAt"])
        if set(entry) != {"observation", "lastSuccessfulObservation", "reviewFindings"}:
            raise ValueError("Unexpected cache fields")
        result[url] = entry
    return result


def read_robot_cache(path):
    if not path.exists(): return {}
    policies = json.loads(path.read_text()).get("robotsPolicies", {})
    for host, policy in policies.items():
        if host not in ALLOWED_HOSTS or set(policy) != {"checkedAt", "httpStatus", "state", "text", "contentHash", "receivedBytes", "durationMs"}:
            raise ValueError("Invalid robots policy cache")
        parse_date(policy["checkedAt"])
        if policy["state"] not in {"available", "absent", "unknown"} or not isinstance(policy["text"], str) or len(policy["text"].encode()) > 65536:
            raise ValueError("Invalid robots content")
        if policy["state"] == "available" and digest(policy["text"].encode()) != policy["contentHash"]:
            raise ValueError("Invalid robots hash")
        if policy["state"] == "available" and policy["httpStatus"] != 200:
            raise ValueError("Contradictory robots success")
        if policy["state"] == "absent" and policy["httpStatus"] not in (404, 410):
            raise ValueError("Contradictory robots absence")
        if policy["state"] != "available" and (policy["text"] or policy["contentHash"] is not None):
            raise ValueError("Unexpected robots content")
        if any(type(policy[key]) is not int or policy[key] < 0 for key in ("receivedBytes", "durationMs")):
            raise ValueError("Invalid robots metrics")
    return policies


def robots_permission(url, policies, request):
    host = urlsplit(url).hostname
    now = datetime.now(timezone.utc)
    policy = policies.get(host)
    if not policy or parse_date(policy["checkedAt"]).date() != now.date():
        started = time.monotonic()
        policy = {"checkedAt": stamp(), "httpStatus": None, "state": "unknown", "text": "", "contentHash": None,
                  "receivedBytes": 0, "durationMs": 0}
        try:
            status, headers, body = request("https://" + host + "/robots.txt", {})
            policy.update(httpStatus=status, receivedBytes=len(body))
            if status in (404, 410): policy["state"] = "absent"
            elif status == 200 and len(body) <= 65536 and "text/html" not in headers.get("content-type", "").lower():
                text = body.decode("utf-8-sig")
                if not re.search(r"<(?:html|body|script|!doctype)\b", text, re.I):
                    policy.update(state="available", text=text, contentHash=digest(text.encode()))
        except (OSError, ValueError, http.client.HTTPException):
            pass
        policy["durationMs"] = max(0, int((time.monotonic() - started) * 1000))
        policies[host] = policy
    if policy["state"] == "unknown": return "robots_unknown", MIN_HOST_INTERVAL
    if policy["state"] == "absent": return "allowed", MIN_HOST_INTERVAL
    parsed = Protego.parse(policy["text"])
    if not parsed.can_fetch(url, USER_AGENT): return "robots_disallowed", MIN_HOST_INTERVAL
    delay = max(MIN_HOST_INTERVAL, parsed.crawl_delay(USER_AGENT) or 0)
    rate = parsed.request_rate(USER_AGENT)
    if parsed.visit_time(USER_AGENT) or (rate and (rate.start_time or rate.end_time)):
        return "robots_unknown", MIN_HOST_INTERVAL  # unsupported visit windows are never ignored
    if rate:
        if rate.requests <= 0: return "robots_unknown", MIN_HOST_INTERVAL
        delay = max(delay, rate.seconds / rate.requests)
    if not math.isfinite(delay) or delay > 60: return "robots_unknown", MIN_HOST_INTERVAL
    return "allowed", delay


def build_report(listings, sources, rejected, cache, run_at, attempts, mode, skipped, max_age_days, robot_policies=None, metrics=None):
    observations = []
    now = parse_date(run_at)
    for url, source in sources.items():
        cached = cache.get(url, {})
        observation = cached.get("observation")
        stale = observation is None or is_due(source, observation, now, max_age_days)
        observations.append({**source, "observation": observation,
                             "lastSuccessfulObservation": cached.get("lastSuccessfulObservation"), "stale": stale,
                             "runDisposition": skipped.get(url, "checked_this_run"),
                             "reviewFindings": cached.get("reviewFindings", [])})
    counts = Counter(source["observation"]["state"] if source["observation"] else "not_checked" for source in observations)
    report = {"schemaVersion": 1, "policyVersion": POLICY_VERSION, "generatedAt": run_at,
              "mode": mode, "method": "Unauthenticated public HTTP GET; no MCP tools invoked",
              "listings": listings, "sources": observations, "rejectedInputs": rejected,
              "robotsPolicies": [{"host": host, **{key: value for key, value in policy.items() if key != "text"}} for host, policy in sorted((robot_policies or {}).items())],
              "summary": {"listingCount": len(listings), "distinctListingIdCount": len({item["id"] for item in listings}),
                          "uniqueSourceCount": len(sources), "attemptsThisRun": attempts,
                          "httpRequestsThisRun": (metrics or {}).get("requests", 0),
                          "robotsRequestsThisRun": (metrics or {}).get("robotsRequests", 0),
                          "stateCounts": dict(counts), "staleOrUnchecked": sum(source["stale"] for source in observations),
                          "receivedBytesThisRun": (metrics or {}).get("receivedBytes", 0),
                          "requestDurationMsThisRun": (metrics or {}).get("durationMs", 0)},
              "publication": {"mode": "review_required", "catalogWritten": False, "automaticIdentityChanges": False},
              "assessment": {"protocolVersion": None, "actor": None, "transport": None, "applicability": "unknown",
                             "observedCriteria": 0, "totalApplicableCriteria": None, "score": None, "badge": None,
                             "jevEnabled": False, "paidProviderEnabled": False}}
    ids = Counter(item["id"] for item in listings)
    report["inventoryFindings"] = [{"kind": "duplicate_listing_id", "id": ident,
                                    "slugs": [item["slug"] for item in listings if item["id"] == ident],
                                    "resolution": "review_required"} for ident, count in sorted(ids.items()) if count > 1]
    validate_report(report)
    return report


def validate_report(report):
    schema = json.loads((ROOT / "documents/source-monitor-report.schema.json").read_text())
    def local_refs_only(node):
        if isinstance(node, dict):
            if "$ref" in node and not node["$ref"].startswith("#/"):
                raise ValueError("Report schema references must remain local")
            for value in node.values(): local_refs_only(value)
        elif isinstance(node, list):
            for value in node: local_refs_only(value)
    local_refs_only(schema)
    checker = FormatChecker()
    @checker.checks("date-time", raises=(ValueError, TypeError))
    def timestamp(value):
        return not isinstance(value, str) or bool(parse_date(value))
    errors = list(Draft202012Validator(schema, format_checker=checker).iter_errors(report))
    if errors:
        raise ValueError("Report does not satisfy its pinned JSON Schema")
    if report["summary"]["listingCount"] != len(report["listings"]) or report["summary"]["uniqueSourceCount"] != len(report["sources"]):
        raise ValueError("Unknown or inconsistent inventory denominator")
    if len({item["slug"] for item in report["listings"]}) != len(report["listings"]):
        raise ValueError("Duplicate listing URLs")
    for source in report["sources"]:
        if normalize_url(source["url"]) != source["url"] or (source["observation"] and not valid_observation(source["observation"])):
            raise ValueError("Unsafe source or observation")
    assessment = report["assessment"]
    if any(assessment[key] is not None for key in ("protocolVersion", "actor", "transport", "totalApplicableCriteria", "score", "badge")):
        raise ValueError("HTTP availability cannot establish protocol/quality assessment")
    if assessment["jevEnabled"] or assessment["paidProviderEnabled"] or report["publication"]["catalogWritten"]:
        raise ValueError("Read-only monitoring policy violated")


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + ".tmp")
    temp.write_text(json.dumps(data, indent=2, sort_keys=True) + "\n")
    temp.replace(path)


def write_immutable_run(directory, report):
    directory.mkdir(parents=True, exist_ok=True)
    content = json.dumps(report, sort_keys=True, separators=(",", ":")).encode() + b"\n"
    key = report["generatedAt"].replace(":", "-") + "-" + digest(content)[:16]
    target = directory / (key + ".json")
    temp = directory / (key + ".tmp")
    temp.write_bytes(content)
    try:
        os.link(temp, target)  # Never replace an existing run; publish a complete file atomically.
    except FileExistsError:
        if target.read_bytes() != content:
            raise ValueError("Immutable run collision")
    finally:
        temp.unlink()
    return target


def validate_output_paths(cache, output, run_dir, summary=None):
    paths = [cache, output, run_dir] + ([summary] if summary else [])
    for path in paths:
        resolved = path.resolve()
        if resolved.is_relative_to(ROOT) and not resolved.is_relative_to(ROOT / "tmp/source-monitor"):
            raise ValueError("Repository outputs must stay under tmp/source-monitor; catalog/code cannot be overwritten")
    files = [cache, output] + ([summary] if summary else [])
    resolved_files = [path.resolve() for path in files]
    if len(set(resolved_files)) != len(files) or any(path.is_relative_to(run_dir.resolve()) for path in resolved_files):
        raise ValueError("Mutable output paths must differ and stay outside immutable runs")


def is_due(source, observation, now, max_age_days):
    days = 1 if source["priority"] or observation["state"] == "unknown" else max_age_days
    return (now.date() - parse_date(observation["checkedAt"]).date()).days >= days


class RunBudgetExceeded(RuntimeError): pass


def run_checks(sources, cache, max_checks, max_seconds, max_age_days, fetch=fetch_source, wait=time.sleep, clock=time.monotonic, robot_policies=None, metrics=None):
    start, attempts, last_host, stopped_hosts, skipped = clock(), 0, {}, set(), {}
    now = datetime.now(timezone.utc)
    robot_policies = robot_policies if robot_policies is not None else {}
    metrics = metrics if metrics is not None else {}
    metrics.update(requests=0, robotsRequests=0, receivedBytes=0, durationMs=0)
    def request(url, previous, delay=MIN_HOST_INTERVAL):
        host = urlsplit(url).hostname
        pause = delay - (clock() - last_host.get(host, -delay))
        if pause > 0: wait(pause)
        if metrics["requests"] >= max_checks + len(ALLOWED_HOSTS) or clock() - start >= max_seconds:
            raise RunBudgetExceeded()
        last_host[host] = clock()
        metrics["requests"] += 1
        if urlsplit(url).path == "/robots.txt": metrics["robotsRequests"] += 1
        began = clock()
        try:
            status, headers, body = fetch(url, previous)
            metrics["receivedBytes"] += len(body)
            return status, headers, body
        finally:
            metrics["durationMs"] += max(0, int((clock() - began) * 1000))
    for url, entry in cache.items():
        prior = entry["observation"]
        if prior.get("retryAfterSeconds") and now < parse_date(prior["checkedAt"]) + timedelta(seconds=prior["retryAfterSeconds"]):
            stopped_hosts.add(urlsplit(url).hostname)
    ordered = sorted(sources, key=lambda url: (not sources[url]["priority"],
                     (cache.get(url, {}).get("observation") or {}).get("checkedAt", "")))
    for url in ordered:
        previous = cache.get(url, {})
        prior = previous.get("observation")
        host = urlsplit(url).hostname
        if prior and not is_due(sources[url], prior, now, max_age_days):
            skipped[url] = "fresh_cache"; continue
        if host in stopped_hosts:
            skipped[url] = "host_backoff"; continue
        if attempts >= max_checks or clock() - start >= max_seconds:
            skipped[url] = "run_budget"; continue
        try:
            permission, delay = robots_permission(url, robot_policies, request)
        except RunBudgetExceeded:
            skipped[url] = "run_budget"; continue
        if permission != "allowed":
            skipped[url] = permission; continue
        checked_at = stamp()
        request_start = clock()
        try:
            status, headers, body = request(url, previous, delay)
            attempts += 1
            observation = observe(status, headers, body, previous, checked_at, max(0, int((clock() - request_start) * 1000)))
            if status in (403, 429):
                stopped_hosts.add(host)
        except RunBudgetExceeded:
            skipped[url] = "run_budget"; continue
        except (OSError, ValueError, http.client.HTTPException) as error:
            attempts += 1
            reason = ("scanner_policy_refusal" if isinstance(error, ValueError) else "timeout" if isinstance(error, TimeoutError)
                      else "tls_failure" if isinstance(error, ssl.SSLError) else "dns_failure" if isinstance(error, socket.gaierror)
                      else "transport_failure" if isinstance(error, http.client.HTTPException) else "network_or_policy_failure")
            observation = {"checkedAt": checked_at, "httpStatus": None, "state": "unknown",
                           "reason": reason, "contentHash": None,
                           "etag": None, "lastModified": None, "bodyComplete": False,
                           "evidenceType": "observed_http", "retryAfterSeconds": None,
                           "receivedBytes": 0, "durationMs": max(0, int((clock() - request_start) * 1000))}
        cache[url] = update_cache(previous, observation)
    return cache, attempts, skipped


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="Perform bounded allowlisted public GETs")
    mode.add_argument("--dry-run", action="store_true", help="Inventory and cached evidence only (default)")
    parser.add_argument("--cache", type=Path, default=ROOT / "tmp/source-monitor/cache.json")
    parser.add_argument("--output", type=Path, default=ROOT / "tmp/source-monitor/report.json")
    parser.add_argument("--summary", type=Path)
    parser.add_argument("--run-dir", type=Path, default=ROOT / "tmp/source-monitor/runs")
    parser.add_argument("--max-checks", type=int, default=120)
    parser.add_argument("--max-seconds", type=int, default=1200)
    parser.add_argument("--max-age-days", type=int, default=7)
    args = parser.parse_args()
    if not 0 <= args.max_checks <= 700 or not 1 <= args.max_seconds <= 1200 or not 1 <= args.max_age_days <= 30:
        parser.error("Request/time/cache limits exceed the public-source policy")
    try:
        validate_output_paths(args.cache, args.output, args.run_dir, args.summary)
    except ValueError as error:
        parser.error(str(error))
    catalog = json.loads((ROOT / "data/mcps.json").read_text())
    curated = json.loads((ROOT / "data/listing-evidence.json").read_text())
    listings, sources, rejected = inventory(catalog, curated)
    cache = read_cache(args.cache, sources)
    robots, metrics = read_robot_cache(args.cache), {}
    attempts, skipped = 0, {url: "dry_run" for url in sources}
    if args.check:
        cache, attempts, skipped = run_checks(sources, cache, args.max_checks, args.max_seconds, args.max_age_days, robot_policies=robots, metrics=metrics)
    report = build_report(listings, sources, rejected, cache, stamp(), attempts,
                          "check" if args.check else "dry_run", skipped, args.max_age_days, robots, metrics)
    write_immutable_run(args.run_dir, report)
    if args.check:
        write_json(args.cache, {"schemaVersion": 1, "policyVersion": POLICY_VERSION, "sources": cache, "robotsPolicies": robots})
    write_json(args.output, report)
    summary = ("## EveryMCP source observations\n\n"
               f"Generated: {report['generatedAt']} · policy: {POLICY_VERSION}\n\n"
               f"{len(listings)} listings; {len(sources)} deduplicated sources; {attempts} attempts this run.\n\n"
               f"States: `{json.dumps(report['summary']['stateCounts'], sort_keys=True)}`. "
               f"Stale/unchecked: {report['summary']['staleOrUnchecked']}; rejected inputs: {len(rejected)}.\n\n"
               "HTTP observations do not establish publisher identity, tool behavior, security or protocol conformance. "
               "Jev/provider calls disabled; score and badge null. Catalog unchanged. "
               "Review cached JSON before updating dated public evidence.\n")
    if args.summary:
        with args.summary.open("a") as file:
            file.write(summary)
    print(json.dumps(report["summary"], sort_keys=True))


if __name__ == "__main__":
    main()
