import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { canonicalJson, sha256 } from "../lib/monitoring/source-contract";
import { serviceJobIdentity } from "../lib/monitoring/service-records";
import { createOwnedServiceRuntime } from "../lib/monitoring/owned-runtime";
import { createOwnedMonitoringWorkflow } from "../lib/monitoring/owned-workflow";
import { createServiceVerifier } from "../lib/monitoring/service-authority";
import { ownedFixture, INITIAL_CONFIG, mutation, SCHEDULE } from "./fixtures/monitoring-node/owned-workflow-fixture";
import { producerRequest } from "./fixtures/monitoring-node/service-fixture";
import { ownerRequest, TOKEN_B } from "./fixtures/monitoring-node/owner-fixture";
import { SCOPE, fixture } from "./fixtures/monitoring-node/runtime-fixture";
import { SERVICE_VERIFICATION } from "./fixtures/monitoring-node/service-public-fixture";
const cleanups: (() => Promise<void>)[] = [], directories: string[] = [];
afterEach(async () => { for (const close of cleanups.splice(0)) await close(); for (const dir of directories.splice(0)) rmSync(dir, { recursive: true, force: true }); });
async function setup(path?: string) { const f = await ownedFixture(path); cleanups.push(f.local.close); return f; }

describe("owned configuration → canonical service job → fresh recurring rights → original report", () => {
  it("uses actual owner handlers and refuses CSRF, extra paid/owner/URL inputs and unowned access", async () => {
    const f = await setup();
    expect((await f.handlers.PUT(mutation("PUT", INITIAL_CONFIG, undefined, "https://attacker.invalid"))).status).toBe(403);
    expect((await f.handlers.PUT(mutation("PUT", { ...INITIAL_CONFIG, paid: true, ownerKey: f.h.ownerKey, sourceUrls: ["https://attacker.invalid"] }))).status).toBe(400);
    expect(f.database.versions.size).toBe(0);
    const response = await f.handlers.PUT(mutation("PUT", INITIAL_CONFIG)); expect(response.status).toBe(200);
    const saved = await response.json(); expect(saved.watchlist.version).toBe(1); expect(saved.watchlist.slugs).toEqual(["example-mcp"]);
    expect(JSON.stringify(saved)).not.toMatch(/cus_|sub_|invoice|ownerKey|inventorySha256/);
    expect(await (await f.handlers.GET(ownerRequest(TOKEN_B))).json()).toEqual({ watchlist: null });
    expect((await f.handlers.POST(mutation("POST", { kind: "capture" }, TOKEN_B))).status).toBe(403);
    expect(f.provider.calls).toHaveLength(0); expect(f.local.calls).toHaveLength(0);
  });

  it("returns exact successful mutation after catalog drift and rejects conflicting replay/stale updates", async () => {
    const f = await setup(), first = await f.workflow.configure(f.h.ownerKey, INITIAL_CONFIG);
    const drift = createOwnedMonitoringWorkflow({ scope: SCOPE, configurationStore: f.control("configure"), control: f.control("produce"), custody: f.h.deps.store, verifier: f.h.verifier, readRights: f.readRights, loadInventory: async () => ({ catalog: [], curated: [] }), now: f.h.deps.now, schedule: SCHEDULE });
    expect(await drift.configure(f.h.ownerKey, INITIAL_CONFIG)).toEqual(first);
    await expect(drift.configure(f.h.ownerKey, { ...INITIAL_CONFIG, enabled: false })).rejects.toThrow(/already used/);
    await expect(f.workflow.configure(f.h.ownerKey, { ...INITIAL_CONFIG, mutationId: randomUUID() })).rejects.toThrow(/conflict/i);
    expect(f.database.versions.size).toBe(1);
    const updated = await f.workflow.configure(f.h.ownerKey, { ...INITIAL_CONFIG, expectedVersion: 1, mutationId: randomUUID(), enabled: false });
    expect(updated.version).toBe(2); expect(await f.control("recover").getVersion(f.h.ownerKey, 1)).toEqual(first);
  });

  it("rejects unknown, oversized or multi-host canonical cohorts instead of silently dropping sources", async () => {
    const f = await setup();
    await expect(f.workflow.configure(f.h.ownerKey, { ...INITIAL_CONFIG, slugs: ["missing"] })).rejects.toThrow();
    const catalog = [...fixture.catalog, { id: "other", slug: "other", name: "Other", repo: "https://docs.cursor.com/fictional" }];
    const workflow = createOwnedMonitoringWorkflow({ scope: SCOPE, configurationStore: f.control("configure"), control: f.control("produce"), custody: f.h.deps.store, verifier: f.h.verifier, readRights: f.readRights, loadInventory: async () => ({ catalog, curated: [] }), now: f.h.deps.now, schedule: SCHEDULE });
    await expect(workflow.configure(f.h.ownerKey, { ...INITIAL_CONFIG, slugs: ["example-mcp", "other"] })).rejects.toThrow(/one host/);
    expect(f.database.versions.size).toBe(0); expect(f.local.calls).toHaveLength(0);
  });

  it("cannot queue from unpaid/canceled/expired or ambiguous binding and ignores forged provider metadata", async () => {
    const f = await setup(); await f.workflow.configure(f.h.ownerKey, INITIAL_CONFIG); f.h.setClock("2026-11-01T00:00:11Z");
    for (const status of ["canceled", "unpaid", "past_due", "incomplete"]) {
      f.provider.subscription.status = status;
      expect((await f.handlers.POST(mutation("POST", { kind: "capture" }))).status).toBe(403);
    }
    f.provider.subscription.status = "active"; f.provider.subscription.items.data[0].current_period_end = Date.parse("2026-11-01T00:00:10Z") / 1000;
    expect((await f.handlers.POST(mutation("POST", { kind: "capture" }))).status).toBe(403);
    f.provider.subscription.items.data[0].current_period_end = Date.parse("2026-12-01T00:00:00Z") / 1000;
    f.provider.current.payments.data.push({ ...f.provider.current.payments.data[0], id: "inpay_Split" });
    expect((await f.handlers.POST(mutation("POST", { kind: "capture" }))).status).toBe(503);
    expect(f.database.jobs.size).toBe(0); expect(f.local.calls).toHaveLength(0);
    f.provider.current.payments.data.pop(); f.database.duplicateBinding = true;
    expect((await f.handlers.POST(mutation("POST", { kind: "capture" }))).status).toBe(503);
    f.database.duplicateBinding = false;
    f.database.bindings.clear(); Object.assign(f.provider.subscription, { metadata: { paid: "true", ownerKey: f.h.ownerKey } });
    expect((await f.handlers.POST(mutation("POST", { kind: "capture" }))).status).toBe(403);
  });

  it("expires jobs without refreshing identity and refuses old versions before any collection", async () => {
    const f = await setup(); await f.workflow.configure(f.h.ownerKey, INITIAL_CONFIG); f.h.setClock("2026-11-01T00:00:11Z");
    const first = await f.workflow.prepare(f.h.ownerKey, "capture"), original = await f.control("produce").getCanonicalJob(first.jobId!);
    f.h.setClock("2026-11-01T00:01:11Z");
    expect((await f.workflow.prepare(f.h.ownerKey, "capture")).state).toBe("not_due");
    expect(await f.workflow.loadJob(first.jobId!)).toBeNull();
    await expect(f.runtime.run(producerRequest(), first.jobId!)).rejects.toThrow(/Canonical service job unavailable/);
    expect(await f.control("produce").getCanonicalJob(first.jobId!)).toEqual(original);
    f.h.setClock("2026-11-01T00:00:12Z");
    await f.workflow.configure(f.h.ownerKey, { ...INITIAL_CONFIG, expectedVersion: 1, mutationId: randomUUID(), enabled: false });
    expect(await f.workflow.loadJob(first.jobId!)).toBeNull(); expect((await f.workflow.currentRights(original!.job, "generate")).decision).toBe("denied");
    expect(f.local.calls).toHaveLength(0);
  });

  it("rejects a same-owner job whose selection differs from the canonical watchlist before provider reads", async () => {
    const f = await setup(); await f.workflow.configure(f.h.ownerKey, INITIAL_CONFIG); f.h.setClock("2026-11-01T00:00:11Z");
    const selected = await f.workflow.prepare(f.h.ownerKey, "capture");
    const [oldKey, row] = [...f.database.jobs.entries()][0], value = JSON.parse((row.job_bytes as Buffer).toString());
    value.job.slugs = ["unselected"]; value.jobId = serviceJobIdentity(value.job);
    row.job_id = value.jobId; row.job_bytes = canonicalJson(value); row.job_sha256 = sha256(row.job_bytes as Buffer);
    f.database.jobs.delete(oldKey); f.database.jobs.set(JSON.stringify([SCOPE.accountId, SCOPE.mode, SCOPE.productKey, value.jobId]), row);
    const reads = f.provider.calls.length;
    expect(await f.workflow.loadJob(value.jobId)).toBeNull();
    expect((await f.workflow.currentRights(value.job, "generate")).decision).not.toBe("active");
    expect(f.provider.calls.length).toBe(reads); expect(f.local.calls).toHaveLength(0); expect(selected.jobId).not.toBe(value.jobId);
  });

  it("retains missed-period coverage, useful comparison and same-original retries through actual signed production code", async () => {
    const dir = mkdtempSync(join(tmpdir(), "everymcp-owned-flow-")); directories.push(dir);
    const f = await setup(join(dir, "fictional-postgres.json")); await f.workflow.configure(f.h.ownerKey, INITIAL_CONFIG);
    await f.capture(1); const initial = await f.report(1); expect(initial.bytes.toString()).toContain("EveryMCP service-recorded observation");
    // Skip the November 8 window: no fake check is manufactured.
    f.state.html = f.state.html.replace("Node 18", "Node 20"); await f.capture(15);
    const changed = await f.report(15);
    expect(changed.coverage).toMatchObject({ expectedPeriods: 3, availablePeriods: 2, state: "gaps" });
    expect(changed.bytes.toString()).toContain("2026-11-08T00:00:11.000Z");
    expect(changed.bytes.toString()).toContain("Node 18"); expect(changed.bytes.toString()).toContain("Node 20");
    const before = JSON.stringify(f.h.db.state), calls = f.local.calls.length;
    const retry = await f.workflow.prepare(f.h.ownerKey, "report"); expect(retry.coverage).toEqual(changed.coverage);
    expect(await f.runtime.run(producerRequest(), retry.jobId!)).toMatchObject({ receiptId: changed.receiptId, reportSha256: changed.reportSha256 });
    expect(JSON.stringify(f.h.db.state)).toBe(before); expect(f.local.calls.length).toBe(calls);
    expect(sha256(changed.bytes)).toBe(changed.reportSha256);
    expect((await f.handlers.GETReport(ownerRequest(undefined, `https://fictional.invalid/report?jobId=${changed.jobId}`))).status).toBe(200);
    expect((await f.handlers.GETReport(ownerRequest(TOKEN_B, `https://fictional.invalid/report?jobId=${changed.jobId}`))).status).toBe(404);
    f.state.status = 206; await f.capture(22); const unknown = await f.report(22);
    expect(unknown.bytes.toString()).toMatch(/unknown|inconclusive/); expect(unknown.coverage?.state).toBe("gaps");
    const snapshot = Object.fromEntries((["heads", "versions", "jobs", "bindings"] as const).map(name => [name, [...f.database[name]]]));
    writeFileSync(join(dir, "fictional-control.json"), JSON.stringify(snapshot));
    writeFileSync(join(dir, "expected.json"), JSON.stringify({ jobId: unknown.jobId, receiptId: unknown.receiptId, reportSha256: unknown.reportSha256, reportLength: unknown.reportLength, coverage: unknown.coverage }));
    writeFileSync(join(dir, "original-owned-report.md"), unknown.bytes);
    const output = execFileSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/fixtures/monitoring-node/owned-recover-process.test.ts", "--maxWorkers=1", "--minWorkers=1"], { cwd: process.cwd(), env: { PATH: process.env.PATH, NODE_ENV: "test", EVERYMCP_OWNED_RECOVERY_DIR: dir }, timeout: 30000, encoding: "utf8" });
    expect(output).toContain("1 passed"); expect(readFileSync(join(dir, "fresh-process-owned-report.md"))).toEqual(unknown.bytes);
    const evidence = process.env.EVERYMCP_OWNED_EVIDENCE_DIR;
    if (evidence) for (const name of ["fictional-control.json", "fictional-postgres.json", "expected.json", "original-owned-report.md", "fresh-process-owned-report.md"]) copyFileSync(join(dir, name), join(evidence, name));
  }, 15000);

  it("separates config pause from historical recovery and uses fresh rights on every download", async () => {
    const f = await setup(); await f.workflow.configure(f.h.ownerKey, INITIAL_CONFIG); await f.capture(1); const report = await f.report(1);
    await f.workflow.configure(f.h.ownerKey, { ...INITIAL_CONFIG, expectedVersion: 1, mutationId: randomUUID(), enabled: false });
    const original = await f.runtime.recover(ownerRequest(), report.jobId); expect(original).toEqual(report.bytes);
    f.provider.subscription.status = "canceled";
    expect(await f.runtime.recover(ownerRequest(), report.jobId)).toBeNull();
    f.provider.subscription.status = "active"; f.provider.current.invoice.post_payment_credit_notes_amount = 1;
    expect(await f.runtime.recover(ownerRequest(), report.jobId)).toBeNull();
    f.provider.current.invoice.post_payment_credit_notes_amount = 0; f.provider.current.payments.has_more = true;
    await expect(f.runtime.recover(ownerRequest(), report.jobId)).rejects.toThrow(/rights unavailable/);
  }, 10000);

  it("reports captured representation unchanged only after two complete admitted observations", async () => {
    const f = await setup(); await f.workflow.configure(f.h.ownerKey, INITIAL_CONFIG);
    await f.capture(1); await f.capture(8); const report = await f.report(8);
    expect(report.coverage).toMatchObject({ state: "complete", availablePeriods: 2 });
    expect(report.bytes.toString().toLowerCase()).toContain("captured representation unchanged");
    expect(report.bytes.toString()).toContain("2026-11-01"); expect(report.bytes.toString()).toContain("2026-11-08");
  }, 10000);

  it("uses a public-only recovery composition and refuses mismatched canonical inventory before storage", async () => {
    const f = await setup(); await f.workflow.configure(f.h.ownerKey, INITIAL_CONFIG); await f.capture(1); const report = await f.report(1);
    const reader = createOwnedMonitoringWorkflow({ scope: SCOPE, control: f.control("recover"), custody: f.h.makeStore("recovery"), verifier: createServiceVerifier(SERVICE_VERIFICATION), readRights: f.readRights, loadInventory: async () => { throw new Error("No regeneration"); }, now: f.h.deps.now, schedule: SCHEDULE });
    const runtime = createOwnedServiceRuntime({ ...f.h.deps, producer: undefined, verifier: createServiceVerifier(SERVICE_VERIFICATION), store: f.h.makeStore("recovery") }, reader, f.control("recover"));
    expect(await runtime.recover(ownerRequest(), report.jobId)).toEqual(report.bytes);
    const row = [...f.database.jobs.values()].find(value => value.job_id === report.jobId)!;
    const data = JSON.parse((row.job_bytes as Buffer).toString()); data.inventorySha256 = "a".repeat(64);
    row.job_bytes = canonicalJson(data); row.job_sha256 = sha256(row.job_bytes as Buffer);
    await expect(runtime.recover(ownerRequest(), report.jobId)).rejects.toThrow();
  }, 10000);
});
