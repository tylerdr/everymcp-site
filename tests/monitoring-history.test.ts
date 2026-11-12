import { describe, expect, it } from "vitest";
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { buildNodeHistory, compareNodeDocuments, NODE_HISTORY_POLICY, renderNodeHistory, type NodeSnapshot } from "../lib/monitoring/history";
import { canonicalJson, isDue, sha256, type SourceReport } from "../lib/monitoring/source-contract";

// Entirely fictional response bytes and execution identities. No collector or network use.
const URL = "https://github.com/fictional/history-fixture";
const SLUGS = ["fictional-one", "fictional-two"];
const CATALOG = SLUGS.map((slug, index) => ({ id: `fixture-${index + 1}`, slug, name: `Fictional ${index + 1}`, repo: URL }));
const AS_OF = "2026-11-12T00:00:00Z";
type Observation = NonNullable<SourceReport["sources"][number]["observation"]>;
type Projection = NonNullable<Observation["documentProjection"]>;
const clone = <T,>(value: T): T => structuredClone(value);
const projectionDigest = (value: unknown) => sha256(canonicalJson(value).subarray(0, -1));

function captured(observation: Observation, excerpt: string, options: { heading?: string; sectionId?: string; sectionHash?: string; omissions?: string[] } = {}): Projection {
  const relationships = CATALOG.map(item => ({ id: item.id, slug: item.slug, role: "indexed_repository", identityEvidence: "unknown", curatedCheckedAt: null, basis: "unknown" }));
  const sections = [{ id: options.sectionId ?? `${sha256("heading")}:1`, heading: options.heading ?? "Installation", headingTruncated: false, excerpt, excerptTruncated: false, contentHash: options.sectionHash ?? sha256(excerpt) }];
  const omissions = options.omissions ?? [];
  return {
    profileVersion: "static-document-v1", state: "captured", reason: "complete_static_projection", sourceUrl: URL,
    sourceIdentity: projectionDigest({ url: URL, relationships: relationships.sort((a, b) => Buffer.compare(canonicalJson(a), canonicalJson(b))) }),
    bodyHash: observation.contentHash, bodyObservedAt: observation.checkedAt, mediaType: "text/html",
    projectionHash: projectionDigest({ sections: sections.map(({ id, contentHash }) => ({ id, contentHash })), omissions }), sections, omissions,
  };
}

function snapshot(day: number, options: { status?: number; body?: string; previous?: NodeSnapshot; cached?: boolean; capture?: boolean; excerpt?: string } = {}): NodeSnapshot {
  const stamp = (seconds: string) => `2026-11-${String(day).padStart(2, "0")}T00:00:${seconds}Z`;
  const prior = options.previous?.report.sources[0];
  const status = options.status ?? 200;
  const body = options.body ?? "fictional first body";
  const reachable = status === 200 || status === 304;
  let observation: Observation | null = options.cached ? clone(prior?.observation ?? null) : {
    checkedAt: stamp("01"), httpStatus: status, state: reachable ? "reachable" : status === 404 || status === 410 ? "missing_at_check" : "unknown",
    reason: status === 304 ? "not_modified" : reachable ? "http_success" : status === 404 || status === 410 ? "http_missing_at_check" : "server_error",
    contentHash: status === 304 ? prior?.lastSuccessfulObservation?.contentHash ?? null : reachable ? sha256(body) : null,
    etag: null, lastModified: null, bodyComplete: reachable, evidenceType: "observed_http", retryAfterSeconds: null, receivedBytes: status === 304 ? 0 : Buffer.byteLength(body), durationMs: 0,
  };
  if (!options.cached && observation && options.capture) {
    observation.documentProjection = status === 304 && prior?.lastSuccessfulObservation?.documentProjection
      ? clone(prior.lastSuccessfulObservation.documentProjection)
      : captured(observation, options.excerpt ?? body);
  }
  observation = clone(observation);
  const lastSuccessfulObservation = options.cached ? clone(prior?.lastSuccessfulObservation ?? null) : observation?.state === "reachable" ? clone(observation) : clone(prior?.lastSuccessfulObservation ?? null);
  const findings = clone(prior?.reviewFindings ?? []);
  const kind = observation?.state === "missing_at_check" ? "source_missing_at_check" : observation?.state === "reachable" && prior?.lastSuccessfulObservation && observation.contentHash !== prior.lastSuccessfulObservation.contentHash ? "source_body_changed" : null;
  if (!options.cached && kind && observation) {
    const old = findings.find(finding => finding.kind === kind);
    if (old) old.lastObservedAt = observation.checkedAt;
    else findings.push({ kind, firstObservedAt: observation.checkedAt, lastObservedAt: observation.checkedAt, resolution: "review_required" });
  }
  const source: SourceReport["sources"][number] = {
    url: URL, priority: false,
    relationships: CATALOG.map(item => ({ id: item.id, slug: item.slug, role: "indexed_repository", identityEvidence: "unknown", curatedCheckedAt: null, basis: "unknown" })),
    observation, lastSuccessfulObservation, stale: false, runDisposition: options.cached ? "fresh_cache" : "checked_this_run", reviewFindings: findings,
  };
  source.stale = isDue(source, observation, stamp("02"));
  const report: SourceReport = {
    schemaVersion: 2, policyVersion: "public-source-v2", generatedAt: stamp("02"), mode: "check", method: "Unauthenticated public HTTP GET; no MCP tools invoked",
    listings: CATALOG.map(item => ({ id: item.id, slug: item.slug, publisherAssessment: "unknown" })), sources: [source], rejectedInputs: [], robotsPolicies: [], inventoryFindings: [],
    summary: { listingCount: 2, distinctListingIdCount: 2, uniqueSourceCount: 1, attemptsThisRun: options.cached ? 0 : 1, httpRequestsThisRun: options.cached ? 0 : 1, robotsRequestsThisRun: 0, stateCounts: { [observation?.state ?? "not_checked"]: 1 }, staleOrUnchecked: source.stale ? 1 : 0, receivedBytesThisRun: options.cached ? 0 : observation?.receivedBytes ?? 0, requestDurationMsThisRun: 0 },
    publication: { mode: "review_required", catalogWritten: false, automaticIdentityChanges: false },
    assessment: { protocolVersion: null, actor: null, transport: null, applicability: "unknown", observedCriteria: 0, totalApplicableCriteria: null, score: null, badge: null, jevEnabled: false, paidProviderEnabled: false },
  };
  return {
    report,
    evidence: { receiptSha256: sha256(canonicalJson(report)), sourceSha256: sha256(canonicalJson(report)), executionId: `fictional-execution-${day}`, deploymentId: "fictional-deployment", gitSha: "1".repeat(40), startedAt: stamp("00"), completedAt: stamp("03"), origin: "vercel-next-custody-v1", evidenceClass: "synthetic-fixture" },
  };
}
function rehash(value: NodeSnapshot): NodeSnapshot { value.evidence.receiptSha256 = sha256(canonicalJson(value.report)); value.evidence.sourceSha256 = value.evidence.receiptSha256; return value; }
const build = (values: NodeSnapshot[], slugs = SLUGS, asOf = AS_OF) => buildNodeHistory(values, asOf, CATALOG, [], slugs);
const row = (values: NodeSnapshot[]) => build(values).entries[0].sources[0];

describe("bounded Node source history", () => {
  it("keeps shared listings, deduplicates receipts and cached checks, and is input-order independent", () => {
    const one = snapshot(1), two = snapshot(2, { previous: one, cached: true });
    const history = build([one, two]);
    expect(canonicalJson(build([two, clone(one), one], [...SLUGS].reverse()))).toEqual(canonicalJson(history));
    expect(history.historyPolicyVersion).toBe(NODE_HISTORY_POLICY);
    expect(history.entries.map(entry => entry.slug)).toEqual(SLUGS);
    expect(history.summary).toEqual({ selectedSlugCount: 2, sourceCount: 1, stateCounts: { reachable: 1 }, staleOrUnchecked: 1, datedObservationCount: 1, eventCounts: { baseline: 1 } });
    expect(history.entries[0].sources[0].relationships.map(relation => relation.slug)).toEqual(SLUGS);
  });

  it("preserves successful comparison evidence across inconclusive checks", () => {
    const one = snapshot(1), two = snapshot(2, { previous: one, status: 503 }), three = snapshot(3, { previous: two, body: "fictional changed body" });
    const interim = row([one, two]);
    expect(interim.state).toBe("unknown");
    expect(interim.lastSuccessfulObservation?.contentHash).toBe(one.report.sources[0].observation?.contentHash);
    const source = row([one, two, three]);
    expect(source.events.map(event => event.kind)).toEqual(["baseline", "inconclusive", "source_body_changed"]);
    const event = source.events[2];
    expect(event.beforeEvidence?.receiptSha256).toBe(one.evidence.receiptSha256);
    expect(event.evidence.receiptSha256).toBe(three.evidence.receiptSha256);
    expect(event.evidence.pointer).toBe("/sources/0/observation");
    expect(event.documentComparison?.state).toBe("unavailable");
  });

  it("uses conclusive missing/recovery states through unknown and retains unresolved findings", () => {
    const one = snapshot(1), two = snapshot(2, { previous: one, status: 404 }), three = snapshot(3, { previous: two, status: 503 }), four = snapshot(4, { previous: three });
    four.report.sources[0].reviewFindings = [];
    rehash(four);
    const source = row([one, two, three, four]);
    expect(source.events.map(event => event.kind)).toEqual(["baseline", "source_missing_at_check", "inconclusive", "source_reachable_again"]);
    expect(source.events[3].beforeObservation?.state).toBe("missing_at_check");
    expect(source.reviewFindings[0].kind).toBe("source_missing_at_check");
    expect(canonicalJson(source).toString()).not.toContain("downtimeSeconds");
  });

  it("merges finding dates and retains earlier successful observation from a single later receipt", () => {
    const one = snapshot(1), two = snapshot(2, { previous: one, status: 404 }), three = snapshot(3, { previous: two, status: 410 });
    expect(row([two, three]).reviewFindings[0]).toEqual({ kind: "source_missing_at_check", firstObservedAt: "2026-11-02T00:00:01Z", lastObservedAt: "2026-11-03T00:00:01Z", resolution: "review_required" });
    const later = row([two]);
    expect(later.events.map(event => event.kind)).toEqual(["baseline", "source_missing_at_check"]);
    expect(later.events[0].evidence.pointer).toBe("/sources/0/lastSuccessfulObservation");
    expect(row([snapshot(1, { status: 503 })]).events.map(event => event.kind)).toEqual(["baseline"]);
  });

  it("does not repeat events for 304 or cached replay and preserves original capture dates", () => {
    const one = snapshot(1, { capture: true }), two = snapshot(2, { previous: one, body: "fictional changed body", capture: true });
    const three = snapshot(3, { previous: two, status: 304, capture: true }), four = snapshot(4, { previous: three, cached: true });
    expect(row([one, two, three, four]).events.map(event => event.id)).toEqual(row([one, two]).events.map(event => event.id));
    const source = row([one, two, three, four]);
    expect(source.observation?.httpStatus).toBe(304);
    expect(source.observation?.documentProjection?.bodyObservedAt).toBe("2026-11-02T00:00:01Z");
    expect(build([one, two, three, four]).summary.datedObservationCount).toBe(3);
  });

  it("rejects chronology regressions, lost success, same-instant conflicts, execution forks and duplicate custody conflicts", () => {
    const one = snapshot(1), two = snapshot(2, { previous: one, body: "changed" }), regressed = snapshot(3, { previous: one, cached: true });
    expect(() => build([one, two, regressed])).toThrow(/chronology/);
    const lost = snapshot(2, { previous: one, status: 503 });
    lost.report.sources[0].lastSuccessfulObservation = null; rehash(lost);
    expect(() => build([one, lost])).toThrow();
    const conflict = snapshot(2, { previous: one, cached: true });
    for (const field of ["observation", "lastSuccessfulObservation"] as const) {
      const observation = conflict.report.sources[0][field];
      if (observation) observation.contentHash = sha256("conflict");
    }
    rehash(conflict);
    expect(() => build([one, conflict])).toThrow(/Conflicting observations/);
    const fork = snapshot(1, { body: "fork" });
    expect(() => build([one, fork])).toThrow(/one execution/);
    const duplicate = clone(one); duplicate.evidence.executionId = "another-fictional-execution";
    expect(() => build([one, duplicate])).toThrow(/duplicate receipt/);
  });

  it("fails closed on receipt digests, future dates, invalid as-of and selection/batch bounds", () => {
    const one = snapshot(1), bad = clone(one); bad.evidence.sourceSha256 = "0".repeat(64);
    expect(() => build([bad])).toThrow(/SHA-256/);
    expect(() => build([one], SLUGS, "2026-10-31T00:00:00Z")).toThrow(/future/);
    expect(() => build([one], SLUGS, "2026-02-30T00:00:00Z")).toThrow();
    expect(() => build([one], [])).toThrow(/slugs/);
    expect(() => build([one], ["unknown"])).toThrow(/slugs/);
    expect(() => build([one], Array(101).fill(SLUGS[0]))).toThrow(/slugs/);
    expect(() => build([])).toThrow(/32/);
    expect(() => build(Array(33).fill(one))).toThrow(/32/);
  });

  it("sorts timestamps by instant across offsets", () => {
    const one = snapshot(1), two = snapshot(2, { previous: one, body: "changed" });
    const shift = (value: string) => value.replace("2026-11-02T00:00:", "2026-11-01T20:00:").replace("Z", "-04:00");
    two.report.generatedAt = shift(two.report.generatedAt);
    for (const field of ["observation", "lastSuccessfulObservation"] as const) {
      const observation = two.report.sources[0][field]; if (observation) observation.checkedAt = shift(observation.checkedAt);
    }
    for (const finding of two.report.sources[0].reviewFindings) { finding.firstObservedAt = shift(finding.firstObservedAt); finding.lastObservedAt = shift(finding.lastObservedAt); }
    rehash(two);
    expect(row([two, one]).events.map(event => event.kind)).toEqual(["baseline", "source_body_changed"]);
  });

  it("retains unchecked sources without inventing dated observations", () => {
    const empty = snapshot(1);
    const source = empty.report.sources[0];
    source.observation = null; source.lastSuccessfulObservation = null; source.stale = true; source.runDisposition = "run_budget";
    empty.report.summary = { ...empty.report.summary, attemptsThisRun: 0, httpRequestsThisRun: 0, receivedBytesThisRun: 0, stateCounts: { not_checked: 1 }, staleOrUnchecked: 1 };
    rehash(empty);
    const history = build([empty]);
    expect(history.summary.datedObservationCount).toBe(0);
    expect(history.entries[0].sources[0]).toMatchObject({ state: "not_checked", freshnessAsOf: "unchecked", events: [] });
    expect(renderNodeHistory(history).toString()).toContain("Current capture: not_captured (no_observation)");
  });

  it("prioritizes the latest complete change with balanced previews and retains older evidence", () => {
    const snapshots: NodeSnapshot[] = [];
    for (let day = 1; day <= 4; day++) snapshots.push(snapshot(day, { previous: snapshots[day - 2], body: `changed body ${day}`, capture: true, excerpt: `Node ${18 + day} requires this fictional setup command and configuration before running` }));
    const history = build(snapshots), text = renderNodeHistory(history).toString();
    if (process.env.EVERYMCP_RENDERER_EVIDENCE_DIR) writeFileSync(join(process.env.EVERYMCP_RENDERER_EVIDENCE_DIR, "latest-change-example.md"), text);
    const quotes = [...text.matchAll(/preview: “(.*?)”/g)].map(match => match[1]);
    expect(quotes.reduce((count, quote) => count + [...quote.matchAll(/\S+/g)].length, 0)).toBeLessThanOrEqual(24);
    expect(quotes.join(" ")).toContain("Node 21"); expect(quotes.join(" ")).toContain("Node 22");
    expect(quotes.join(" ")).not.toContain("Node 19"); expect(quotes.join(" ")).not.toContain("Node 20");
    expect(text).toContain("## Latest captured change");
    expect(text).toContain("Latest captured change: 2026-11-03T00:00:01Z → 2026-11-04T00:00:01Z");
    for (const side of ["Before", "After"]) { const sideQuotes = [...text.matchAll(new RegExp(side + " (?:heading|excerpt) preview: “(.*?)”", "g"))]; expect(sideQuotes.reduce((n, match) => n + (match[1].match(/\S+/g) || []).length, 0)).toBeLessThanOrEqual(12); }
    expect(text.match(/^### /gm)).toHaveLength(2);
    expect(text).toContain("previews omitted here; the latest complete captured change receives the source quote budget above.");
    expect(text).toContain("/documentProjection/sections/0");
    expect(text).toContain("section SHA-256");
    expect(text).toContain("vercel-next-custody-v1");
    expect(text).toContain("evidence class ` synthetic-fixture `");
    expect(text).toContain("fictional identifiers; no actual Vercel execution claimed");
    expect(text).toContain("fictional-execution-2");
    expect(text).not.toContain("/actions/runs/"); expect(text).not.toContain("jobUrl");
    expect(text).toContain("MCP compatibility"); expect(text).toContain("unknown is inconclusive");
    expect(text).toContain(`freshness as of ${AS_OF}: stale`);
    expect(text).toContain("2026-11-01T00:00:01Z");
    expect(text).toContain(`](<${URL}>)`);
    const wrong = clone(history); wrong.historyPolicyVersion = "source-receipt-history-v2" as typeof NODE_HISTORY_POLICY;
    expect(() => renderNodeHistory(wrong)).toThrow(/policy/);
  });

  it("keeps the latest historical change readable after a newer unknown or noise-only check", () => {
    const snapshots: NodeSnapshot[] = [];
    for (let day = 1; day <= 4; day++) snapshots.push(snapshot(day, { previous: snapshots[day - 2], body: `fictional body ${day}`, capture: true, excerpt: `Node ${18 + day} requires the fictional setup command` }));
    const unknown = snapshot(5, { previous: snapshots[3], status: 503 });
    const unknownText = renderNodeHistory(build([...snapshots, unknown])).toString();
    expect(unknownText).toContain("Latest observation: unknown at 2026-11-05T00:00:01Z");
    expect(unknownText).toContain("Latest captured change: 2026-11-03T00:00:01Z → 2026-11-04T00:00:01Z");
    expect(unknownText).toContain("This comparison predates the latest observation above");
    const noise = snapshot(6, { previous: unknown, body: "different fictional raw bytes", capture: true, excerpt: "Node 22 requires the fictional setup command" });
    const noiseText = renderNodeHistory(build([...snapshots, unknown, noise])).toString();
    expect(noiseText).toContain("Latest captured change: 2026-11-03T00:00:01Z → 2026-11-04T00:00:01Z");
    expect(noiseText).toContain("Captured representation unchanged; other differences unclassified.");
    expect(noiseText).toContain("Latest observation: reachable at 2026-11-06T00:00:01Z");
  });

  it("shares separate before/after budgets across changed sections while preserving all pointers", () => {
    const one = snapshot(1, { capture: true, excerpt: "First section old setup." });
    const two = snapshot(2, { previous: one, capture: true, body: "new raw bytes", excerpt: "First section new setup." });
    for (const [value, word] of [[one, "old"], [two, "new"]] as const) {
      const observation = value.report.sources[0].observation!, p = observation.documentProjection!;
      p.sections.push({ id: `${sha256("second")}:1`, heading: "Second", headingTruncated: false, excerpt: `Second section ${word} setup.`, excerptTruncated: false, contentHash: sha256(word) });
      p.projectionHash = projectionDigest({ sections: p.sections.map(({id,contentHash}) => ({id,contentHash})), omissions: p.omissions });
      value.report.sources[0].lastSuccessfulObservation = clone(observation); rehash(value);
    }
    const text = renderNodeHistory(build([one,two])).toString();
    for (const side of ["Before", "After"]) { const quotes = [...text.matchAll(new RegExp(side + " (?:heading|excerpt) preview: “(.*?)”", "g"))]; expect(quotes.reduce((n,m) => n + (m[1].match(/\S+/g) || []).length, 0)).toBeLessThanOrEqual(12); }
    expect(text).toContain("First section old setup"); expect(text).toContain("First section new setup");
    expect(text).toContain("Second section old setup"); expect(text).toContain("Second section new setup");
    expect(text).toContain("/documentProjection/sections/0"); expect(text).toContain("/documentProjection/sections/1");
  });

  it("compares section hashes, additions/removals and equal captures without claiming semantic equality", () => {
    const one = snapshot(1, { capture: true }), two = snapshot(2, { previous: one, capture: true, body: "new bytes" });
    const before = one.report.sources[0].observation!, after = two.report.sources[0].observation!;
    const id = before.documentProjection!.sections[0].id;
    expect(compareNodeDocuments(before, after).changes).toEqual([{ sectionId: id, kind: "changed" }]);
    const renamed = clone(after); renamed.documentProjection = captured(renamed, "new section", { sectionId: `${sha256("renamed")}:1` });
    expect(compareNodeDocuments(before, renamed).changes.map(change => change.kind).sort()).toEqual(["added", "removed"]);
    const equal = clone(after); equal.documentProjection = { ...clone(before.documentProjection!), bodyHash: equal.contentHash, bodyObservedAt: equal.checkedAt };
    expect(compareNodeDocuments(before, equal).state).toBe("captured_representation_unchanged");
    two.report.sources[0].observation = equal; two.report.sources[0].lastSuccessfulObservation = clone(equal); rehash(two);
    const text = renderNodeHistory(build([one, two])).toString();
    expect(text).toContain("Captured representation unchanged; other differences unclassified.");
    expect(text).not.toContain("noise-only");
    const unavailable = clone(after); delete unavailable.documentProjection;
    expect(compareNodeDocuments(before, unavailable).state).toBe("unavailable");
    const remapped = clone(after); remapped.documentProjection!.sourceIdentity = "0".repeat(64);
    expect(() => compareNodeDocuments(before, remapped)).toThrow(/identity/);
  });

  it("bounds Unicode-separated previews across sides and reports unavailable captures explicitly", () => {
    const one = snapshot(1, { capture: true, excerpt: Array(12).fill("fictional").join("\u0085") });
    const two = snapshot(2, { previous: one, capture: true, body: "second bytes", excerpt: Array(12).fill("second").join("\u0085") });
    const text = renderNodeHistory(build([one, two])).toString();
    const quotedWords = [...text.matchAll(/preview: “(.*?)”/g)].reduce((sum, match) => sum + [...match[1].matchAll(/[^\s\u0085]+/gu)].length, 0);
    expect(quotedWords).toBeLessThanOrEqual(24);
    const unsupported = clone(two.report.sources[0].observation!);
    unsupported.documentProjection = { ...unsupported.documentProjection!, state: "unsupported", reason: "unsupported_media_type", mediaType: null, projectionHash: null, sections: [], omissions: [] };
    two.report.sources[0].observation = unsupported; two.report.sources[0].lastSuccessfulObservation = clone(unsupported); rehash(two);
    expect(row([one, two]).events[1].documentComparison?.state).toBe("unavailable");
    expect(renderNodeHistory(build([one, two])).toString()).toContain("No document-content conclusion is available; this is not evidence of unchanged content.");
  });
});
