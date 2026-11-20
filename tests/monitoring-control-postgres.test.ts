import { describe, expect, it } from 'vitest';
import { CONTROL_SQL, PostgresMonitoringControlStore } from '../lib/monitoring/control-postgres';
import { RIGHTS_POLICY, WatchlistConflict } from '../lib/monitoring/control-contract';
import { serviceJobIdentity } from '../lib/monitoring/service-records';
import { canonicalJson, sha256 } from '../lib/monitoring/source-contract';
import { FictionalControl, DEFINITION } from './fixtures/monitoring-node/control-postgres-fixture';
import { SCOPE } from './fixtures/monitoring-node/runtime-fixture';

const owner='a'.repeat(64), inventory='b'.repeat(64);
const input = { ownerKey:owner, expectedVersion:0, mutationId:'11111111-1111-4111-8111-111111111111', slugs:['example-mcp'], enabled:true, configuredAt:'2026-11-12T00:00:00Z', inventorySha256:inventory, sourceUrls:['https://github.com/example/mcp'] };
function store(db: FictionalControl, access: 'configure'|'produce'|'recover') { return new PostgresMonitoringControlStore(db.pool(access),{scope:SCOPE,access,expectedDefinitionSha256:DEFINITION}); }

describe('fictional monitoring control SQL adapter',()=>{
 it('stores immutable versions and returns original mutation replays',async()=>{
  const db=new FictionalControl(), config=store(db,'configure');
  const first=await config.saveWatchlist(input);
  expect(await config.getWatchlist(owner)).toEqual(first);
  expect(await config.getMutation(owner,input.mutationId)).toEqual(first);
  expect(await config.getMutation('c'.repeat(64),input.mutationId)).toBeNull();
  expect(await config.saveWatchlist({...input, configuredAt:'2026-11-13T00:00:00Z'})).toEqual(first);
  await expect(config.saveWatchlist({...input, enabled:false})).rejects.toBeInstanceOf(WatchlistConflict);
  await expect(config.saveWatchlist({...input, mutationId:'22222222-2222-4222-8222-222222222222'})).rejects.toBeInstanceOf(WatchlistConflict);
  const next=await config.saveWatchlist({...input,expectedVersion:1,mutationId:'22222222-2222-4222-8222-222222222222',enabled:false});
  expect(next.version).toBe(2); expect(await config.getVersion(owner,1)).toEqual(first);
 });
 it('requires current enabled watchlist and binding; preserves original job on retry',async()=>{
  const db=new FictionalControl(), config=store(db,'configure'), writer=store(db,'produce');
  const watch=await config.saveWatchlist(input); db.bind(SCOPE,owner);
  const job={scope:SCOPE,ownerKey:owner,watchlistId:watch.watchlistId,version:1,slugs:watch.slugs,periodStart:'2026-11-01T00:00:00Z',periodEnd:'2026-11-12T00:00:00Z',kind:'capture' as const,sourceUrls:watch.sourceUrls,receiptIds:[]};
  const record={jobId:serviceJobIdentity(job),job,watchlistSha256:sha256(canonicalJson(watch)),inventorySha256:inventory,coverage:{expectedPeriods:0,availablePeriods:0,missingPeriodEnds:[],state:'complete' as const},createdAt:'2026-11-12T00:00:00Z',expiresAt:'2026-11-12T01:00:00Z',authorization:{policy:RIGHTS_POLICY as typeof RIGHTS_POLICY,scope:SCOPE,ownerKey:owner,customerId:'cus_fixture',subscriptionId:'sub_fixture',invoiceId:'in_fixture',periodStart:job.periodStart,periodEnd:job.periodEnd}};
  const rival={...record,authorization:{...record.authorization,invoiceId:'in_other'}};
  const winners=await Promise.all([writer.putCanonicalJob(record),writer.putCanonicalJob(rival)]);
  expect(winners[0]).toEqual(winners[1]);
  expect(await writer.putCanonicalJob(rival)).toEqual(winners[0]);
  expect(await store(db,'recover').getCanonicalJob(record.jobId)).toEqual(winners[0]);
  const other={...record,job:{...job,version:2}}; other.jobId=serviceJobIdentity(other.job);
  await expect(writer.putCanonicalJob(other)).rejects.toThrow();
 });
 it('recovers a lost commit response by replay and isolates scope',async()=>{
  const db=new FictionalControl(), config=store(db,'configure'); db.failNext={sql:CONTROL_SQL.commit,code:'08006',afterCommit:true};
  await expect(config.saveWatchlist(input)).rejects.toThrow();
  expect(db.calls.filter(call=>call.sql===CONTROL_SQL.insertVersion)).toHaveLength(1);
  expect((await config.saveWatchlist(input)).version).toBe(1);
  const other=new PostgresMonitoringControlStore(db.pool('recover'),{scope:{...SCOPE,accountId:'acct_other'},access:'recover',expectedDefinitionSha256:DEFINITION});
  await expect(other.getWatchlist(owner)).rejects.toThrow();
 });
 it('serializes competing changes with no orphan and detects stored corruption',async()=>{
  const db=new FictionalControl(), config=store(db,'configure'); await config.saveWatchlist(input);
  const a={...input,expectedVersion:1,mutationId:'22222222-2222-4222-8222-222222222222'};
  const b={...input,expectedVersion:1,mutationId:'33333333-3333-4333-8333-333333333333',enabled:false};
  const result=await Promise.allSettled([config.saveWatchlist(a),config.saveWatchlist(b)]);
  expect(result.filter(x=>x.status==='fulfilled')).toHaveLength(1);
  expect(result.filter(x=>x.status==='rejected')).toHaveLength(1);
  expect(db.versions.size).toBe(2);
  const saved=[...db.versions.values()][0]; saved.config_sha256='0'.repeat(64);
  await expect(config.getVersion(owner,1)).rejects.toThrow();
 });
 it('denies role writes and unready guard before data access',async()=>{
  const db=new FictionalControl();
  await expect(store(db,'recover').saveWatchlist(input)).rejects.toThrow(); expect(db.acquisitions).toBe(0);
  await expect(store(db,'configure').getBinding(owner)).rejects.toThrow();
  await expect(store(db,'configure').getCanonicalJob('a'.repeat(64))).rejects.toThrow();
  expect(db.acquisitions).toBe(0);
  db.ready=false; await expect(store(db,'configure').getWatchlist(owner)).rejects.toThrow();
  db.ready=true; db.definition='f'.repeat(64); await expect(store(db,'configure').getWatchlist(owner)).rejects.toThrow();
 });
});
