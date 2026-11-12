/** Fictional customer/provider/SQL data and loopback HTTP; no hosted service is contacted. */
import { createNodeCollector } from "../../../lib/monitoring/collector";
import { createOwnedMonitoringWorkflow } from "../../../lib/monitoring/owned-workflow";
import { createOwnedServiceRuntime } from "../../../lib/monitoring/owned-runtime";
import { createOwnedMonitoringHandlers } from "../../../lib/monitoring/owned-handlers";
import { createRecurringRightsReader } from "../../../lib/monitoring/recurring-rights";
import { PostgresMonitoringControlStore } from "../../../lib/monitoring/control-postgres";
import { FictionalControl, DEFINITION } from "./control-postgres-fixture";
import { FictionalPostgres } from "./postgres-fixture";
import { FictionalRecurringHttp, config as billingConfig } from "./recurring-provider-fixture";
import { serviceHarness, producerRequest } from "./service-fixture";
import { SCOPE } from "./runtime-fixture";
import { ownerRequest, TOKEN_A } from "./owner-fixture";
import { loopback } from "./loopback";
export const SCHEDULE = { cadenceSeconds: 7 * 86400, historyPeriods: 4, maxJobAgeSeconds: 60 };
export const INITIAL_CONFIG = { expectedVersion: 0, mutationId: "11111111-1111-4111-8111-111111111111", slugs: ["example-mcp"], enabled: true };
export function mutation(method: "PUT" | "POST", value: unknown, token = TOKEN_A, origin = "https://fictional.invalid") {
  return new Request("https://fictional.invalid/owned-watchlist", { method, headers: { ...Object.fromEntries(ownerRequest(token).headers), origin, "sec-fetch-site": "same-origin", "content-type": "application/json" }, body: JSON.stringify(value) });
}
export async function ownedFixture(custodyPath?: string) {
  const h = await serviceHarness(new FictionalPostgres(custodyPath)), database = new FictionalControl(), provider = new FictionalRecurringHttp();
  provider.account.id = SCOPE.accountId;
  const control = (access: "configure" | "produce" | "recover") => new PostgresMonitoringControlStore(database.pool(access), { scope: SCOPE, access, expectedDefinitionSha256: DEFINITION });
  const state = { html: "<html><body><h1>Requirements</h1><p>Node 18 required.</p></body></html>", status: 200 };
  const local = await loopback((req, res) => {
    if (req.url === "/robots.txt") { res.statusCode = 404; res.end(); }
    else { res.statusCode = state.status; res.setHeader("Content-Type", "text/html; charset=utf-8"); res.end(state.html); }
  });
  h.deps.collectCanonicalSources = createNodeCollector({ now: h.deps.now, transport: local.transport });
  const readRights = createRecurringRightsReader({ ...billingConfig, scope: SCOPE, now: h.deps.now }, { httpClient: provider });
  const workflow = createOwnedMonitoringWorkflow({ scope: SCOPE, configurationStore: control("configure"), control: control("produce"), custody: h.deps.store, verifier: h.verifier, readRights, loadInventory: h.deps.loadInventory, now: h.deps.now, schedule: SCHEDULE });
  const runtime = createOwnedServiceRuntime(h.deps, workflow, control("produce"));
  const handlers = createOwnedMonitoringHandlers({ origin: "https://fictional.invalid", scope: SCOPE, authenticateOwner: h.deps.authenticateOwner, workflow, recover: runtime.recover });
  database.bind(SCOPE, h.ownerKey, "cus_Fictional", "sub_Fictional"); h.setClock("2026-11-01T00:00:10Z");
  async function capture(day: number) {
    h.setClock(`2026-11-${String(day).padStart(2, "0")}T00:00:11Z`);
    const selected = await workflow.prepare(h.ownerKey, "capture");
    if (!selected.jobId) throw new Error("Fictional capture not ready");
    return runtime.run(producerRequest(), selected.jobId);
  }
  async function report(day: number) {
    h.setClock(`2026-11-${String(day).padStart(2, "0")}T00:01:11Z`);
    const selected = await workflow.prepare(h.ownerKey, "report");
    if (!selected.jobId) throw new Error("Fictional report not ready");
    const handle = await runtime.run(producerRequest(), selected.jobId);
    return { ...handle, coverage: selected.coverage, bytes: (await runtime.recover(ownerRequest(), handle.jobId))! };
  }
  return { h, database, provider, control, workflow, runtime, handlers, readRights, state, local, capture, report };
}
