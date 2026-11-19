/** Fictional Auth, billing and SQL protocol responses; loopback source documents only. */
import { afterEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { ownedFixture, INITIAL_CONFIG } from "./fixtures/monitoring-node/owned-workflow-fixture";
import { ownerRequest, TOKEN_B } from "./fixtures/monitoring-node/owner-fixture";
import { CONTROL_SQL, PostgresMonitoringControlStore } from "../lib/monitoring/control-postgres";
import { sha256 } from "../lib/monitoring/source-contract";
import { createOwnedMonitoringHandlers } from "../lib/monitoring/owned-handlers";
import { SCOPE } from "./fixtures/monitoring-node/runtime-fixture";
import { DEFINITION } from "./fixtures/monitoring-node/control-postgres-fixture";
import type { SqlPool } from "../lib/recovery/postgres-store";

const cleanups: (() => Promise<void>)[] = [];
const directories: string[] = [];
afterEach(async () => { vi.restoreAllMocks(); for (const close of cleanups.splice(0)) await close(); for (const path of directories.splice(0)) rmSync(path, { recursive: true, force: true }); });
async function setup(path?: string) { const f = await ownedFixture(path); cleanups.push(f.local.close); return f; }
type Fixture = Awaited<ReturnType<typeof setup>>;
type Report = { jobId: string; watchlistVersion: number; slugs: string[]; periodStart: string; periodEnd: string; reportSha256: string; reportLength: number };
type Page = { reports: Report[]; nextCursor: string | null; ordering: string; pageState: string };
function request(cursor: string | null = null, token?: string) { return ownerRequest(token, `https://fictional.invalid/reports${cursor ? `?after=${cursor}` : ""}`); }
async function walk(f: Fixture, token?: string) {
  const pages: Page[] = []; let cursor: string | null = null;
  do {
    const response = await f.handlers.GETReports(request(cursor, token)); expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("private, no-store"); expect(response.headers.has("access-control-allow-origin")).toBe(false);
    const page = await response.json() as Page; pages.push(page); cursor = page.nextCursor;
    expect(page.reports.length).toBeLessThanOrEqual(1); expect(pages.length).toBeLessThan(16);
  } while (cursor);
  return pages;
}
async function seed(f: Fixture) { await f.workflow.configure(f.h.ownerKey, INITIAL_CONFIG); await f.capture(1); return f.report(1); }
function beforeReport(f: Fixture, id: string) { const ids = [...f.database.jobs.values()].map(row => String(row.job_id)).sort(); return ids[ids.indexOf(id) - 1] ?? null; }

describe("owned report discovery after a lost link", () => {
  it("lets an authenticated owner discover a saved original without retaining its job ID", async () => {
    const f = await setup();
    const original = await seed(f);
    expect(f.handlers).toHaveProperty("GETReports");
    const pages = await walk(f), found = pages.flatMap(page => page.reports);
    expect(found).toEqual([{ jobId: original.jobId, watchlistVersion: 1, slugs: INITIAL_CONFIG.slugs, periodStart: "2026-11-01T00:00:10.000Z", periodEnd: "2026-11-01T00:01:11.000Z", reportSha256: original.reportSha256, reportLength: original.reportLength }]);
    expect(JSON.stringify(pages)).not.toMatch(/customer|invoice|subscription|ownerKey|receiptBytes|reportBytes/);
    const downloaded = await f.handlers.GETReport(ownerRequest(undefined, `https://fictional.invalid/report?jobId=${found[0].jobId}`));
    expect(Buffer.from(await downloaded.arrayBuffer())).toEqual(original.bytes);
    expect(pages.every(page => page.ordering === "job_id_ascending")).toBe(true);
  }, 30000);

  it("isolates owners, scopes and cursors and refuses untrusted query authority", async () => {
    const f = await setup(), original = await seed(f), calls = f.provider.calls.length;
    expect((await walk(f, TOKEN_B)).flatMap(page => page.reports)).toEqual([]);
    expect((await f.handlers.GETReports(request(original.jobId, TOKEN_B))).status).toBe(404);
    expect((await f.handlers.GETReports(request("0".repeat(64)))).status).toBe(404);
    const unavailable = await f.handlers.GETReports(new Request("https://fictional.invalid/reports")); expect(unavailable.status).toBe(403);
    for (const query of ["after=", "after=bad", `after=${original.jobId}&after=${original.jobId}`, `ownerKey=${f.h.ownerKey}`, "limit=999", "paid=true", `after=${"a".repeat(4096)}`]) {
      expect((await f.handlers.GETReports(ownerRequest(undefined, `https://fictional.invalid/reports?${query}`))).status).toBe(400);
    }
    for (const headers of [{ origin: "https://attacker.invalid" }, { "sec-fetch-site": "cross-site" }]) {
      const req = request(); for (const [key, value] of Object.entries(headers)) req.headers.set(key, value!);
      expect((await f.handlers.GETReports(req)).status).toBe(403);
    }
    expect(f.provider.calls.length).toBe(calls);
    const control = f.control("recover");
    await expect(control.listOwnedJobs("bad", null)).rejects.toThrow();
    await expect(control.listOwnedJobs(f.h.ownerKey, original.jobId + "' OR 1=1")).rejects.toThrow();
    const otherScope = new PostgresMonitoringControlStore(f.database.pool("recover"), { scope: { ...SCOPE, productKey: "other" }, access: "recover", expectedDefinitionSha256: DEFINITION });
    await expect(otherScope.listOwnedJobs(f.h.ownerKey, null)).rejects.toThrow();
    await expect(f.control("configure").listOwnedJobs(f.h.ownerKey, null)).rejects.toThrow();
    const queries = f.database.calls.filter(call => call.sql === CONTROL_SQL.ownedJobs);
    expect(queries.every(call => call.values.length === 5 && call.values.slice(0, 3).join() === [SCOPE.accountId, SCOPE.mode, SCOPE.productKey].join())).toBe(true);
    expect(CONTROL_SQL.ownedJobs).toContain('owner_key=$4 AND job_id COLLATE "C">$5');
    expect(CONTROL_SQL.ownedJobs).toMatch(/LIMIT 2$/);
  }, 30000);

  it("keeps capture/planned/denied pages distinct from a complete empty history and fails on unknown rights", async () => {
    const f = await setup(), original = await seed(f);
    const before = beforeReport(f, original.jobId);
    const recover = vi.spyOn(f.runtime, "recover");
    const handlers = createOwnedMonitoringHandlers({ origin: "https://fictional.invalid", scope: SCOPE, authenticateOwner: f.h.deps.authenticateOwner, workflow: f.workflow, recover: f.runtime.recover });
    expect((await handlers.GETReports(request(before))).status).toBe(200); expect(recover).toHaveBeenCalledTimes(1);
    for (const state of ["canceled", "unpaid", "past_due"]) {
      f.provider.subscription.status = state;
      const response = await handlers.GETReports(request(before)), page = await response.json() as Page;
      expect(response.status).toBe(200); expect(page.reports).toEqual([]); expect(page.pageState).toBe("no_recoverable_report_on_this_page");
      expect(page.nextCursor).toBe([...f.database.jobs.values()].some(row => String(row.job_id) > original.jobId) ? original.jobId : null);
    }
    f.provider.subscription.status = "active"; f.provider.current.payments.has_more = true;
    expect((await handlers.GETReports(request(before))).status).toBe(503);
    f.provider.current.payments.has_more = false;
    f.h.db.state.jobs = f.h.db.state.jobs.filter(row => row.job_id !== original.jobId);
    const missing = await handlers.GETReports(request(before)); expect(missing.status).toBe(200); expect((await missing.json()).reports).toEqual([]);
  }, 30000);

  it("discovers old-version originals after pause/catalog loss, without generation or mutations", async () => {
    const f = await setup(), original = await seed(f);
    await f.workflow.configure(f.h.ownerKey, { ...INITIAL_CONFIG, expectedVersion: 1, mutationId: randomUUID(), enabled: false });
    f.h.deps.loadInventory = async () => { throw new Error("No current inventory required"); };
    const before = JSON.stringify(f.h.db.state), writes = f.database.calls.filter(call => /^(INSERT|UPDATE)/.test(call.sql)).length, calls = f.local.calls.length;
    expect((await walk(f)).flatMap(page => page.reports).map(report => report.jobId)).toEqual([original.jobId]);
    expect(JSON.stringify(f.h.db.state)).toBe(before); expect(f.local.calls.length).toBe(calls);
    expect(f.database.calls.filter(call => /^(INSERT|UPDATE)/.test(call.sql)).length).toBe(writes);
  }, 30000);

  it("rejects malformed/corrupt/foreign/out-of-order/extra query rows, including the lookahead", async () => {
    const f = await setup(); await seed(f);
    const good = [...f.database.jobs.values()].sort((a, b) => String(a.job_id) < String(b.job_id) ? -1 : 1);
    for (const rows of [[...good, good[0]], [good[1], good[0]], [good[0], good[0]], [{ ...good[0], owner_key: "b".repeat(64) }], [{ ...good[0], writer_role: "other" }], [good[0], { ...good[1], job_sha256: "0".repeat(64) }], [{ ...good[0], job_bytes: Buffer.alloc(65537) }]]) {
      const base = f.database.pool("recover");
      const pool: SqlPool = { async connect() { const client = await base.connect(); return { ...client, query: async (sql, values) => sql === CONTROL_SQL.ownedJobs ? { rows: rows as never[] } : client.query(sql, values) }; } };
      const control = new PostgresMonitoringControlStore(pool, { scope: SCOPE, access: "recover", expectedDefinitionSha256: DEFINITION });
      await expect(control.listOwnedJobs(f.h.ownerKey, null)).rejects.toThrow();
    }
    f.database.ready = false; await expect(f.control("recover").listOwnedJobs(f.h.ownerKey, null)).rejects.toThrow();
    f.database.ready = true; f.database.definition = "0".repeat(64); await expect(f.control("recover").listOwnedJobs(f.h.ownerKey, null)).rejects.toThrow();
    expect(f.database.releases.length).toBe(f.database.acquisitions);
  }, 30000);

  it("does not downgrade a corrupted signed original to an empty page", async () => {
    const f = await setup(), original = await seed(f);
    const row = f.h.db.state.completions.find(row => row.job_id === original.jobId)!;
    row.report_bytes = { type: "Buffer", data: [...Buffer.from("tampered")] };
    expect((await f.handlers.GETReports(request(beforeReport(f, original.jobId)))).status).toBe(503);
  }, 30000);

  it("recovers exact original bytes in a fresh process without any saved job ID or producer", async () => {
    const directory = mkdtempSync(join(tmpdir(), "everymcp-discovery-")); directories.push(directory);
    const f = await setup(join(directory, "fictional-postgres.json")), original = await seed(f);
    await f.workflow.configure(f.h.ownerKey, { ...INITIAL_CONFIG, expectedVersion: 1, mutationId: randomUUID(), enabled: false });
    writeFileSync(join(directory, "fictional-control.json"), JSON.stringify(Object.fromEntries((["heads", "versions", "jobs", "bindings"] as const).map(name => [name, [...f.database[name]]]))));
    writeFileSync(join(directory, "expected.json"), JSON.stringify({ reportSha256: original.reportSha256, reportLength: original.reportLength }));
    const output = execFileSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/fixtures/monitoring-node/discovery-recover-process.test.ts", "--maxWorkers=1", "--minWorkers=1"], { cwd: process.cwd(), env: { PATH: process.env.PATH, NODE_ENV: "test", EVERYMCP_DISCOVERY_RECOVERY_DIR: directory }, timeout: 60000, encoding: "utf8" });
    expect(output).toContain("1 passed");
    expect(readFileSync(join(directory, "recovered-original.md"))).toEqual(original.bytes);
    expect(sha256(original.bytes)).toBe(original.reportSha256);
  }, 90000);
});
