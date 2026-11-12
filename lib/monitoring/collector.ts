import { performance } from "node:perf_hooks";
import { setTimeout as sleep } from "node:timers/promises";
import type { CollectorContext, CollectorLimits, Job, SourceCollector } from "./runtime";
import { canonicalJson, isDue, normalizeSourceUrl, object, sha256, sourceInventory, timestamp, validateSourceReport, type Observation, type Source, type SourceReport } from "./source-contract";
import { projectDocument } from "./document-projection";
import { robotsPermission } from "./robots";
import { createPublicSourceTransport, safeConditional, type ResponseBytes, type SourceTransport } from "./transport";
const clone = <T,>(value: T): T => JSON.parse(canonicalJson(value).toString()) as T;
const instant = (clock: () => Date) => clock().toISOString();
function observe(result: ResponseBytes, source: Source, checkedAt: string): Observation {
  const prior = source.lastSuccessfulObservation, status = result.status;
  const observation: Observation = { checkedAt, httpStatus: status, state: "unknown", reason: result.failure || "http_unknown", contentHash: null, etag: null, lastModified: null, bodyComplete: false, evidenceType: "observed_http", retryAfterSeconds: null, receivedBytes: result.receivedBytes, durationMs: result.durationMs };
  if (!result.failure && result.complete) {
    if (status === 304) {
      if (prior?.bodyComplete && prior.contentHash) Object.assign(observation, clone(prior), { checkedAt, httpStatus: 304, state: "reachable", reason: "not_modified", receivedBytes: result.receivedBytes, durationMs: result.durationMs });
      else observation.reason = "not_modified_without_prior_body";
    } else if (status !== null && status >= 200 && status < 300) {
      if (status === 206) observation.reason = "partial_or_oversized_body";
      else Object.assign(observation, { state: "reachable", reason: "http_success", contentHash: sha256(result.body), bodyComplete: true, etag: safeConditional(result.headers.etag), lastModified: safeConditional(result.headers["last-modified"]) });
    } else if (status === 404 || status === 410) Object.assign(observation, { state: "missing_at_check", reason: "http_missing_at_check" });
    else if (status === 401 || status === 403 || status === 429) {
      observation.reason = status === 401 ? "authentication_required" : status === 403 ? "blocked" : "rate_limited";

    } else if (status !== null && status >= 300 && status < 400) observation.reason = "redirect_not_followed";
    else if (status !== null && status >= 500) observation.reason = "server_error";
  }
  // A rate-limit status remains a host cooldown even if its body is malformed/incomplete.
  if (status === 403 || status === 429) {
    const header = safeConditional(result.headers["retry-after"]);
    let seconds = header && /^\d+$/.test(header) ? Number(header) : header ? Math.ceil((Date.parse(header) - timestamp(checkedAt)) / 1000) : 3600;
    if (!Number.isFinite(seconds)) seconds = 3600;
    observation.retryAfterSeconds = Math.min(86400, Math.max(60, seconds));
  }
  observation.documentProjection = projectDocument(result.body, result.headers, source, observation, prior);
  return observation;
}
function update(source: Source, observation: Observation) {
  const previous = source.lastSuccessfulObservation;
  const kind = observation.state === "reachable" && previous?.contentHash && previous.contentHash !== observation.contentHash ? "source_body_changed" : observation.state === "missing_at_check" ? "source_missing_at_check" : null;
  if (kind) {
    const finding = source.reviewFindings.find(item => item.kind === kind);
    if (finding) finding.lastObservedAt = observation.checkedAt;
    else source.reviewFindings.push({ kind, firstObservedAt: observation.checkedAt, lastObservedAt: observation.checkedAt, resolution: "review_required" });
  }
  source.observation = observation;
  if (observation.state === "reachable") source.lastSuccessfulObservation = clone(observation);
  source.runDisposition = "checked_this_run";
}

/** Actual bounded Node collection. Its transport is explicit code wiring, never request/env selection. */
export function createNodeCollector(options: { now?: () => Date; transport?: SourceTransport } = {}): SourceCollector {
  const clock = options.now || (() => new Date()), transport = options.transport || createPublicSourceTransport();
  const collect: SourceCollector = async (job: Job, limits: CollectorLimits, context: CollectorContext) => {
    const startedAt = instant(clock), began = performance.now();
    const budget = Math.min(30000, timestamp(limits.deadline) - timestamp(startedAt));
    const remaining = () => budget - (performance.now() - began);
    if (limits.maxSourceAttempts !== 2 || limits.maxRobotsRequests !== 1 || budget <= 0 || limits.signal.aborted || job.kind !== "capture") throw new Error("Invalid capture budget");
    const inventory = sourceInventory(context.inventory.catalog, context.inventory.curated);
    const selected = job.sourceUrls;
    if (!selected.length || selected.length > 2 || new Set(selected).size !== selected.length || selected.some(url => normalizeSourceUrl(url) !== url || !inventory.sources.get(url)?.relationships.some(relation => job.slugs.includes(relation.slug))) || new Set(selected.map(url => new URL(url).hostname)).size !== 1) throw new Error("Noncanonical source cohort");
    const previous = context.previous && validateSourceReport(context.previous, context.inventory.catalog, context.inventory.curated);
    if (previous && timestamp(previous.generatedAt) >= timestamp(startedAt)) throw new Error("Predecessor must precede capture");
    const old = new Map(previous?.sources.map(source => [source.url, source]) || []);
    const sources: Source[] = [...inventory.sources.values()].sort((a,b) => a.url < b.url ? -1 : 1).map(identity => {
      const prior = old.get(identity.url);
      return { ...identity, observation: prior?.observation ? clone(prior.observation) : null, lastSuccessfulObservation: prior?.lastSuccessfulObservation ? clone(prior.lastSuccessfulObservation) : null, reviewFindings: clone(prior?.reviewFindings || []), stale: true, runDisposition: "run_budget" };
    });
    const host = new URL(selected[0]).hostname;
    const retainedCooldowns = previous?.robotsPolicies.map(object).filter(policy => (policy.httpStatus === 403 || policy.httpStatus === 429) && timestamp(String(policy.checkedAt)) + 86400000 > timestamp(startedAt)) || [];
    const oldRobots = retainedCooldowns.find(policy => policy.host === host);
    // The retained v2 robots schema has no Retry-After field. A conservative full-day
    // cooldown covers this collector's bounded backoff without inventing a stored header.
    const robotsCooldown = !!oldRobots && timestamp(String(oldRobots.checkedAt)) + 86400000 > timestamp(startedAt);
    const stopped = robotsCooldown || sources.some(source => new URL(source.url).hostname === host && source.observation?.retryAfterSeconds && timestamp(source.observation.checkedAt) + source.observation.retryAfterSeconds * 1000 > timestamp(startedAt));
    const due = sources.filter(source => selected.includes(source.url) && isDue(source, source.observation, startedAt));
    for (const source of sources) if (source.observation && !isDue(source, source.observation, startedAt)) source.runDisposition = "fresh_cache";
    let attempts = 0, robotsRequests = 0, received = 0, duration = 0;
    const policies: SourceReport["robotsPolicies"] = clone(retainedCooldowns);
    if (stopped) for (const source of due) source.runDisposition = "host_backoff";
    else if (due.length && remaining() > 0) {
      robotsRequests++;
      const robotAt = instant(clock);
      const robots = await transport.get({ sourceUrl: selected[0], kind: "robots", signal: limits.signal, timeoutMs: Math.min(8000, remaining()) });
      received += robots.receivedBytes; duration += robots.durationMs;
      let policyState: "available" | "absent" | "unknown" = "unknown", text = "", hash: string | null = null;
      if (!robots.failure && robots.complete) {
        if (robots.status === 404 || robots.status === 410) policyState = "absent";
        else if (robots.status === 200 && (!robots.headers["content-type"] || /^text\/plain(?:\s*;\s*charset=(?:utf-8|"utf-8"))?\s*$/i.test(robots.headers["content-type"]))) {
          try { text = new TextDecoder("utf-8", { fatal: true }).decode(robots.body); if (!/<\s*\/?\s*(?:html|body|script|!doctype)\b/i.test(text)) { policyState = "available"; hash = sha256(text); } } catch { /* unknown; no source request */ }
        }
      }
      policies.push({ host, checkedAt: robotAt, httpStatus: robots.status, state: policyState, contentHash: hash, receivedBytes: robots.receivedBytes, durationMs: robots.durationMs });
      let lastFinished = performance.now(), stopHost = false;
      for (const source of due) {
        if (stopHost) { source.runDisposition = "host_backoff"; continue; }
        const permission = policyState === "absent" ? { state: "allowed" as const, minIntervalMs: 1000 } : policyState === "available" ? robotsPermission(text, source.url) : { state: "robots_unknown" as const, minIntervalMs: 1000 };
        if (permission.state !== "allowed") { source.runDisposition = permission.state; continue; }
        const waitMs = Math.max(0, permission.minIntervalMs - (performance.now() - lastFinished));
        if (attempts >= 2 || remaining() <= waitMs || limits.signal.aborted) { source.runDisposition = "run_budget"; continue; }
        try { if (waitMs) await sleep(waitMs, undefined, { signal: limits.signal }); } catch { source.runDisposition = "run_budget"; continue; }
        if (remaining() <= 0 || limits.signal.aborted) { source.runDisposition = "run_budget"; continue; }
        const checkedAt = instant(clock); attempts++;
        const result = await transport.get({ sourceUrl: source.url, kind: "source", signal: limits.signal, timeoutMs: Math.min(8000, remaining()), etag: source.lastSuccessfulObservation?.etag, lastModified: source.lastSuccessfulObservation?.lastModified });
        lastFinished = performance.now(); received += result.receivedBytes; duration += result.durationMs;
        update(source, observe(result, source, checkedAt));
        if (result.status === 403 || result.status === 429) stopHost = true;
      }
    }
    const generatedAt = instant(clock), counts: Record<string, number> = {};
    for (const source of sources) { source.stale = isDue(source, source.observation, generatedAt); const state = source.observation?.state || "not_checked"; counts[state] = (counts[state] || 0) + 1; }
    const ids = new Map<string, string[]>(); for (const listing of inventory.listings) ids.set(listing.id, [...ids.get(listing.id) || [], listing.slug]);
    const report: SourceReport = {
      schemaVersion: 2, policyVersion: "public-source-v2", generatedAt, mode: "check", method: "Unauthenticated public HTTP GET; no MCP tools invoked",
      listings: inventory.listings, sources, rejectedInputs: inventory.rejected, robotsPolicies: policies,
      summary: { listingCount: inventory.listings.length, distinctListingIdCount: ids.size, uniqueSourceCount: sources.length, attemptsThisRun: attempts, httpRequestsThisRun: attempts + robotsRequests, robotsRequestsThisRun: robotsRequests, stateCounts: counts, staleOrUnchecked: sources.filter(source => source.stale).length, receivedBytesThisRun: received, requestDurationMsThisRun: duration },
      publication: { mode: "review_required", catalogWritten: false, automaticIdentityChanges: false },
      assessment: { protocolVersion: null, actor: null, transport: null, applicability: "unknown", observedCriteria: 0, totalApplicableCriteria: null, score: null, badge: null, jevEnabled: false, paidProviderEnabled: false },
      inventoryFindings: [...ids.entries()].filter(([, slugs]) => slugs.length > 1).sort(([a],[b]) => a < b ? -1 : 1).map(([id, slugs]) => ({ kind: "duplicate_listing_id", id, slugs, resolution: "review_required" })),
    };
    return validateSourceReport(report, context.inventory.catalog, context.inventory.curated);
  };
  Object.defineProperty(collect, "evidenceClass", { value: transport.evidenceClass, writable: false });
  return collect;
}
