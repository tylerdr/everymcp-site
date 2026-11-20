/** Separate-process recovery with ONLY public verification material and fictional SQL/Auth/rights. */
import { it, expect } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createServiceVerifier } from "../../../lib/monitoring/service-authority";
import { createServiceRecordedRuntime } from "../../../lib/monitoring/service-runtime";
import { ServicePostgresCustodyStore } from "../../../lib/monitoring/service-postgres-store";
import { createMonitoringOwner } from "../../../lib/monitoring/owner";
import { sha256 } from "../../../lib/monitoring/source-contract";
import { FictionalPostgres, FICTIONAL_DEFINITION } from "./postgres-fixture";
import { SERVICE_VERIFICATION } from "./service-public-fixture";
import { SCOPE } from "./runtime-fixture";
import { authResponse, OWNER_CONFIG, ownerRequest } from "./owner-fixture";
const directory = process.env.EVERYMCP_SERVICE_RECOVERY_DIR;
it.skipIf(!directory)("recovers the stored service original with no producer or signing key", async () => {
  const expected = JSON.parse(readFileSync(join(directory!, "expected.json"), "utf8")) as { jobId: string; reportSha256: string; reportLength: number };
  const db = new FictionalPostgres(join(directory!, "fictional-postgres.json")), verifier = createServiceVerifier(SERVICE_VERIFICATION);
  const runtime = createServiceRecordedRuntime({ scope: SCOPE, evidenceClass: "synthetic-fixture", verifier,
    store: new ServicePostgresCustodyStore(db.pool("recovery"), { scope: SCOPE, access: "recovery", expectedDefinitionSha256: FICTIONAL_DEFINITION }, verifier),
    authenticateOwner: createMonitoringOwner(OWNER_CONFIG, async () => authResponse()),
    currentRights: async (job, action) => ({ scope: job.scope, ownerKey: job.ownerKey, watchlistId: job.watchlistId, version: job.version, periodStart: job.periodStart, periodEnd: job.periodEnd, action, decision: "active" }),
    loadJob: async () => { throw new Error("No job regeneration"); }, loadInventory: async () => { throw new Error("No inventory regeneration"); }, collectCanonicalSources: async () => { throw new Error("No collection"); },
    now: () => new Date("2026-12-15T00:00:00Z"), // Issuance expired; historical verification is still valid.
  });
  const bytes = await runtime.recover(ownerRequest("fictional-fresh-owner-session"), expected.jobId);
  expect(bytes?.length).toBe(expected.reportLength); expect(sha256(bytes!)).toBe(expected.reportSha256);
  expect(bytes!.toString()).toContain("EveryMCP service-recorded observation");
  writeFileSync(join(directory!, "fresh-process-service-report.md"), bytes!);
});
