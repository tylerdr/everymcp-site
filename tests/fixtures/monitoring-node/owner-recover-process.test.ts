/** Explicit fresh-process acceptance of fictional Auth and custody; never a hosted binding. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createMonitoringOwner } from "../../../lib/monitoring/owner";
import { sha256 } from "../../../lib/monitoring/source-contract";
import { FictionalCustody, harness } from "./runtime-fixture";
import { OWNER_CONFIG, authResponse, ownerRequest } from "./owner-fixture";
it.skipIf(!process.env.EVERYMCP_FICTIONAL_OWNER_DIR)("fresh process authenticates a new fictional session and recovers the original", async () => {
  const directory = process.env.EVERYMCP_FICTIONAL_OWNER_DIR!;
  const expected = JSON.parse(readFileSync(join(directory, "owner-expected.json"), "utf8")) as { ownerKey: string; jobId: string; reportSha256: string; reportLength: number };
  const originalStore = readFileSync(join(directory, "fictional-custody.json"));
  const h = harness(new FictionalCustody(directory), expected.ownerKey);
  h.deps.authenticateOwner = createMonitoringOwner(OWNER_CONFIG, async () => authResponse());
  h.deps.loadInventory = async () => { throw new Error("No new inventory during recovery"); };
  h.deps.collectCanonicalSources = async () => { throw new Error("No collection during recovery"); };
  h.deps.loadJob = async () => { throw new Error("No regenerated jobs during recovery"); };
  const report = await h.runtime.recover(ownerRequest("fictional-fresh-process-session"), expected.jobId);
  expect(report?.length).toBe(expected.reportLength); expect(sha256(report!)).toBe(expected.reportSha256);
  expect(report!.equals(readFileSync(join(directory, "original.md")))).toBe(true);
  expect(readFileSync(join(directory, "fictional-custody.json")).equals(originalStore)).toBe(true);
  writeFileSync(join(directory, "fresh-process-owner-recovery.md"), report!);
});
