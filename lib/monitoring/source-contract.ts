import { createHash } from "node:crypto";
import schemaDocument from "@/documents/source-monitor-report.schema.json";

export const MAX_SOURCE_BYTES = 2 * 1024 * 1024;
export type Section = { id: string; heading: string; headingTruncated: boolean; excerpt: string; excerptTruncated: boolean; contentHash: string };
export type DocumentProjection = { profileVersion: "static-document-v1"; state: "captured" | "not_captured" | "incomplete" | "unsupported"; reason: string; sourceUrl: string; sourceIdentity: string; bodyHash: string | null; bodyObservedAt: string | null; mediaType: string | null; projectionHash: string | null; sections: Section[]; omissions: string[] };
export type Observation = { checkedAt: string; httpStatus: number | null; state: "reachable" | "missing_at_check" | "unknown"; reason: string; contentHash: string | null; etag: string | null; lastModified: string | null; bodyComplete: boolean; evidenceType: "observed_http"; retryAfterSeconds: number | null; receivedBytes: number; durationMs: number; documentProjection?: DocumentProjection };
export type Relationship = { id: string; slug: string; role: string; identityEvidence: string; curatedCheckedAt: string | null; basis: string };
export type Finding = { kind: string; firstObservedAt: string; lastObservedAt: string; resolution: "review_required" };
export type Source = { url: string; relationships: Relationship[]; priority: boolean; observation: Observation | null; lastSuccessfulObservation: Observation | null; stale: boolean; runDisposition: string; reviewFindings: Finding[] };
export type SourceReport = { schemaVersion: 1 | 2; policyVersion: string; generatedAt: string; mode: "check" | "dry_run"; method: string; listings: { id: string; slug: string; publisherAssessment: "unknown" }[]; sources: Source[]; rejectedInputs: { id: string; slug: string; reason: string; inputHash: string }[]; summary: Record<string, unknown>; publication: Record<string, unknown>; assessment: Record<string, unknown>; inventoryFindings: unknown[]; robotsPolicies: unknown[] };
export const sha256 = (bytes: Buffer | string) => createHash("sha256").update(bytes).digest("hex");
const hex = /^[a-f0-9]{64}$/;
const hosts = new Set(["github.com", "www.revenuecat.com", "contentsquare.com", "docs.coingecko.com", "stack.convex.dev", "docs.cursor.com"]);
export function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) throw new Error("Expected plain object");
  return value as Record<string, unknown>;
}
export function canonicalJson(value: unknown): Buffer {
  function encode(item: unknown, depth = 0): string {
    if (depth > 64) throw new Error("JSON depth limit");
    if (item === null) return "null";
    if (typeof item === "boolean") return item ? "true" : "false";
    if (typeof item === "number") {
      if (!Number.isSafeInteger(item) || Object.is(item, -0)) throw new Error("Canonical receipt numbers must be safe integers");
      return String(item);
    }
    if (typeof item === "string") return JSON.stringify(item).replace(/[\u007f-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"));
    if (Array.isArray(item)) return "[" + item.map((x) => encode(x, depth + 1)).join(",") + "]";
    const record = object(item);
    // Receipt keys are ASCII. Reject ambiguous Unicode-key ordering rather than claim Python parity.
    if (Object.keys(record).some((key) => /[^\x20-\x7e]/.test(key))) throw new Error("Non-ASCII receipt key");
    return "{" + Object.keys(record).sort().map((key) => encode(key, depth + 1) + ":" + encode(record[key], depth + 1)).join(",") + "}";
  }
  return Buffer.from(encode(value) + "\n", "utf8");
}
export function parseCanonical(bytes: Buffer, limit = MAX_SOURCE_BYTES): unknown {
  if (!Buffer.isBuffer(bytes) || bytes.length > limit) throw new Error("Receipt byte limit");
  const value: unknown = JSON.parse(bytes.toString("utf8"));
  if (!canonicalJson(value).equals(bytes)) throw new Error("Noncanonical, duplicate-key or invalid UTF-8 receipt");
  return value;
}
export function timestamp(value: string): number {
  const match = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.(\d{1,3}))?(Z|[+-]\d\d:\d\d)$/.exec(value);
  if (!match) throw new Error("Unsupported timestamp precision or timezone");
  const [year, month, day, hour, minute, second] = match.slice(1, 7).map(Number);
  const date = new Date(0); date.setUTCFullYear(year, month - 1, day); date.setUTCHours(hour, minute, second, 0);
  if (year < 1 || date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day || hour > 23 || minute > 59 || second > 59 || match[8] !== "Z" && (Number(match[8].slice(1, 3)) > 23 || Number(match[8].slice(4)) > 59)) throw new Error("Invalid timestamp");
  const result = Date.parse(value);
  if (!Number.isFinite(result)) throw new Error("Invalid timestamp");
  return result;
}
export function isDue(source: Pick<Source, "priority">, observation: Observation | null, asOf: string, maxAgeDays = 7): boolean {
  if (!observation) return true;
  timestamp(asOf); timestamp(observation.checkedAt);
  const days = source.priority || observation.state === "unknown" ? 1 : maxAgeDays;
  return (Date.parse(asOf.slice(0, 10)) - Date.parse(observation.checkedAt.slice(0, 10))) / 86400000 >= days;
}

// Deliberately supports only the keywords used by our pinned schema, never remote refs.
type Rule = { $ref?: string; type?: string | string[]; const?: unknown; enum?: unknown[]; properties?: Record<string, Rule>; required?: string[]; additionalProperties?: boolean; items?: Rule; minItems?: number; maxItems?: number; uniqueItems?: boolean; minimum?: number; maximum?: number; maxLength?: number; pattern?: string; format?: string; anyOf?: Rule[]; oneOf?: Rule[]; allOf?: Rule[]; if?: Rule; then?: Rule; else?: Rule; $defs?: Record<string, Rule> };
const schema = schemaDocument as unknown as Rule;
function matches(value: unknown, rule: Rule, depth = 0): boolean {
  if (depth > 64) return false;
  if (rule.$ref) {
    const key = /^#\/\$defs\/([A-Za-z0-9]+)$/.exec(rule.$ref)?.[1];
    if (!key || !schema.$defs?.[key]) throw new Error("Unsupported schema reference");
    return matches(value, schema.$defs[key], depth + 1);
  }
  if ("const" in rule && !canonicalJson(value).equals(canonicalJson(rule.const))) return false;
  if (rule.enum && !rule.enum.some((item) => canonicalJson(item).equals(canonicalJson(value)))) return false;
  const types = rule.type ? Array.isArray(rule.type) ? rule.type : [rule.type] : [];
  if (types.length && !types.some((type) => type === "null" ? value === null : type === "array" ? Array.isArray(value) : type === "object" ? !!value && typeof value === "object" && !Array.isArray(value) : type === "integer" ? Number.isSafeInteger(value) : typeof value === type)) return false;
  if (rule.allOf && !rule.allOf.every((part) => matches(value, part, depth + 1))) return false;
  if (rule.anyOf && !rule.anyOf.some((part) => matches(value, part, depth + 1))) return false;
  if (rule.oneOf && rule.oneOf.filter((part) => matches(value, part, depth + 1)).length !== 1) return false;
  if (rule.if && !matches(value, matches(value, rule.if, depth + 1) ? rule.then || {} : rule.else || {}, depth + 1)) return false;
  if (typeof value === "number" && (rule.minimum !== undefined && value < rule.minimum || rule.maximum !== undefined && value > rule.maximum)) return false;
  if (typeof value === "string") {
    if (rule.maxLength !== undefined && [...value].length > rule.maxLength || rule.pattern && !new RegExp(rule.pattern).test(value)) return false;
    try { if (rule.format === "date-time") timestamp(value); if (rule.format === "uri") new URL(value); } catch { return false; }
  }
  if (Array.isArray(value)) {
    if (rule.minItems !== undefined && value.length < rule.minItems || rule.maxItems !== undefined && value.length > rule.maxItems) return false;
    if (rule.uniqueItems && new Set(value.map((x) => canonicalJson(x).toString())).size !== value.length) return false;
    if (rule.items && !value.every((item) => matches(item, rule.items!, depth + 1))) return false;
  } else if (value && typeof value === "object") {
    const record = object(value);
    if (rule.required?.some((key) => !(key in record))) return false;
    if (rule.additionalProperties === false && Object.keys(record).some((key) => !rule.properties || !(key in rule.properties))) return false;
    if (Object.entries(rule.properties || {}).some(([key, child]) => key in record && !matches(record[key], child, depth + 1))) return false;
  }
  return true;
}
export function normalizeSourceUrl(raw: unknown): string {
  if (typeof raw !== "string" || /[\s\\\x00-\x1f\x7f%?#]/.test(raw) || /\/(?:\.|\.\.)(?:\/|$)/.test(raw)) throw new Error("URL policy rejected");
  const url = new URL(raw); if (url.hostname === "www.github.com") url.hostname = "github.com";
  if (url.protocol !== "https:" || url.username || url.password || url.port || !hosts.has(url.hostname)) throw new Error("URL policy rejected");
  let path = url.pathname;
  if (url.hostname === "github.com") {
    path = path.replace(/\/+$/, "").replace(/\.git$/, "");
    if (!/^\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+(?:\/[A-Za-z0-9_.-]+)*$/.test(path)) throw new Error("URL policy rejected");
    const parts = path.split("/"); parts[1] = parts[1].toLowerCase(); parts[2] = parts[2].toLowerCase(); path = parts.join("/");
  }
  return "https://" + url.hostname + path;
}
export function sourceInventory(catalog: unknown[], curated: unknown[]) {
  const reviewed = new Map(curated.map((item) => { const row = object(item); return [row.slug, row]; }));
  const listings: SourceReport["listings"] = [], rejected: SourceReport["rejectedInputs"] = [];
  const sources = new Map<string, { url: string; priority: boolean; relationships: Relationship[] }>();
  const slugs = new Set<string>();
  for (const item of catalog) {
    const row = object(item); const id = String(row.id), slug = String(row.slug);
    if (typeof row.id !== "string" || typeof row.slug !== "string" || !/^[a-z0-9][a-z0-9._-]{0,100}$/.test(id) || !/^[a-z0-9][a-z0-9._-]{0,100}$/.test(slug) || slugs.has(slug)) throw new Error("Invalid catalog identity");
    slugs.add(slug); listings.push({ id, slug, publisherAssessment: "unknown" });
    const refs = reviewed.get(slug)?.references || [];
    if (!Array.isArray(refs)) throw new Error("Invalid catalog references");
    const links = [{ raw: row.repo, role: "indexed_repository", identityEvidence: "unknown", checkedAt: null as string | null }, ...refs.map((ref) => { const r = object(ref); return { raw: r.url, role: "separate_reference", identityEvidence: String(r.kind), checkedAt: String(r.checkedAt) }; })];
    for (const link of links) {
      const relation = { id, slug, role: link.role, identityEvidence: link.identityEvidence, curatedCheckedAt: link.checkedAt, basis: link.checkedAt ? "documented" : "unknown" };
      let url: string;
      try { url = normalizeSourceUrl(link.raw); } catch { if (typeof link.raw !== "string") throw new Error("Unsupported rejected-input encoding"); rejected.push({ id, slug, reason: "url_policy_rejected", inputHash: sha256(link.raw) }); continue; }
      const entry = sources.get(url) || { url, relationships: [], priority: false };
      entry.priority ||= reviewed.has(slug);
      if (!entry.relationships.some((r) => canonicalJson(r).equals(canonicalJson(relation)))) entry.relationships.push(relation);
      sources.set(url, entry);
    }
  }
  return { listings, sources, rejected };
}
export function inventoryDigest(catalog: unknown[], curated: unknown[]): string {
  const items = sourceInventory(catalog, curated);
  return sha256(canonicalJson({ listings: items.listings, sources: [...items.sources.values()].sort((a, b) => a.url < b.url ? -1 : 1), rejected: items.rejected }));
}
export function inventorySourceUrls(catalog: unknown[], curated: unknown[], slugs: string[]): string[] {
  return [...sourceInventory(catalog, curated).sources.values()].filter((s) => s.relationships.some((r) => slugs.includes(r.slug))).map((s) => s.url).sort();
}
export function validateProjection(p: DocumentProjection, obs: Observation, source: Pick<Source, "url" | "relationships">) {
  const raw = (value: unknown) => canonicalJson(value).subarray(0, -1);
  const relations = [...source.relationships].sort((a, b) => Buffer.compare(raw(a), raw(b)));
  if (p.sourceUrl !== source.url || p.sourceIdentity !== sha256(raw({ url: source.url, relationships: relations })) || p.bodyHash !== obs.contentHash) throw new Error("Projection source/body binding mismatch");
  if (p.bodyObservedAt && (timestamp(p.bodyObservedAt) > timestamp(obs.checkedAt) || obs.httpStatus !== 304 && timestamp(p.bodyObservedAt) !== timestamp(obs.checkedAt))) throw new Error("Invalid capture date");
  if (p.omissions.join("\0") !== [...new Set(p.omissions)].sort().join("\0")) throw new Error("Invalid projection omissions");
  if (p.state !== "captured") {
    if (p.sections.length || p.projectionHash !== null || p.omissions.length) throw new Error("Unavailable projection contains text");
    if (p.state === "not_captured" && (p.reason !== "legacy_body_not_retained" || p.bodyObservedAt !== null)) throw new Error("Invented legacy capture");
    if (p.state === "incomplete" && !["body_unavailable", "projection_limit"].includes(p.reason) || p.state === "unsupported" && ["complete_static_projection", "legacy_body_not_retained", "body_unavailable", "projection_limit"].includes(p.reason)) throw new Error("Contradictory capture state");
    if (p.reason === "body_unavailable" && (obs.bodyComplete || p.bodyObservedAt !== null)) throw new Error("Unavailable body capture");
    if ((p.state === "unsupported" || p.reason === "projection_limit") && (!p.bodyObservedAt || obs.state !== "reachable" || !obs.bodyComplete)) throw new Error("Missing original response");
    return;
  }
  if (p.reason !== "complete_static_projection" || !p.bodyObservedAt || obs.state !== "reachable" || !obs.bodyComplete || !p.sections.length || !p.mediaType) throw new Error("Incomplete projection cannot compare");
  if (new Set(p.sections.map((s) => s.id)).size !== p.sections.length) throw new Error("Duplicate section identity");
  let words = 0;
  for (const section of p.sections) for (const field of [section.heading, section.excerpt]) {
    if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f\u202a-\u202e\u2066-\u2069]/.test(field)) throw new Error("Unsafe fragment");
    words += (field.match(/[^\u0009-\u000d\u001c-\u0020\u0085\u00a0\u1680\u2000-\u200a\u2028\u2029\u202f\u205f\u3000]+/gu) || []).length;
  }
  if (words > 24 || p.projectionHash !== sha256(raw({ sections: p.sections.map(({ id, contentHash }) => ({ id, contentHash })), omissions: p.omissions }))) throw new Error("Projection digest/quote limit");
}
function validateObservation(obs: Observation, source: Source, generated: number) {
  if (timestamp(obs.checkedAt) > generated || obs.receivedBytes > 1048577) throw new Error("Observation time/size mismatch");
  const status = obs.httpStatus;
  for (const value of [obs.etag, obs.lastModified]) if (value !== null && (!value.length || value.length > 256 || /[^\x20-\x7e]/.test(value))) throw new Error("Unsafe response header");
  if (obs.state === "reachable") {
    if (status === null || !(status >= 200 && status < 300 && status !== 206 || status === 304) || !["http_success", "not_modified"].includes(obs.reason) || !obs.contentHash || !hex.test(obs.contentHash) || !obs.bodyComplete) throw new Error("Contradictory reachable observation");
  } else {
    if (obs.contentHash !== null || obs.bodyComplete) throw new Error("Unavailable response claims a body");
    if (obs.state === "missing_at_check" && (![404, 410].includes(status || 0) || obs.reason !== "http_missing_at_check")) throw new Error("Contradictory missing observation");
    if (obs.state === "unknown" && ["http_success", "not_modified", "http_missing_at_check"].includes(obs.reason)) throw new Error("Contradictory unknown observation");
  }
  if (obs.documentProjection) validateProjection(obs.documentProjection, obs, source);
}
export function validateSourceReport(value: unknown, catalog: unknown[], curated: unknown[]): SourceReport {
  if (canonicalJson(value).length > MAX_SOURCE_BYTES || !matches(value, schema)) throw new Error("Source receipt does not match pinned schema");
  const report = value as SourceReport, expected = sourceInventory(catalog, curated), generated = timestamp(report.generatedAt);
  if (!canonicalJson(report.listings).equals(canonicalJson(expected.listings)) || !canonicalJson(report.rejectedInputs).equals(canonicalJson(expected.rejected)) || report.sources.length !== expected.sources.size || new Set(report.sources.map((s) => s.url)).size !== expected.sources.size) throw new Error("Receipt inventory mismatch");
  const counts: Record<string, number> = {}; let stale = 0, attempts = 0, received = 0;
  for (const source of report.sources) {
    if (normalizeSourceUrl(source.url) !== source.url || !canonicalJson({ url: source.url, relationships: source.relationships, priority: source.priority }).equals(canonicalJson(expected.sources.get(source.url)))) throw new Error("Source identity mismatch");
    const observation = source.observation, success = source.lastSuccessfulObservation;
    for (const obs of [observation, success]) if (obs) validateObservation(obs, source, generated);
    if (success && (success.state !== "reachable" || !observation || timestamp(success.checkedAt) > timestamp(observation.checkedAt)) || observation?.state === "reachable" && !canonicalJson(observation).equals(canonicalJson(success))) throw new Error("Last-success mismatch");
    for (const finding of source.reviewFindings) if (timestamp(finding.firstObservedAt) > timestamp(finding.lastObservedAt) || timestamp(finding.lastObservedAt) > generated) throw new Error("Invalid finding chronology");
    if (source.stale !== isDue(source, observation, report.generatedAt)) throw new Error("Freshness mismatch");
    stale += Number(source.stale); const state = observation?.state || "not_checked"; counts[state] = (counts[state] || 0) + 1;
    if (source.runDisposition === "checked_this_run") { if (!observation) throw new Error("Missing checked observation"); attempts++; received += observation.receivedBytes; }
    if (source.runDisposition === "fresh_cache" && (!observation || isDue(source, observation, report.generatedAt))) throw new Error("Invalid cache disposition");
  }
  const summary = report.summary;
  if (summary.listingCount !== report.listings.length || summary.distinctListingIdCount !== new Set(report.listings.map((x) => x.id)).size || summary.uniqueSourceCount !== report.sources.length || summary.attemptsThisRun !== attempts || summary.staleOrUnchecked !== stale || !canonicalJson(summary.stateCounts).equals(canonicalJson(counts))) throw new Error("Source cohort counters mismatch");
  const robots = Number(summary.robotsRequestsThisRun), requests = Number(summary.httpRequestsThisRun);
  if (attempts > 120 || robots > 6 || requests !== attempts + robots || Number(summary.receivedBytesThisRun) < received || Number(summary.receivedBytesThisRun) > requests * 1048577 || Number(summary.requestDurationMsThisRun) > 1500000) throw new Error("Source execution budget mismatch");
  const ids = new Map<string, string[]>(); for (const row of report.listings) ids.set(row.id, [...ids.get(row.id) || [], row.slug]);
  const findings = [...ids.entries()].filter(([, slugs]) => slugs.length > 1).sort(([a], [b]) => a < b ? -1 : 1).map(([id, slugs]) => ({ kind: "duplicate_listing_id", id, slugs, resolution: "review_required" }));
  if (!canonicalJson(findings).equals(canonicalJson(report.inventoryFindings))) throw new Error("Inventory findings mismatch");
  const seenHosts = new Set<string>();
  for (const raw of report.robotsPolicies) {
    const r = object(raw), host = String(r.host);
    if (!hosts.has(host) || seenHosts.has(host) || timestamp(String(r.checkedAt)) > generated || r.state === "available" && (r.httpStatus !== 200 || !r.contentHash) || r.state === "absent" && ![404, 410].includes(Number(r.httpStatus)) || r.state !== "available" && r.contentHash !== null) throw new Error("Invalid robots evidence");
    seenHosts.add(host);
  }
  return report;
}
