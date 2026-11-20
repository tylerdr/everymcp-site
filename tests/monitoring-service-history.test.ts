import { describe, expect, it } from "vitest";
import golden from "./fixtures/monitoring-node/python-golden.json";
import retained from "./fixtures/monitoring-node/legacy-renderer-golden.json";
import { buildNodeHistory, LEGACY_NODE_HISTORY_POLICY, NODE_HISTORY_POLICY, renderNodeHistory, type NodeHistory, type NodeSnapshot } from "../lib/monitoring/history";
import { buildServiceHistory, renderServiceHistory, SERVICE_HISTORY_POLICY, type ServiceHistory, type ServiceSnapshot } from "../lib/monitoring/service-history";
import { projectDocument } from "../lib/monitoring/document-projection";
import { canonicalJson, isDue, sha256, type Observation, type SourceReport } from "../lib/monitoring/source-contract";

// Fictional service/signing identities and offline response bytes only. No authentication claim.
const AS_OF = "2026-11-12T00:00:00Z";
const SLUGS = ["example-mcp"];
const clone = <T,>(value: T): T => structuredClone(value);
function snapshot(day: number, node: number | null, previous?: ServiceSnapshot): ServiceSnapshot {
  const report = clone(golden.reports[0]) as SourceReport;
  const source = report.sources[0], prior = previous?.report.sources[0];
  const stamp = (seconds: string) => `2026-11-${String(day).padStart(2, "0")}T00:00:${seconds}Z`;
  const body = Buffer.from(node === null ? "fictional unavailable" : `<h1>Requirements</h1><p>Node ${node} requires the fictional setup command before running this sample.</p>`);
  const observation: Observation = { ...source.observation!, checkedAt: stamp("01"), httpStatus: node === null ? 503 : 200, state: node === null ? "unknown" : "reachable", reason: node === null ? "server_error" : "http_success", contentHash: node === null ? null : sha256(body), bodyComplete: node !== null, receivedBytes: body.length };
  observation.documentProjection = projectDocument(body, { "content-type": "text/html" }, source, observation);
  source.observation = observation;
  source.lastSuccessfulObservation = node === null ? clone(prior?.lastSuccessfulObservation ?? null) : clone(observation);
  source.reviewFindings = clone(prior?.reviewFindings ?? []);
  if (node !== null && prior?.lastSuccessfulObservation && prior.lastSuccessfulObservation.contentHash !== observation.contentHash) {
    const old = source.reviewFindings.find(finding => finding.kind === "source_body_changed");
    if (old) old.lastObservedAt = observation.checkedAt;
    else source.reviewFindings.push({ kind: "source_body_changed", firstObservedAt: observation.checkedAt, lastObservedAt: observation.checkedAt, resolution: "review_required" });
  }
  report.generatedAt = stamp("02"); source.stale = isDue(source, observation, report.generatedAt);
  report.summary = { ...report.summary, stateCounts: { [observation.state]: 1 }, staleOrUnchecked: Number(source.stale), receivedBytesThisRun: body.length };
  return { report, evidence: { receiptSha256: sha256(`fictional service receipt ${day}`), sourceSha256: sha256(canonicalJson(report)), executionId: `fictional-execution-${day}`, startedAt: stamp("00"), completedAt: stamp("03"), evidenceClass: "synthetic-fixture", origin: "everymcp-service-custody-v1", serviceId: "fictional-service", keyId: "fictional-key" } };
}
const build = (snapshots: ServiceSnapshot[]) => buildServiceHistory(snapshots, AS_OF, golden.catalog, golden.curated, SLUGS);
function sequence(): ServiceSnapshot[] {
  const snapshots: ServiceSnapshot[] = [];
  for (let day = 1; day <= 4; day++) snapshots.push(snapshot(day, 18 + day, snapshots[day - 2]));
  return snapshots;
}
function legacySnapshots(): NodeSnapshot[] {
  return retained.entries.map(item => ({ report: clone(golden.reports[item.sourceFixtureIndex]) as SourceReport, evidence: { ...item.evidence, origin: "vercel-next-custody-v1", evidenceClass: "synthetic-fixture" } }));
}

describe("separate service-recorded history", () => {
  it("uses the real comparison engine and balanced latest Node 21 to 22 previews", () => {
    const snapshots = sequence(), history = build(snapshots), text = renderServiceHistory(history).toString();
    expect(history.historyPolicyVersion).toBe(SERVICE_HISTORY_POLICY);
    expect(history.summary.eventCounts).toEqual({ baseline: 1, source_body_changed: 3 });
    expect(history.entries[0].sources[0].events.at(-1)?.documentComparison?.state).toBe("captured_representation_changed");
    const quotes = [...text.matchAll(/(Before|After) (?:heading|excerpt) preview: “(.*?)”/g)];
    expect(quotes.filter(match => match[1] === "Before").map(match => match[2]).join(" ")).toContain("Node 21");
    expect(quotes.filter(match => match[1] === "After").map(match => match[2]).join(" ")).toContain("Node 22");
    expect(quotes.map(match => match[2]).join(" ")).not.toContain("Node 19");
    for (const side of ["Before", "After"]) expect(quotes.filter(match => match[1] === side).reduce((sum, match) => sum + (match[2].match(/[^\s\u0085]+/gu) ?? []).length, 0)).toBeLessThanOrEqual(12);
    expect(text).toContain("/documentProjection/sections/1");
    expect(text).toContain(snapshots[2].evidence.receiptSha256);
    expect(text).toContain(snapshots[3].evidence.sourceSha256);
    expect(text).toContain("section SHA-256");
  });

  it("keeps latest historical change, prior success and unresolved findings through unknown/stale evidence", () => {
    const snapshots = sequence(); snapshots.push(snapshot(5, null, snapshots[3]));
    const history = build(snapshots), source = history.entries[0].sources[0], text = renderServiceHistory(history).toString();
    expect(source.state).toBe("unknown"); expect(source.freshnessAsOf).toBe("stale");
    expect(source.lastSuccessfulObservation?.checkedAt).toBe("2026-11-04T00:00:01Z");
    expect(source.events.at(-1)?.kind).toBe("inconclusive");
    expect(source.reviewFindings[0].kind).toBe("source_body_changed");
    expect(text).toContain("Latest observation: unknown at 2026-11-05T00:00:01Z; freshness stale");
    expect(text).toContain("This comparison predates the latest observation above");
    expect(text).toContain("Node 21"); expect(text).toContain("Node 22");
  });

  it("states credential-holder endorsement prominently and never invents deployment provenance", () => {
    const history = build(sequence()), text = renderServiceHistory(history).toString();
    expect(text.indexOf("signer/credential-holder endorsement only")).toBeLessThan(text.indexOf("## Latest captured change"));
    expect(text).toContain("does not establish truthful fetching, independent time, a particular build or platform provenance, or MCP compatibility/security");
    expect(text).toContain("EveryMCP service-recorded observation");
    expect(text).toContain("fictional observations, signer and identifiers");
    expect(text).toContain("fictional-service"); expect(text).toContain("fictional-key");
    expect(text).not.toMatch(/Vercel|deployment|vercel-next-custody|actions\/runs/);
    expect(canonicalJson(history).toString()).not.toMatch(/deploymentId|gitSha|teamId|projectId/);
    for (const item of history.receipts) expect(item.origin).toBe("everymcp-service-custody-v1");
  });

  it("rejects cross-origin builders and renderer policies, including nested citation substitution", () => {
    const service = sequence(), node = legacySnapshots();
    expect(() => buildNodeHistory(service as unknown as NodeSnapshot[], AS_OF, golden.catalog, golden.curated, SLUGS)).toThrow(/origin/);
    expect(() => build(node as unknown as ServiceSnapshot[])).toThrow();
    const serviceReport = build(service), nodeReport = buildNodeHistory(node, AS_OF, golden.catalog, golden.curated, SLUGS);
    expect(() => renderNodeHistory(serviceReport as unknown as NodeHistory)).toThrow(/policy/);
    expect(() => renderServiceHistory(nodeReport as unknown as ServiceHistory)).toThrow(/policy/);
    for (const policy of [NODE_HISTORY_POLICY, LEGACY_NODE_HISTORY_POLICY]) {
      const relabeled = { ...serviceReport, historyPolicyVersion: policy } as unknown as NodeHistory;
      expect(() => renderNodeHistory(relabeled)).toThrow(/origin/);
    }
    const relabeled = { ...nodeReport, historyPolicyVersion: SERVICE_HISTORY_POLICY } as unknown as ServiceHistory;
    expect(() => renderServiceHistory(relabeled)).toThrow();
    const tampered = clone(serviceReport);
    Object.assign(tampered.entries[0].sources[0].events[1].beforeEvidence!, { origin: "vercel-next-custody-v1", deploymentId: "fictional-deployment" });
    expect(() => renderServiceHistory(tampered)).toThrow();
  });

  it("strictly refuses extra deployment fields, empty signer identity and source digest mismatch", () => {
    const valid = snapshot(1, 21);
    const extra = clone(valid); Object.assign(extra.evidence, { deploymentId: "fictional" });
    expect(() => build([extra])).toThrow();
    const missing = clone(valid); missing.evidence.keyId = "";
    expect(() => build([missing])).toThrow();
    const wrong = clone(valid); wrong.evidence.sourceSha256 = "0".repeat(64);
    expect(() => build([wrong])).toThrow(/SHA-256/);
    expect(() => build([])).toThrow(/32/);
    expect(() => build(Array(33).fill(valid))).toThrow(/32/);
    expect(canonicalJson(build([valid, clone(valid)]))).toEqual(canonicalJson(build([valid])));
  });

  it("preserves exact legacy builder output and frozen v1/v2 renderer bytes", () => {
    const report = buildNodeHistory(legacySnapshots(), retained.asOf, golden.catalog, golden.curated, retained.slugs);
    // Baselines computed independently from HEAD's pre-refactor source, with the retained inputs.
    expect(sha256(canonicalJson(report))).toBe("5236840d1ef2f14e9b74dee924d749df6a62a26190c5f952855deda60caa922c");
    const v2 = renderNodeHistory(report);
    expect(v2.length).toBe(9201);
    expect(sha256(v2)).toBe("82db54061b0d70904cdb96934401b474b20f4d52b278cda96c062cb80011ac25");
    const v1 = renderNodeHistory({ ...report, historyPolicyVersion: LEGACY_NODE_HISTORY_POLICY });
    expect(v1.length).toBe(retained.expectedBytes);
    expect(sha256(v1)).toBe(retained.expectedSha256);
  });
});
