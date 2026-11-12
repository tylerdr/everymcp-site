/** Fictional authority from published RFC8032 vectors; no generation/configuration of real keys. */
import { createServiceProducer, createServiceVerifier } from "../../../lib/monitoring/service-authority";
import { ServicePostgresCustodyStore } from "../../../lib/monitoring/service-postgres-store";
import { createServiceRecordedRuntime, type ServiceRuntimeDependencies } from "../../../lib/monitoring/service-runtime";
import { serviceJobIdentity } from "../../../lib/monitoring/service-records";
import { createMonitoringOwner } from "../../../lib/monitoring/owner";
import type { Job } from "../../../lib/monitoring/runtime";
import type { SourceReport } from "../../../lib/monitoring/source-contract";
import { fixture, SCOPE, WATCHLIST } from "./runtime-fixture";
import { FictionalPostgres, FICTIONAL_DEFINITION } from "./postgres-fixture";
import { authResponse, OWNER_CONFIG, ownerRequest, TOKEN_B, USER_A, USER_B } from "./owner-fixture";
import { SERVICE_VERIFICATION } from "./service-public-fixture";
const privatePem = (hex: string) => "-----BEGIN PRIVATE KEY-----\n" + Buffer.from("302e020100300506032b657004220420" + hex, "hex").toString("base64") + "\n-----END PRIVATE KEY-----\n";
export const FICTIONAL_PRIVATE_ONE = privatePem("9d61b19deffd5a60ba844af492ec2cc44449c5697b326919703bac031cae7f60");
export const FICTIONAL_PRIVATE_TWO = privatePem("4ccd089b28ff96da9db6c346ec114e0f5b8a319f35aba624da8cf6ed4fb8a6fb");
export const FICTIONAL_PRODUCER_TOKEN = "fictional_producer_request_only_" + "x".repeat(40);
export const producerRequest = (token = FICTIONAL_PRODUCER_TOKEN) => new Request("https://fictional.invalid/api/monitoring/run", { method: "POST", headers: { authorization: "Bearer " + token } });
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
export function fixtureProducer(which = 0) { return createServiceProducer({ verification: SERVICE_VERIFICATION, keyId: SERVICE_VERIFICATION.keys[which].keyId, privateKey: which === 0 ? FICTIONAL_PRIVATE_ONE : FICTIONAL_PRIVATE_TWO, producerToken: FICTIONAL_PRODUCER_TOKEN }); }
export async function serviceHarness(db = new FictionalPostgres()) {
  let clock = new Date("2026-11-12T00:00:04Z"), payload: SourceReport | null = null;
  const jobs = new Map<string, Job>(), calls = { collect: 0, inventory: 0 };
  const auth = createMonitoringOwner(OWNER_CONFIG, async (_url, options) => authResponse(JSON.stringify(new Headers(options?.headers).get("authorization") === "Bearer " + TOKEN_B ? USER_B : USER_A)));
  const ownerKey = (await auth(ownerRequest()))!.ownerKey, producer = fixtureProducer(), verifier = createServiceVerifier(SERVICE_VERIFICATION);
  const makeStore = (access: "producer" | "recovery") => new ServicePostgresCustodyStore(db.pool(access), { scope: SCOPE, access, expectedDefinitionSha256: FICTIONAL_DEFINITION }, verifier);
  const deps: ServiceRuntimeDependencies = { scope: SCOPE, evidenceClass: "synthetic-fixture", store: makeStore("producer"), verifier, producer,
    authenticateOwner: auth, loadJob: async id => jobs.get(id) ?? null,
    currentRights: async (job, action) => ({ scope: job.scope, ownerKey: job.ownerKey, watchlistId: job.watchlistId, version: job.version, periodStart: job.periodStart, periodEnd: job.periodEnd, action, decision: "active" }),
    loadInventory: async () => { calls.inventory++; return { catalog: clone(fixture.catalog), curated: clone(fixture.curated) }; },
    collectCanonicalSources: async (_job, limits) => { calls.collect++; if (!payload || limits.signal.aborted) throw new Error("Fictional observation absent"); clock = new Date(Date.parse(payload.generatedAt) + 1000); return clone(payload); },
    now: () => new Date(clock),
  };
  const runtime = createServiceRecordedRuntime(deps);
  const add = (job: Job) => { const id = serviceJobIdentity(job); jobs.set(id, clone(job)); return id; };
  const captureJob = (stamp: string, receiptIds: string[] = []): Job => ({ scope: SCOPE, ownerKey, watchlistId: WATCHLIST, version: 1, slugs: ["example-mcp"], periodStart: new Date(Date.parse(stamp) - 86400000).toISOString(), periodEnd: stamp, kind: "capture", sourceUrls: ["https://github.com/example/mcp"], receiptIds });
  const capture = async (index: number) => { payload = clone(fixture.reports[index]) as SourceReport; clock = new Date(Date.parse(payload.generatedAt) - 2000); return runtime.run(producerRequest(), add(captureJob(clock.toISOString()))); };
  const reportJob = (receiptIds: string[]): Job => ({ scope: SCOPE, ownerKey, watchlistId: WATCHLIST, version: 1, slugs: ["example-mcp"], periodStart: "2026-11-01T00:00:00Z", periodEnd: "2026-11-12T00:00:00Z", kind: "report", sourceUrls: [], receiptIds });
  const report = async (receipts: string[]) => { clock = new Date("2026-11-12T00:00:04Z"); return runtime.run(producerRequest(), add(reportJob(receipts))); };
  return { db, deps, runtime, ownerKey, producer, verifier, jobs, calls, add, capture, report, captureJob, reportJob, makeStore, setClock: (stamp: string) => { clock = new Date(stamp); } };
}
