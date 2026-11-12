import { describe, expect, it } from "vitest";
import { buildNodeHistory, LEGACY_NODE_HISTORY_POLICY, NODE_HISTORY_POLICY, renderNodeHistory, type NodeSnapshot } from "../lib/monitoring/history";
import { fixture } from "./fixtures/monitoring-node/runtime-fixture";
import golden from "./fixtures/monitoring-node/legacy-renderer-golden.json";
import { sha256, type SourceReport } from "../lib/monitoring/source-contract";
describe("versioned Node rendering", () => {
  it("reproduces the retained fictional v1 original byte-for-byte while new construction selects v2", () => {
    const snapshots: NodeSnapshot[] = golden.entries.map(entry => ({ report: fixture.reports[entry.sourceFixtureIndex] as SourceReport, evidence: entry.evidence as NodeSnapshot["evidence"] }));
    const current = buildNodeHistory(snapshots, golden.asOf, fixture.catalog, fixture.curated, golden.slugs);
    expect(current.historyPolicyVersion).toBe(NODE_HISTORY_POLICY);
    const old = renderNodeHistory({ ...current, historyPolicyVersion: LEGACY_NODE_HISTORY_POLICY });
    expect(old.length).toBe(golden.expectedBytes); expect(sha256(old)).toBe(golden.expectedSha256);
    const revised = renderNodeHistory(current).toString(); expect(revised).toContain("## Latest captured change"); expect(revised).toContain(NODE_HISTORY_POLICY);
  });
});
