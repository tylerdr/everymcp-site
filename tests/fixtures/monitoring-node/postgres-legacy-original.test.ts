/** Copies retained FICTIONAL originals through the adapter/model only; not a production migration. */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { FictionalCustody, harness, request } from "./runtime-fixture";
import { FictionalPostgres } from "./postgres-fixture";
import { sha256 } from "../../../lib/monitoring/source-contract";
const directory = process.env.EVERYMCP_RETAINED_CUSTODY_DIR;
it.skipIf(!directory)("preserves retained legacy receipt/report bytes through the new SQL adapter", async () => {
  const path = join(directory!, "fictional-custody.json"), before = readFileSync(path);
  const retained = new FictionalCustody(directory), database = new FictionalPostgres(), producer = database.store("producer");
  for (const start of Object.values(retained.state.starts)) await producer.beginExecution(start);
  for (const id of Object.keys(retained.state.originals)) {
    const original = (await retained.getExecutionByReceipt(id))!;
    await producer.completeExecution(original.start.executionId, original);
    const saved = (await producer.getExecutionByReceipt(id))!;
    expect(saved.receiptBytes.equals(original.receiptBytes)).toBe(true);
    expect(saved.reportBytes).toEqual(original.reportBytes); expect(saved.sourceBytes).toEqual(original.sourceBytes);
  }
  for (const commit of Object.values(retained.state.jobs)) await producer.commitJobIfAbsent(commit);
  const expected = JSON.parse(readFileSync(join(directory!, "expected.json"), "utf8")) as { jobId: string; reportLength: number; reportSha256: string };
  const h = harness(); h.deps.store = database.store("recovery");
  h.deps.loadInventory = async () => { throw new Error("No regeneration"); };
  h.deps.collectCanonicalSources = async () => { throw new Error("No collection"); };
  const bytes = await h.runtime.recover(request(), expected.jobId);
  expect(bytes?.length).toBe(expected.reportLength); expect(sha256(bytes!)).toBe(expected.reportSha256);
  expect(readFileSync(path).equals(before)).toBe(true);
});
