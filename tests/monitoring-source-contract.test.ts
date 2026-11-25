import { describe, expect, it } from "vitest";
import { canonicalJson, parseCanonical, sha256, timestamp, validateSourceReport, type SourceReport } from "../lib/monitoring/source-contract";
import { buildNodeHistory, type NodeSnapshot } from "../lib/monitoring/history";
import { fixture } from "./fixtures/monitoring-node/runtime-fixture";

describe("Node admission compatibility with fictional Python reference", () => {
  it("preserves exact source canonical hashes and useful history across noise, partial bodies and a real section change", () => {
    const snapshots: NodeSnapshot[] = fixture.reports.map((report, index) => {
      expect(sha256(canonicalJson(report))).toBe(fixture.canonicalHashes[index]);
      expect(validateSourceReport(report, fixture.catalog, fixture.curated)).toEqual(report);
      return { report: report as SourceReport, evidence: { receiptSha256: sha256(`fictional custody ${index}`), sourceSha256: fixture.canonicalHashes[index], executionId: `fictional-${index}`, deploymentId: "fictional-deployment", gitSha: "1".repeat(40), startedAt: report.generatedAt.replace("00:00:02", "00:00:00"), completedAt: report.generatedAt.replace("00:00:02", "00:00:03"), origin: "vercel-next-custody-v1", evidenceClass: "synthetic-fixture" } };
    });
    const history = buildNodeHistory(snapshots, fixture.asOf, fixture.catalog, fixture.curated, ["example-mcp"]);
    expect(history.summary).toEqual(fixture.expectedSummary);
    const events = history.entries[0].sources[0].events;
    expect(events.map(event => event.kind)).toEqual(fixture.expectedEventKinds);
    expect(events.flatMap(event => event.documentComparison ? [event.documentComparison] : [])).toEqual(fixture.expectedDocumentComparisons);
  });
  it("pins canonical Unicode/integer representation and rejects ambiguous submitted bytes", () => {
    expect(canonicalJson({ z: "café 😀\u0085", a: 123 }).toString()).toBe('{"a":123,"z":"caf\\u00e9 \\ud83d\\ude00\\u0085"}\n');
    for (const value of [NaN, Infinity, -0, 1.1, 9007199254740992]) expect(() => canonicalJson({ value })).toThrow();
    for (const value of ['{"a":1,"a":2}\n', '{"a": 1}\n', '{"z":1,"a":2}\n', '{"a":"é"}\n']) expect(() => parseCanonical(Buffer.from(value))).toThrow();
    expect(parseCanonical(canonicalJson({ a: "é" }))).toEqual({ a: "é" });
    for (const value of ["2026-02-30T00:00:00Z", "2026-01-01T00:00:00.0001Z", "2026-01-01T00:00:60Z"]) expect(() => timestamp(value)).toThrow();
  });
  it("rejects forged metrics, projection identity, extra fields and incomplete-body capture claims", () => {
    const bad = structuredClone(fixture.reports[0]); bad.summary.attemptsThisRun = 0;
    expect(() => validateSourceReport(bad, fixture.catalog, fixture.curated)).toThrow();
    const projection = structuredClone(fixture.reports[0]); projection.sources[0].observation!.documentProjection!.sourceIdentity = "0".repeat(64);
    expect(() => validateSourceReport(projection, fixture.catalog, fixture.curated)).toThrow();
    expect(() => validateSourceReport({ ...fixture.reports[0], arbitrary: true }, fixture.catalog, fixture.curated)).toThrow();
    const partial = structuredClone(fixture.reports[0]); partial.sources[0].observation!.bodyComplete = false;
    expect(() => validateSourceReport(partial, fixture.catalog, fixture.curated)).toThrow();
  });
});
