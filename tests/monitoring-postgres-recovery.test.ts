/** Actual route/runtime/SQL adapter; Auth, database responses and rights are fictional. */
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../lib/monitoring/runtime", async importOriginal => ({ ...await importOriginal<typeof import("../lib/monitoring/runtime")>(), getMonitoringRuntime: vi.fn(() => null) }));
import { getMonitoringRuntime } from "../lib/monitoring/runtime";
import { createMonitoringOwner } from "../lib/monitoring/owner";
import { CUSTODY_SQL } from "../lib/monitoring/postgres-store";
import { sha256 } from "../lib/monitoring/source-contract";
import { GET } from "../app/api/monitoring/recovery/route";
import { POST } from "../app/api/monitoring/run/route";
import { harness } from "./fixtures/monitoring-node/runtime-fixture";
import { OWNER_CONFIG, TOKEN_A, TOKEN_B, USER_A, USER_B, authResponse, ownerRequest } from "./fixtures/monitoring-node/owner-fixture";
import { FictionalPostgres } from "./fixtures/monitoring-node/postgres-fixture";
const binding = vi.mocked(getMonitoringRuntime);
afterEach(() => { binding.mockReturnValue(null); });

async function prepared(path?: string) {
  const auth = createMonitoringOwner(OWNER_CONFIG, async (_url, options) => authResponse(JSON.stringify(new Headers(options?.headers).get("authorization") === "Bearer " + TOKEN_B ? USER_B : USER_A)));
  const owner = (await auth(ownerRequest()))!;
  const db = new FictionalPostgres(path), h = harness(undefined, owner.ownerKey);
  h.deps.store = db.store("producer");
  const a = await h.capture(0), b = await h.capture(3), report = await h.report([a.receiptId, b.receiptId]);
  h.deps.store = db.store("recovery"); h.deps.authenticateOwner = auth;
  binding.mockReturnValue(h.runtime);
  return { db, h, auth, owner, report, url: "https://fictional.invalid/api/monitoring/recovery?jobId=" + report.jobId };
}
describe("PostgreSQL custody through actual monitoring handlers", () => {
  it("returns exact original to a new current-owner session, using only recovery-role queries", async () => {
    const retained = process.env.EVERYMCP_FICTIONAL_POSTGRES_DIR;
    const directory = retained || mkdtempSync(join(tmpdir(), "everymcp-postgres-fixture-"));
    try {
      const path = join(directory, "fictional-sql-state.json");
      const { db, report, owner, url } = await prepared(path);
      const original = (await db.store("recovery").getExecutionByReceipt(report.receiptId))!.reportBytes!;
      const before = readFileSync(path);
      const restarted = harness(undefined, owner.ownerKey), restored = new FictionalPostgres(path);
      restarted.deps.store = restored.store("recovery");
      restarted.deps.authenticateOwner = createMonitoringOwner(OWNER_CONFIG, async () => authResponse());
      restarted.deps.loadInventory = async () => { throw new Error("Recovery cannot rebuild"); };
      restarted.deps.collectCanonicalSources = async () => { throw new Error("Recovery cannot collect"); };
      binding.mockReturnValue(restarted.runtime);
      const result = await GET(ownerRequest("fictional-new-owner-session", url));
      expect(result.status).toBe(200); expect(result.headers.get("cache-control")).toBe("private, no-store");
      const bytes = Buffer.from(await result.arrayBuffer()); expect(bytes.equals(original)).toBe(true);
      expect(readFileSync(path).equals(before)).toBe(true);
      expect(restored.calls.every(call => call.access === "recovery" && !call.sql.startsWith("INSERT"))).toBe(true);
      if (retained) {
        writeFileSync(join(directory, "original.md"), original);
        writeFileSync(join(directory, "expected.json"), JSON.stringify({ evidence: "fictional-sql-auth-rights-only", ...report, ownerKey: owner.ownerKey, reportSha256: sha256(bytes), reportLength: bytes.length }));
      }
    } finally { if (!retained) rmSync(directory, { recursive: true, force: true }); }
  });
  it("checks current owner before selecting report bodies and checks rights before and after custody retrieval", async () => {
    const { db, h, url } = await prepared(); db.calls.length = 0;
    expect((await GET(ownerRequest(TOKEN_B, url))).status).toBe(404);
    expect(db.calls.some(call => call.sql === CUSTODY_SQL.original)).toBe(false);
    const active = h.deps.currentRights;
    let checks = 0;
    h.deps.currentRights = async (job, action) => ({ ...await active(job, action), decision: ++checks === 1 ? "active" : "denied" });
    expect((await GET(ownerRequest(TOKEN_A, url))).status).toBe(404); expect(checks).toBe(2);
    h.deps.currentRights = async (job, action) => ({ ...await active(job, action), decision: "unknown" });
    expect((await GET(ownerRequest(TOKEN_A, url))).status).toBe(503);
  });
  it("never lets an ordinary owner POST evidence or become a producer; missing writer verification stays closed", async () => {
    const { db, h, report } = await prepared(); const count = db.connections;
    h.deps.authenticateWorker = async () => null;
    const url = "https://fictional.invalid/api/monitoring/run";
    expect((await POST(new Request(ownerRequest(TOKEN_A, url), { method: "POST", body: JSON.stringify({ jobId: report.jobId }) }))).status).toBe(403);
    expect((await POST(new Request(url, { method: "POST", body: JSON.stringify({ jobId: report.jobId, paid: true }) }))).status).toBe(400);
    expect(db.connections).toBe(count);
    const closed = harness(); closed.deps.store = db.store("producer"); closed.deps.verifyExecutionWriter = async () => false;
    const before = JSON.stringify(db.state); db.calls.length = 0;
    await expect(closed.capture(0)).rejects.toThrow(/independently authorized/);
    expect(closed.calls.collect).toBe(0); expect(JSON.stringify(db.state)).toBe(before);
    expect(db.calls.some(call => call.sql.startsWith("INSERT"))).toBe(false);
  });
  it("fails closed on permission/schema drift without exposing report bodies", async () => {
    const { db, url } = await prepared(); db.calls.length = 0; db.definition = "f".repeat(64);
    const result = await GET(ownerRequest(TOKEN_A, url)); expect(result.status).toBe(503);
    expect(await result.text()).not.toContain("source-history");
    expect(db.calls.some(call => call.sql === CUSTODY_SQL.job || call.sql === CUSTODY_SQL.original)).toBe(false);
  });
});
