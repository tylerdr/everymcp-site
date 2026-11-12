import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { FictionalCustody, harness, request } from "./runtime-fixture";
import { sha256 } from "../../../lib/monitoring/source-contract";
const directory = process.env.EVERYMCP_FICTIONAL_RECOVERY_DIR;
it.skipIf(!directory)("fresh process recovers the fictional committed original", async () => {
  const expected = JSON.parse(readFileSync(join(directory!, "expected.json"), "utf8")) as { jobId: string; reportSha256: string; reportLength: number };
  const h = harness(new FictionalCustody(directory));
  h.deps.loadInventory = async () => { throw new Error("No inventory reads on recovery"); };
  h.deps.collectCanonicalSources = async () => { throw new Error("No collection on recovery"); };
  h.deps.loadJob = async () => { throw new Error("No regeneration on recovery"); };
  const result = await h.runtime.recover(request(), expected.jobId);
  expect(result?.length).toBe(expected.reportLength); expect(sha256(result!)).toBe(expected.reportSha256);
  writeFileSync(join(directory!, "fresh-process-report.md"), result!);
});
