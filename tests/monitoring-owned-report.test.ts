import { describe, expect, it } from "vitest";
import golden from "./fixtures/monitoring-node/python-golden.json";
import retained from "./fixtures/monitoring-node/legacy-renderer-golden.json";
import { projectDocument } from "../lib/monitoring/document-projection";
import { renderOwnedServiceReport, type OwnedReportContext } from "../lib/monitoring/owned-report";
import { buildServiceHistory, renderServiceHistory, type ServiceSnapshot } from "../lib/monitoring/service-history";
import { createServiceRecordedRuntime, type ServiceRuntimeDependencies } from "../lib/monitoring/service-runtime";
import { OWNED_SERVICE_REPORT_POLICY, SERVICE_RECEIPT_POLICY, SERVICE_RECEIPT_POLICY_V2, SERVICE_REPORT_POLICY, serviceJobIdentity, serviceReceiptSchema, validateServiceOriginal, type ServiceReceipt } from "../lib/monitoring/service-records";
import { canonicalJson, isDue, parseCanonical, sha256, type Observation, type SourceReport } from "../lib/monitoring/source-contract";
import { producerRequest, serviceHarness } from "./fixtures/monitoring-node/service-fixture";
import { ownerRequest } from "./fixtures/monitoring-node/owner-fixture";

const AS_OF = "2026-11-12T00:01:00Z", SLUGS = ["example-mcp"];
const clone = <T,>(value: T): T => structuredClone(value);
function context(available = 2): OwnedReportContext { return { watchlistSha256: "a".repeat(64), coverage: { expectedPeriods: available + 1, availablePeriods: available, missingPeriodEnds: ["2026-11-09T00:00:00Z"], state: "gaps" } }; }
function snapshot(day: number, version: number | null, previous?: ServiceSnapshot): ServiceSnapshot {
  const report = clone(golden.reports[0]) as SourceReport, source = report.sources[0];
  const stamp = (second: string) => `2026-11-${day}T00:00:${second}Z`;
  const body = Buffer.from(version === null ? "fictional unavailable" : `<h1>Requirements</h1><p>Node ${version} required for the fictional setup command.</p>`);
  const observation: Observation = { ...source.observation!, checkedAt: stamp("01"), httpStatus: version === null ? 503 : 200, state: version === null ? "unknown" : "reachable", reason: version === null ? "server_error" : "http_success", contentHash: version === null ? null : sha256(body), bodyComplete: version !== null, receivedBytes: body.length };
  observation.documentProjection = projectDocument(body, { "content-type": "text/html" }, source, observation);
  source.observation = observation; source.lastSuccessfulObservation = version === null ? clone(previous?.report.sources[0].lastSuccessfulObservation ?? null) : clone(observation);
  source.reviewFindings = []; report.generatedAt = stamp("02"); source.stale = isDue(source, observation, report.generatedAt);
  report.summary = { ...report.summary, stateCounts: { [observation.state]: 1 }, staleOrUnchecked: Number(source.stale), receivedBytesThisRun: body.length };
  return { report, evidence: { receiptSha256: sha256(`fictional receipt ${day}`), sourceSha256: sha256(canonicalJson(report)), executionId: `fictional-execution-${day}`, startedAt: stamp("00"), completedAt: stamp("03"), evidenceClass: "synthetic-fixture", origin: SERVICE_RECEIPT_POLICY_V2, serviceId: "fictional-service", keyId: "fictional-key" } };
}
const render = (snapshots: ServiceSnapshot[], input = context(snapshots.length), asOf = AS_OF) => renderOwnedServiceReport(snapshots, asOf, golden.catalog, golden.curated, SLUGS, input).toString();

describe("owned report coverage, latest-state value and strict policy versions", () => {
  it("persists canonical gaps and meaningful latest changed/unchanged/baseline states using real projections", () => {
    const a = snapshot(10, 21), b = snapshot(11, 22, a);
    const changed = render([a, b]);
    expect(changed).toContain(`Policy: ${OWNED_SERVICE_REPORT_POLICY}`);
    expect(changed).toContain("Period coverage: gaps; 2 available of 3 expected periods; 1 missing.");
    expect(changed).toContain("Missing expected period ending 2026-11-09T00:00:00Z");
    expect(changed).toContain(canonicalJson(context()).toString().trimEnd());
    expect(changed).toContain("latest state: **changed**. Captured representation changed");
    expect(changed).toContain("Node 21"); expect(changed).toContain("Node 22");
    expect(changed).toContain(b.evidence.receiptSha256); expect(changed).toContain(b.evidence.sourceSha256);
    const same = snapshot(11, 21, a);
    expect(render([a, same])).toContain("latest state: **unchanged**. Captured representation unchanged");
    expect(render([a, same])).toContain("does not establish globally unchanged content");
    expect(render([a])).toContain("latest state: **baseline**");
  });

  it("labels latest unknown/stale/incomplete evidence explicitly while preserving historical changes", () => {
    const a = snapshot(10, 21), b = snapshot(11, 22, a), unknown = snapshot(12, null, b);
    const text = render([a, b, unknown]);
    expect(text).toContain("latest state: **unknown**"); expect(text).toContain("Latest HTTP state: unknown");
    expect(text).toContain("Node 21"); expect(text).toContain("Node 22");
    expect(text.indexOf("latest state: **unknown**")).toBeLessThan(text.indexOf("## Source history comparison component"));
    expect(render([a, b], context(), "2026-11-20T00:00:00Z")).toContain("latest state: **unknown**. The latest source evidence is stale");
    const unavailable = clone(b);
    for (const field of ["observation", "lastSuccessfulObservation"] as const) {
      const observation = unavailable.report.sources[0][field]!;
      observation.documentProjection = { ...observation.documentProjection!, state: "incomplete", reason: "projection_limit", projectionHash: null, sections: [], omissions: [] };
    }
    unavailable.evidence.sourceSha256 = sha256(canonicalJson(unavailable.report));
    expect(render([a, unavailable])).toContain("latest state: **unknown**");
  });

  it("does not confuse bounded preview truncation with incomplete captured section hashes", () => {
    const a = snapshot(10, 21), b = snapshot(11, 22, a);
    for (const snap of [a, b]) {
      for (const field of ["observation", "lastSuccessfulObservation"] as const) snap.report.sources[0][field]!.documentProjection!.sections[1].excerptTruncated = true;
      snap.evidence.sourceSha256 = sha256(canonicalJson(snap.report));
    }
    expect(render([a, b])).toContain("latest state: **changed**");
    expect(render([a, b])).toContain("[truncated]");
  });

  it("rejects invented counts, future or duplicate missing dates and duplicate receipt coverage", () => {
    const a = snapshot(10, 21), b = snapshot(11, 22, a);
    for (const change of [
      (input: OwnedReportContext) => { input.coverage.availablePeriods = 1; },
      (input: OwnedReportContext) => { input.coverage.expectedPeriods = 4; },
      (input: OwnedReportContext) => { input.coverage.state = "complete"; },
      (input: OwnedReportContext) => { input.coverage.missingPeriodEnds[0] = "2026-11-13T00:00:00Z"; },
      (input: OwnedReportContext) => { input.coverage.expectedPeriods = 4; input.coverage.missingPeriodEnds.push("2026-11-08T19:00:00-05:00"); },
    ]) { const input = context(); change(input); expect(() => render([a, b], input)).toThrow(); }
    expect(() => render([a, clone(a)], context())).toThrow(/duplicate/);
    expect(() => render([], context(0))).toThrow();
  });

  it("preserves exact service-v1 builder and renderer bytes", () => {
    const snapshots: ServiceSnapshot[] = retained.entries.map(({ sourceFixtureIndex, evidence }) => ({ report: clone(golden.reports[sourceFixtureIndex]) as SourceReport, evidence: { receiptSha256: evidence.receiptSha256, sourceSha256: evidence.sourceSha256, executionId: evidence.executionId, startedAt: evidence.startedAt, completedAt: evidence.completedAt, evidenceClass: "synthetic-fixture", origin: SERVICE_RECEIPT_POLICY, serviceId: "fictional-service", keyId: "fictional-key" } }));
    const history = buildServiceHistory(snapshots, retained.asOf, golden.catalog, golden.curated, retained.slugs), bytes = renderServiceHistory(history);
    expect(sha256(canonicalJson(history))).toBe("806f7ec7d598752870cb774b83862e496b22ec2c2486121d124dca1f1ba363f6");
    expect(bytes.length).toBe(9516); expect(sha256(bytes)).toBe("cf0177aeb4361d2ed796585e25e76c1d6caef82f1ed21dc70569b62d9cdeb200");
  });

  it("stores v2 coverage in the signed original and recovers it without loading new context or regenerating", async () => {
    const h = await serviceHarness(), a = await h.capture(0), b = await h.capture(3);
    h.setClock("2026-11-12T00:00:04Z");
    const job = h.reportJob([a.receiptId, b.receiptId]), id = h.add(job), input = context();
    const runtime = createServiceRecordedRuntime({ ...h.deps, receiptPolicy: SERVICE_RECEIPT_POLICY_V2, loadReportContext: async () => clone(input) });
    const handle = await runtime.run(producerRequest(), id), original = (await h.deps.store.getExecutionByReceipt(handle.receiptId))!;
    expect(handle.origin).toBe(SERVICE_RECEIPT_POLICY_V2);
    expect(original.start.policy).toBe(SERVICE_RECEIPT_POLICY_V2);
    const receipt = parseCanonical(original.receiptBytes) as ServiceReceipt;
    expect(receipt.policy).toBe(SERVICE_RECEIPT_POLICY_V2); expect(receipt.reportPolicy).toBe(OWNED_SERVICE_REPORT_POLICY);
    expect(serviceReceiptSchema.safeParse({ ...receipt, reportPolicy: SERVICE_REPORT_POLICY }).success).toBe(false);
    const { signature: ignored, ...unsigned } = receipt; void ignored;
    expect(() => h.producer.signReceipt(original.start, { ...unsigned, policy: SERVICE_RECEIPT_POLICY, reportPolicy: SERVICE_REPORT_POLICY })).toThrow();
    expect(h.verifier.verifyOriginal(original)).toBe(true);
    expect(original.reportBytes!.toString()).toContain(canonicalJson(input).toString().trimEnd());
    expect(original.reportBytes!.toString()).toContain(`origin \` ${SERVICE_RECEIPT_POLICY} \``); // Actual older capture origin.
    const recovery = createServiceRecordedRuntime({ ...h.deps, receiptPolicy: SERVICE_RECEIPT_POLICY_V2, producer: undefined, loadReportContext: async () => { throw new Error("No regeneration"); }, loadInventory: async () => { throw new Error("No new inventory"); } });
    expect(await recovery.recover(ownerRequest(), handle.jobId)).toEqual(original.reportBytes);
    input.coverage = { expectedPeriods: 2, availablePeriods: 2, missingPeriodEnds: [], state: "complete" };
    expect(await runtime.run(producerRequest(), id)).toEqual(handle);
    expect(await runtime.recover(ownerRequest(), id)).toEqual(original.reportBytes);
    const tampered = { ...original, reportBytes: Buffer.from(original.reportBytes!.toString().replace('"expectedPeriods":3', '"expectedPeriods":2')) };
    expect(h.verifier.verifyOriginal(tampered)).toBe(false);
  });

  it("keeps the stable job namespace and old original when a v2 runtime retries an existing v1 report", async () => {
    const h = await serviceHarness(), a = await h.capture(0), old = await h.report([a.receiptId]), original = (await h.deps.store.getExecutionByReceipt(old.receiptId))!;
    const runtime = createServiceRecordedRuntime({ ...h.deps, receiptPolicy: SERVICE_RECEIPT_POLICY_V2, loadReportContext: async () => { throw new Error("Original must win"); } });
    expect(serviceJobIdentity(original.start.job)).toBe(old.jobId);
    expect(await runtime.run(producerRequest(), old.jobId)).toEqual(old);
    expect(await runtime.recover(ownerRequest(), old.jobId)).toEqual(original.reportBytes);
    expect(old.origin).toBe(SERVICE_RECEIPT_POLICY);
  });

  it("signs new capture receipts with v2 and carries their actual origin into the owned comparison component", async () => {
    const h = await serviceHarness(); h.setClock("2026-11-01T00:00:00Z");
    const deps: ServiceRuntimeDependencies = { ...h.deps, receiptPolicy: SERVICE_RECEIPT_POLICY_V2, loadReportContext: async () => context(1), collectCanonicalSources: async () => { h.setClock("2026-11-01T00:00:03Z"); return clone(golden.reports[0]); } };
    const runtime = createServiceRecordedRuntime(deps);
    const capture = await runtime.run(producerRequest(), h.add(h.captureJob("2026-11-01T00:00:00Z")));
    const source = (await h.deps.store.getExecutionByReceipt(capture.receiptId))!;
    expect(source.start.policy).toBe(SERVICE_RECEIPT_POLICY_V2);
    expect((parseCanonical(source.receiptBytes) as ServiceReceipt).policy).toBe(SERVICE_RECEIPT_POLICY_V2);
    expect(h.verifier.verifyOriginal(source)).toBe(true);
    h.setClock("2026-11-12T00:00:04Z");
    const report = await runtime.run(producerRequest(), h.add(h.reportJob([capture.receiptId])));
    const bytes = await runtime.recover(ownerRequest(), report.jobId);
    expect(bytes!.toString()).toContain(`origin \` ${SERVICE_RECEIPT_POLICY_V2} \``);
  });

  it("has strict version/report-policy dispatch and rejects cross-policy issuance and verification", async () => {
    const h = await serviceHarness(), a = await h.capture(0), old = await h.report([a.receiptId]), original = (await h.deps.store.getExecutionByReceipt(old.receiptId))!;
    const receipt = parseCanonical(original.receiptBytes) as ServiceReceipt;
    const { signature: ignored, ...body } = receipt; void ignored;
    expect(() => h.producer.signReceipt(original.start, { ...body, policy: SERVICE_RECEIPT_POLICY_V2, reportPolicy: OWNED_SERVICE_REPORT_POLICY })).toThrow();
    expect(serviceReceiptSchema.safeParse({ ...receipt, reportPolicy: OWNED_SERVICE_REPORT_POLICY }).success).toBe(false);
    expect(serviceReceiptSchema.safeParse({ ...receipt, policy: SERVICE_RECEIPT_POLICY_V2 }).success).toBe(false);
    const switched = { ...original, receiptBytes: canonicalJson({ ...receipt, policy: SERVICE_RECEIPT_POLICY_V2, reportPolicy: OWNED_SERVICE_REPORT_POLICY }) };
    expect(() => validateServiceOriginal(switched)).toThrow(/cross-binding/);
    expect(h.verifier.verifyOriginal(switched)).toBe(false);
    expect(h.verifier.verifyOriginal({ ...original, start: { ...original.start, policy: SERVICE_RECEIPT_POLICY_V2 } })).toBe(false);
    const job = { ...h.reportJob([a.receiptId]), periodEnd: "2026-11-11T00:00:00Z" }, id = h.add(job);
    const missing = createServiceRecordedRuntime({ ...h.deps, receiptPolicy: SERVICE_RECEIPT_POLICY_V2 });
    await expect(missing.run(producerRequest(), id)).rejects.toThrow(/context unavailable/);
  });
});
