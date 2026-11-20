/** Real checked-in identities/URLs; all observed content, Auth, billing and SQL are fictional.
 * The explicit fixture transport dials 127.0.0.1 only; never fetch these public URLs. */
import { afterEach, describe, expect, it } from "vitest";
import { randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import catalog from "../data/mcps.json";
import curated from "../data/listing-evidence.json";
import { createWatchlistSelectionQualifier } from "../lib/monitoring/watchlist-selection";
import { inventoryDigest, sourceInventory, sha256, type SourceReport } from "../lib/monitoring/source-contract";
import { ownedFixture, INITIAL_CONFIG, mutation } from "./fixtures/monitoring-node/owned-workflow-fixture";
import { producerRequest } from "./fixtures/monitoring-node/service-fixture";
import { ownerRequest, TOKEN_B } from "./fixtures/monitoring-node/owner-fixture";
import { cloneFictionalSqlValue, FictionalPostgres } from "./fixtures/monitoring-node/postgres-fixture";

const inventory = { catalog, curated }, qualify = createWatchlistSelectionQualifier(catalog, curated);
const close: (() => Promise<void>)[] = [], directories: string[] = [];
afterEach(async () => { for (const fn of close.splice(0)) await fn(); for (const directory of directories.splice(0)) rmSync(directory, { recursive: true, force: true }); });
async function setup(path?: string, data = inventory) { const f = await ownedFixture(path, data); close.push(f.local.close); f.state.html = "<html><body><h1>Fictional fixture requirements</h1><p>Node 18 required.</p></body></html>"; return f; }

describe("actual catalog eligibility under unchanged source bounds", () => {
  it("keeps fictional SQL clone independence and the original JSON file encoding", () => {
    const value = { scalar: [null, true, 7, "text"], rows: [{ source_bytes: Buffer.from([0, 127, 255]) }] };
    const copy = cloneFictionalSqlValue(value); expect(copy).toEqual(value);
    copy.rows[0].source_bytes[0] = 42; copy.scalar[1] = false;
    expect(value.rows[0].source_bytes[0]).toBe(0); expect(value.scalar[1]).toBe(true);
    expect(cloneFictionalSqlValue(JSON.parse(JSON.stringify(value)))).toEqual(value);
    expect(() => cloneFictionalSqlValue(new Date())).toThrow(/Unsupported/);
    const directory = mkdtempSync(join(tmpdir(), "everymcp-sql-model-clone-")); directories.push(directory);
    const path = join(directory, "state.json"), model = new FictionalPostgres(path);
    model.state.completions.push(value); model.save();
    expect(readFileSync(path, "utf8")).toBe(JSON.stringify(model.state));
    const reloaded = new FictionalPostgres(path); expect(reloaded.state).toEqual(model.state);
    (reloaded.state.completions[0].rows as typeof value.rows)[0].source_bytes[0] = 23;
    expect(value.rows[0].source_bytes[0]).toBe(0);
  });
  it("qualifies every distinct route and unordered pair using the configuration qualifier", () => {
    const canonical = sourceInventory(catalog, curated), slugs = catalog.map(row => row.slug);
    expect(slugs).toHaveLength(616); expect(new Set(slugs).size).toBe(616);
    expect(canonical.sources.size).toBe(585); expect(canonical.rejected).toEqual([]);
    expect(inventoryDigest(catalog, curated)).toBe("77fb866960540c586bcc1b7203e42ccdb680be2eab43543d602d126a1ba85e20");
    const singles = slugs.map(slug => ({ slug, ...qualify([slug]) }));
    expect(singles.filter(row => row.reasons.length)).toMatchObject([
      { slug: "revenuecat-mcp", sourceCount: 3, hostCount: 2, reasons: ["too_many_source_urls", "multiple_source_hosts"] },
      { slug: "hotjar-mcp", sourceCount: 3, hostCount: 2, reasons: ["too_many_source_urls", "multiple_source_hosts"] },
    ]);
    const pairs = { eligible: 0, overTwoUrls: 0, multipleHostsOnly: 0, unavailable: 0 };
    for (let a = 0; a < slugs.length; a++) for (let b = a + 1; b < slugs.length; b++) {
      const selection = qualify([slugs[a], slugs[b]]);
      if (selection.reasons.includes("canonical_source_unavailable")) pairs.unavailable++;
      else if (selection.reasons.includes("too_many_source_urls")) pairs.overTwoUrls++;
      else if (selection.reasons.includes("multiple_source_hosts")) pairs.multipleHostsOnly++;
      else pairs.eligible++;
    }
    expect(pairs).toEqual({ eligible: 184528, overTwoUrls: 3065, multipleHostsOnly: 1827, unavailable: 0 });
    // Duplicate catalog IDs are not interchangeable route/ownership identities.
    expect(qualify(["neon-mcp", "neon-mcp-server"])).toEqual({ sourceUrls: ["https://github.com/neondatabase/mcp-server-neon"], sourceCount: 1, hostCount: 1, reasons: [] });
    const evidence = process.env.EVERYMCP_CATALOG_EVIDENCE_DIR;
    if (evidence) writeFileSync(join(evidence, "catalog-coverage.json"), JSON.stringify({ inventorySha256: inventoryDigest(catalog, curated), catalogSha256: sha256(readFileSync("data/mcps.json")), curatedSha256: sha256(readFileSync("data/listing-evidence.json")), sourceCount: canonical.sources.size, eligibleSingles: singles.filter(row => !row.reasons.length).length, totalSingles: slugs.length, totalPairs: slugs.length * (slugs.length - 1) / 2, pairs, singles, meaning: "Offline source-bound eligibility only; no source reachability, compatibility or hosted monitoring acceptance." }, null, 2) + "\n");
  });

  it("reports exact unsupported selection reasons before any write, provider read or collection", async () => {
    const f = await setup();
    for (const [slugs, reasons, sourceCount, hostCount] of [
      [["revenuecat-mcp"], ["too_many_source_urls", "multiple_source_hosts"], 3, 2],
      [["hotjar-mcp"], ["too_many_source_urls", "multiple_source_hosts"], 3, 2],
      [["icloud-mcp", "memory"], ["too_many_source_urls"], 3, 1],
      [["cursor-mcp", "filesystem"], ["multiple_source_hosts"], 2, 2],
      [["not-a-catalog-route", "memory"], ["canonical_source_unavailable"], 1, 1],
    ] as const) {
      const response = await f.handlers.PUT(mutation("PUT", { ...INITIAL_CONFIG, slugs }));
      expect(response.status).toBe(422); expect(response.headers.get("cache-control")).toBe("private, no-store");
      expect(await response.json()).toMatchObject({ reasons, sourceCount, hostCount, limits: { sourceCount: 2, hostCount: 1 } });
    }
    expect(f.database.versions.size).toBe(0); expect(f.database.jobs.size).toBe(0);
    expect(f.provider.calls).toHaveLength(0); expect(f.local.calls).toHaveLength(0);
    expect((await f.handlers.PUT(mutation("PUT", { ...INITIAL_CONFIG, slugs: ["filesystem"], sourceUrls: ["https://attacker.invalid"] }))).status).toBe(400);
  });

  it("preserves every reference, shared URL and slug when real owners configure supported routes", async () => {
    const f = await setup(); let version = 0;
    for (const slugs of [["filesystem"], ["filesystem", "memory"], ["filesystem", "filesystem-mcp"], ["cursor-mcp"], ["icloud-mcp"], ["redash-mcp"], ["heap-mcp"], ["neon-mcp", "neon-mcp-server"]]) {
      const response = await f.handlers.PUT(mutation("PUT", { ...INITIAL_CONFIG, slugs, expectedVersion: version, mutationId: randomUUID() }));
      expect(response.status).toBe(200); version++;
      const saved = await f.workflow.current(f.h.ownerKey);
      expect(saved?.sourceUrls).toEqual(qualify(slugs).sourceUrls); expect(saved?.slugs).toEqual([...slugs].sort());
      expect(saved?.version).toBe(version); expect(saved?.inventorySha256).toBe(inventoryDigest(catalog, curated));
      expect(await (await f.handlers.GET(ownerRequest(TOKEN_B))).json()).toEqual({ watchlist: null });
    }
    expect(f.provider.calls).toHaveLength(0); expect(f.local.calls).toHaveLength(0);
  });

  it("keeps invalid canonical references explicit rather than silently dropping them", () => {
    const changed = structuredClone(curated);
    changed.find(row => row.slug === "icloud-mcp")!.references[0].url = "https://outside-allowlist.invalid/reference";
    expect(createWatchlistSelectionQualifier(catalog, changed)(["icloud-mcp"])).toMatchObject({ sourceCount: 1, reasons: ["canonical_source_unavailable"] });
    expect(qualify(["icloud-mcp"]).sourceCount).toBe(2);
  });

  it("keeps stale edits at 409 and exact mutation replay before changed actual-catalog resolution", async () => {
    const data = structuredClone(inventory), f = await setup(undefined, data), request = { ...INITIAL_CONFIG, slugs: ["filesystem"] };
    const first = await f.workflow.configure(f.h.ownerKey, request);
    data.catalog.find(row => row.slug === "filesystem")!.repo += "-fictional-edited-reference";
    expect(await f.workflow.configure(f.h.ownerKey, request)).toEqual(first);
    expect((await f.handlers.PUT(mutation("PUT", { ...request, enabled: false }))).status).toBe(409);
    expect((await f.handlers.PUT(mutation("PUT", { ...request, mutationId: randomUUID() }))).status).toBe(409);
    f.h.setClock("2026-11-01T00:00:11Z");
    expect((await f.handlers.POST(mutation("POST", { kind: "capture" }))).status).toBe(409);
    expect(f.database.versions.size).toBe(1); expect(f.database.jobs.size).toBe(0);
    expect(f.local.calls).toHaveLength(0); expect(f.provider.calls).toHaveLength(0);
  });
});

describe("actual catalog through synthetic owned monitoring and original recovery", () => {
  it.each([{ slugs: ["neon-mcp", "neon-mcp-server"] }, { slugs: ["cursor-mcp"] }])("keeps shared identities and one-source scope for $slugs", async ({ slugs }) => {
    const f = await setup(); await f.workflow.configure(f.h.ownerKey, { ...INITIAL_CONFIG, slugs });
    const capture = await f.capture(1), saved = await f.h.deps.store.getExecutionByReceipt(capture.receiptId);
    const source = JSON.parse(saved!.sourceBytes!.toString()) as SourceReport;
    expect(source.summary.attemptsThisRun).toBe(1); expect(source.sources.filter(row => row.observation === null)).toHaveLength(584);
    const selected = source.sources.find(row => row.url === qualify(slugs).sourceUrls[0])!;
    for (const slug of slugs) expect(selected.relationships.some(row => row.slug === slug)).toBe(true);
    const baseline = await f.report(1);
    expect(baseline.bytes.toString()).toContain(`${slugs.length} selected listings; 1 distinct source URLs`);
    expect(baseline.bytes.toString()).toContain("latest state: **baseline**");
    expect(await f.runtime.recover(ownerRequest(), baseline.jobId)).toEqual(baseline.bytes);
  }, 15000);

  it.each([{ slugs: ["filesystem", "memory"] }, { slugs: ["icloud-mcp"] }])("retains baseline/change/unknown semantics for $slugs", async ({ slugs }) => {
    const directory = mkdtempSync(join(tmpdir(), "everymcp-actual-catalog-")); directories.push(directory);
    // Snapshot the committed model once for the recovery process; not a native durability test.
    const f = await setup();
    await f.workflow.configure(f.h.ownerKey, { ...INITIAL_CONFIG, slugs });
    const capture = await f.capture(1), original = await f.h.deps.store.getExecutionByReceipt(capture.receiptId);
    const source = JSON.parse(original!.sourceBytes!.toString()) as SourceReport;
    expect(source.listings.length).toBe(616); expect(source.sources.length).toBe(585);
    expect(source.summary.attemptsThisRun).toBe(2); expect(source.summary.robotsRequestsThisRun).toBe(1);
    expect(source.sources.filter(row => row.runDisposition === "checked_this_run").map(row => row.url).sort()).toEqual(qualify(slugs).sourceUrls);
    expect(source.sources.filter(row => row.observation === null).length).toBe(583);
    expect(original!.sourceBytes!.length).toBeLessThan(2 * 1024 * 1024);
    const baseline = await f.report(1); expect(baseline.bytes.toString()).toContain("latest state: **baseline**");
    await f.capture(8); const unchanged = await f.report(8); expect(unchanged.bytes.toString()).toContain("latest state: **unchanged**");
    f.state.html = f.state.html.replace("Node 18", "Node 20"); await f.capture(15); const changed = await f.report(15);
    expect(changed.bytes.toString()).toContain("latest state: **changed**"); expect(changed.bytes.toString()).toContain("Node 18"); expect(changed.bytes.toString()).toContain("Node 20");
    f.state.status = 206; await f.capture(22); const unknown = await f.report(22);
    expect(unknown.bytes.toString()).toContain("latest state: **unknown**"); expect(unknown.bytes.toString()).not.toContain("latest state: **unchanged**");
    for (const url of qualify(slugs).sourceUrls) expect(unknown.bytes.toString()).toContain(url);
    if (slugs.includes("icloud-mcp")) expect(unknown.bytes.toString()).toContain("separate\\_reference/community");
    const calls = f.local.calls.length, saved = JSON.stringify(f.h.db.state);
    expect(await f.runtime.run(producerRequest(), unknown.jobId)).toMatchObject({ receiptId: unknown.receiptId, reportSha256: unknown.reportSha256 });
    expect(JSON.stringify(f.h.db.state)).toBe(saved); expect(f.local.calls.length).toBe(calls);
    expect(await f.runtime.recover(ownerRequest(TOKEN_B), unknown.jobId)).toBeNull();
    const snapshot = Object.fromEntries((["heads", "versions", "jobs", "bindings"] as const).map(name => [name, [...f.database[name]]]));
    writeFileSync(join(directory, "fictional-control.json"), JSON.stringify(snapshot));
    writeFileSync(join(directory, "fictional-postgres.json"), JSON.stringify(f.h.db.state));
    writeFileSync(join(directory, "expected.json"), JSON.stringify({ jobId: unknown.jobId, reportSha256: unknown.reportSha256, reportLength: unknown.reportLength, fragments: [...qualify(slugs).sourceUrls, "latest state: **unknown**"] }));
    writeFileSync(join(directory, "original-owned-report.md"), unknown.bytes);
    const output = execFileSync(process.execPath, ["node_modules/vitest/vitest.mjs", "run", "tests/fixtures/monitoring-node/owned-recover-process.test.ts", "--maxWorkers=1", "--minWorkers=1"], { cwd: process.cwd(), env: { PATH: process.env.PATH, NODE_ENV: "test", EVERYMCP_OWNED_RECOVERY_DIR: directory }, timeout: 30000, encoding: "utf8" });
    expect(output).toContain("1 passed"); expect(readFileSync(join(directory, "fresh-process-owned-report.md"))).toEqual(unknown.bytes);
    const evidence = process.env.EVERYMCP_CATALOG_EVIDENCE_DIR;
    if (evidence) {
      const prefix = slugs.join("--");
      for (const file of ["expected.json", "original-owned-report.md", "fresh-process-owned-report.md"]) copyFileSync(join(directory, file), join(evidence, `${prefix}-${file}`));
    }
  }, 60000);
});
