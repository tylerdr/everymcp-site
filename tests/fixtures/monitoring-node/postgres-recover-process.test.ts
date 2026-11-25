/** Fresh process exercises the real adapter with fictional persisted SQL responses. Not PostgreSQL durability. */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";
import { createMonitoringOwner } from "../../../lib/monitoring/owner";
import { sha256 } from "../../../lib/monitoring/source-contract";
import { harness } from "./runtime-fixture";
import { OWNER_CONFIG, authResponse, ownerRequest } from "./owner-fixture";
import { FictionalPostgres } from "./postgres-fixture";
const directory = process.env.EVERYMCP_FICTIONAL_POSTGRES_DIR;
it.skipIf(!directory)("fresh process recovers unchanged original through the real SQL adapter and owner verification", async () => {
  const expected = JSON.parse(readFileSync(join(directory!, "expected.json"), "utf8")) as { jobId: string; ownerKey: string; reportSha256: string; reportLength: number };
  const path = join(directory!, "fictional-sql-state.json"), original = readFileSync(path);
  const db = new FictionalPostgres(path), h = harness(undefined, expected.ownerKey);
  h.deps.store = db.store("recovery");
  h.deps.authenticateOwner = createMonitoringOwner(OWNER_CONFIG, async () => authResponse());
  h.deps.loadInventory = async () => { throw new Error("No inventory on recovery"); };
  h.deps.loadJob = async () => { throw new Error("No job regeneration"); };
  h.deps.collectCanonicalSources = async () => { throw new Error("No collection"); };
  const bytes = await h.runtime.recover(ownerRequest("fictional-sql-fresh-session"), expected.jobId);
  expect(bytes?.length).toBe(expected.reportLength); expect(sha256(bytes!)).toBe(expected.reportSha256);
  expect(bytes!.equals(readFileSync(join(directory!, "original.md")))).toBe(true);
  expect(readFileSync(path).equals(original)).toBe(true);
  writeFileSync(join(directory!, "fresh-process-report.md"), bytes!);
});
