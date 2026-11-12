/** Fictional Auth/rights/custody only, through the actual owner adapter and GET handler. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
vi.mock("../lib/monitoring/runtime", async importOriginal => ({ ...await importOriginal<typeof import("../lib/monitoring/runtime")>(), getMonitoringRuntime: vi.fn(() => null) }));
import { createMonitoringOwner } from "../lib/monitoring/owner";
import { getMonitoringRuntime, type Rights } from "../lib/monitoring/runtime";
import { GET } from "../app/api/monitoring/recovery/route";
import { FictionalCustody, harness } from "./fixtures/monitoring-node/runtime-fixture";
import { OWNER_CONFIG, TOKEN_A, TOKEN_B, USER_A, USER_B, authResponse, ownerRequest } from "./fixtures/monitoring-node/owner-fixture";
import { sha256 } from "../lib/monitoring/source-contract";
const binding = vi.mocked(getMonitoringRuntime);
afterEach(() => { binding.mockReturnValue(null); });

async function prepared(directory?: string) {
  const auth = vi.fn<typeof fetch>().mockImplementation(async (_url, options) => {
    const token = new Headers(options?.headers).get("authorization");
    return authResponse(JSON.stringify(token === "Bearer " + TOKEN_B ? USER_B : USER_A));
  });
  const authenticate = createMonitoringOwner(OWNER_CONFIG, auth);
  const owner = (await authenticate(ownerRequest()))!;
  const h = harness(new FictionalCustody(directory), owner.ownerKey);
  const one = await h.capture(0), two = await h.capture(1);
  const report = await h.report([one.receiptId, two.receiptId]);
  h.deps.authenticateOwner = authenticate;
  binding.mockReturnValue(h.runtime);
  auth.mockClear();
  return { h, report, auth, authenticate, owner, url: "https://fictional.invalid/api/monitoring/recovery?jobId=" + report.jobId };
}
describe("owner-bound original monitoring recovery", () => {
  it("recovers the exact original in a new session and reconstructed store without inventory or generation", async () => {
    const retained = process.env.EVERYMCP_FICTIONAL_OWNER_DIR;
    const directory = retained || mkdtempSync(join(tmpdir(), "everymcp-owner-fixture-"));
    try {
      const { h, report, auth, owner, url } = await prepared(directory);
      const original = (await h.store.getExecutionByReceipt(report.receiptId))!.reportBytes!;
      const first = await GET(ownerRequest(TOKEN_A, url));
      expect(first.status).toBe(200); expect(first.headers.get("cache-control")).toBe("private, no-store");
      expect(Buffer.from(await first.arrayBuffer()).equals(original)).toBe(true);
      const saved = readFileSync(join(directory, "fictional-custody.json"));
      const restarted = harness(new FictionalCustody(directory), owner.ownerKey);
      // Fresh adapter and a different fictional token for the same authoritative UUID.
      restarted.deps.authenticateOwner = createMonitoringOwner(OWNER_CONFIG, auth);
      restarted.deps.loadInventory = async () => { throw new Error("Recovery must not regenerate"); };
      restarted.deps.collectCanonicalSources = async () => { throw new Error("Recovery must not collect"); };
      binding.mockReturnValue(restarted.runtime);
      const result = await GET(ownerRequest("fictional-new-session-owner-a", url));
      expect(result.status).toBe(200); expect(Buffer.from(await result.arrayBuffer()).equals(original)).toBe(true);
      expect(auth).toHaveBeenCalledTimes(2);
      expect(readFileSync(join(directory, "fictional-custody.json")).equals(saved)).toBe(true);
      if (retained) {
        writeFileSync(join(directory, "original.md"), original);
        writeFileSync(join(directory, "owner-expected.json"), JSON.stringify({ evidence: "fictional-auth-rights-and-custody-only", ownerKey: owner.ownerKey, jobId: report.jobId, receiptId: report.receiptId, reportSha256: sha256(original), reportLength: original.length }));
      }
    } finally { if (!retained) rmSync(directory, { recursive: true, force: true }); }
  });
  it("denies another current owner before rights/store bytes even when metadata claims payment and the original owner", async () => {
    const { h, url, owner, auth } = await prepared();
    auth.mockImplementation(async () => authResponse(JSON.stringify({ ...USER_B, user_metadata: { ownerKey: owner.ownerKey, paid: true }, app_metadata: { paid: true } })));
    const rights = vi.spyOn(h.deps, "currentRights"), bytes = vi.spyOn(h.store, "getExecutionByReceipt");
    const result = await GET(ownerRequest(TOKEN_B, url));
    expect(result.status).toBe(404); expect(rights).not.toHaveBeenCalled(); expect(bytes).not.toHaveBeenCalled();
    expect(await result.text()).not.toContain(owner.ownerKey);
  });
  it("requires current exact recovery rights after identity; denial, unknown, and revocation during retrieval expose no bytes", async () => {
    const { h, url, auth } = await prepared();
    const current = h.deps.currentRights;
    for (const decision of ["denied", "unknown"] as const) {
      h.deps.currentRights = async (job, action) => ({ ...await current(job, action), decision });
      const result = await GET(ownerRequest(TOKEN_A, url));
      expect(result.status).toBe(decision === "denied" ? 404 : 503);
      expect(result.headers.get("cache-control")).toBe("private, no-store");
    }
    let checks = 0;
    h.deps.currentRights = async (job, action): Promise<Rights> => ({ ...await current(job, action), decision: ++checks === 1 ? "active" : "denied" });
    expect((await GET(ownerRequest(TOKEN_A, url))).status).toBe(404); expect(checks).toBe(2);
    h.deps.currentRights = async (job, action) => ({ ...await current(job, action), ownerKey: "f".repeat(64) });
    expect((await GET(ownerRequest(TOKEN_A, url))).status).toBe(503);
    expect(auth).toHaveBeenCalledTimes(4);
  });
  it("rechecks the authoritative user on each request and fails closed before reading custody on Auth denial/unavailability", async () => {
    const { h, url, auth } = await prepared();
    expect((await GET(ownerRequest(TOKEN_A, url))).status).toBe(200);
    const read = vi.spyOn(h.store, "getJob");
    for (const [status, expected] of [[401, 404], [403, 404], [500, 503]]) {
      auth.mockImplementation(async () => authResponse(null, { status }));
      expect((await GET(ownerRequest(TOKEN_A, url))).status).toBe(expected);
    }
    expect(auth).toHaveBeenCalledTimes(4); expect(read).not.toHaveBeenCalled();
  });
});
