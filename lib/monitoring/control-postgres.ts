import { z } from 'zod';
import type { SqlClient, SqlPool } from '@/lib/recovery/postgres-store';
import { MonitoringUnavailable, scopeSchema, type Scope } from './runtime';
import { canonicalJson, parseCanonical, sha256 } from './source-contract';
import { checkServiceJob } from './service-records';
import { CONTROL_ACCESS_SQL, CONTROL_DEFINITION_SQL } from './control-postgres-policy';
import { controlHash, controlEqual, ownedWatchlistId, watchlistInputSchema, watchlistRequestHash, validateWatchlist, validateCanonicalJob, billingBindingSchema, WatchlistConflict, type MonitoringControlStore, type ControlAccess, type SaveWatchlist, type Watchlist, type CanonicalJob } from './control-contract';

const LIMIT = 65536;
const unavailable = () => new MonitoringUnavailable('Monitoring control unavailable');
const prefix = 'account_id=$1 AND mode=$2 AND product_key=$3';
export const CONTROL_SQL = {
 begin: 'BEGIN ISOLATION LEVEL SERIALIZABLE', settings: 'SET LOCAL search_path=pg_catalog; SET LOCAL statement_timeout=5000; SET LOCAL lock_timeout=5000; SET LOCAL idle_in_transaction_session_timeout=5000', commit: 'COMMIT', rollback: 'ROLLBACK',
 head: `SELECT owner_key,watchlist_id,current_version,writer_role::text FROM everymcp_monitor_control.watchlist_heads WHERE ${prefix} AND owner_key=$4`,
 version: `SELECT owner_key,watchlist_id,version,mutation_id,request_sha256,config_sha256,writer_role::text,CASE WHEN octet_length(config_bytes)<=65536 THEN config_bytes END AS config_bytes FROM everymcp_monitor_control.watchlist_versions WHERE ${prefix} AND owner_key=$4 AND version=$5`,
 mutation: `SELECT owner_key,watchlist_id,version,mutation_id,request_sha256,config_sha256,writer_role::text,CASE WHEN octet_length(config_bytes)<=65536 THEN config_bytes END AS config_bytes FROM everymcp_monitor_control.watchlist_versions WHERE ${prefix} AND owner_key=$4 AND mutation_id=$5`,
 insertVersion: 'INSERT INTO everymcp_monitor_control.watchlist_versions (account_id,mode,product_key,owner_key,watchlist_id,version,mutation_id,request_sha256,config_sha256,config_bytes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) ON CONFLICT DO NOTHING',
 insertHead: 'INSERT INTO everymcp_monitor_control.watchlist_heads (account_id,mode,product_key,owner_key,watchlist_id,current_version) VALUES ($1,$2,$3,$4,$5,$6) ON CONFLICT DO NOTHING',
 advanceHead: `UPDATE everymcp_monitor_control.watchlist_heads SET current_version=$6 WHERE ${prefix} AND owner_key=$4 AND watchlist_id=$5 AND current_version=$7`,
 binding: `SELECT owner_key,customer_id,subscription_id,enabled FROM everymcp_monitor_control.billing_bindings WHERE ${prefix} AND owner_key=$4`,
 job: `SELECT owner_key,watchlist_id,version,job_id,job_sha256,writer_role::text,CASE WHEN octet_length(job_bytes)<=65536 THEN job_bytes END AS job_bytes FROM everymcp_monitor_control.canonical_jobs WHERE ${prefix} AND job_id=$4`,
 insertJob: 'INSERT INTO everymcp_monitor_control.canonical_jobs (account_id,mode,product_key,owner_key,watchlist_id,version,job_id,job_sha256,job_bytes) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT DO NOTHING',
} as const;
export type ControlPostgresConfiguration = { scope: Scope; access: ControlAccess; expectedDefinitionSha256: string };
function one(rows: Record<string, unknown>[]) { if (rows.length > 1) throw unavailable(); return rows[0] ?? null; }
function bytes(value: unknown) { if (!Buffer.isBuffer(value) || !value.length || value.length > LIMIT) throw unavailable(); return Buffer.from(value); }
function encoded(value: unknown) { const result = canonicalJson(value); if (!result.length || result.length > LIMIT) throw unavailable(); return result; }

export class PostgresMonitoringControlStore implements MonitoringControlStore {
 readonly scope: Scope;
 private readonly access: ControlAccess;
 private readonly definition: string;
 constructor(private readonly pool: SqlPool, config: ControlPostgresConfiguration) {
  this.scope = Object.freeze(scopeSchema.parse(config.scope)); this.access = z.enum(['configure','produce','recover']).parse(config.access); this.definition = controlHash.parse(config.expectedDefinitionSha256);
 }
 private params() { return [this.scope.accountId,this.scope.mode,this.scope.productKey]; }
 private require(access: ControlAccess) { if (this.access !== access) throw unavailable(); }
 private async transaction<T>(fn: (client: SqlClient) => Promise<T>): Promise<T> {
  for (let attempt=0;;attempt++) {
   let client: SqlClient;
   try { client = await this.pool.connect(); } catch { throw unavailable(); }
   let discard: Error | undefined;
   try {
    await client.query(CONTROL_SQL.begin); await client.query(CONTROL_SQL.settings);
    const access = one((await client.query(CONTROL_ACCESS_SQL,[...this.params(),this.access])).rows);
    const expected = { configure:'everymcp_monitor_configurator', produce:'everymcp_monitor_job_writer', recover:'everymcp_monitor_control_recovery' }[this.access];
    if (!access || access.ready !== true || access.role_name !== expected) throw unavailable();
    const definition = one((await client.query(CONTROL_DEFINITION_SQL)).rows);
    if (!definition || definition.definition_sha256 !== this.definition) throw unavailable();
    const result = await fn(client); await client.query(CONTROL_SQL.commit); return result;
   } catch (error) {
    discard = error instanceof Error ? error : unavailable(); await client.query(CONTROL_SQL.rollback).catch(() => {});
    if (error instanceof WatchlistConflict) throw error;
    const code = (error as {code?: unknown} | null)?.code;
    if (attempt >= 2 || (code !== '40001' && code !== '40P01')) throw unavailable();
   } finally { client.release(discard); }
  }
 }
 private decodeVersion(row: Record<string,unknown>, owner: string): Watchlist {
  const raw=bytes(row.config_bytes), value=validateWatchlist(parseCanonical(raw,LIMIT),this.scope);
  if (!raw.equals(encoded(value)) || row.config_sha256!==sha256(raw) || row.owner_key!==owner || value.ownerKey!==owner || row.watchlist_id!==value.watchlistId || row.version!==value.version || row.mutation_id!==value.mutationId || row.request_sha256!==value.requestSha256 || row.writer_role!=='everymcp_monitor_configurator') throw unavailable();
  return value;
 }
 private async readVersion(client: SqlClient, owner: string, version: number) {
  const row=one((await client.query(CONTROL_SQL.version,[...this.params(),owner,version])).rows); return row ? this.decodeVersion(row,owner) : null;
 }
 private async readHead(client: SqlClient, owner: string) {
  const row=one((await client.query(CONTROL_SQL.head,[...this.params(),owner])).rows); if (!row) return null;
  if (row.owner_key!==owner || row.watchlist_id!==ownedWatchlistId(this.scope,owner) || !Number.isInteger(row.current_version) || (row.current_version as number)<1 || row.writer_role!=='everymcp_monitor_configurator') throw unavailable();
  const value=await this.readVersion(client,owner,row.current_version as number);
  if (!value || value.watchlistId!==row.watchlist_id) throw unavailable(); return value;
 }
 async getWatchlist(ownerKey: string) { const owner=controlHash.parse(ownerKey); return this.transaction(c=>this.readHead(c,owner)); }
 async getMutation(ownerKey: string, mutationId: string) { const owner=controlHash.parse(ownerKey); const id=z.string().uuid().parse(mutationId); return this.transaction(async c=>{ const row=one((await c.query(CONTROL_SQL.mutation,[...this.params(),owner,id])).rows); return row ? this.decodeVersion(row,owner) : null; }); }
 async getVersion(ownerKey: string, version: number) { const owner=controlHash.parse(ownerKey); z.number().int().min(1).max(2147483647).parse(version); return this.transaction(c=>this.readVersion(c,owner,version)); }
 async saveWatchlist(input: SaveWatchlist) {
  this.require('configure'); const owner=controlHash.parse(input.ownerKey); const parsed=watchlistInputSchema.parse({expectedVersion:input.expectedVersion,mutationId:input.mutationId,slugs:input.slugs,enabled:input.enabled});
  const request=watchlistRequestHash(input);
  const value=validateWatchlist({scope:this.scope,ownerKey:owner,watchlistId:ownedWatchlistId(this.scope,owner),version:parsed.expectedVersion+1,mutationId:parsed.mutationId,requestSha256:request,slugs:parsed.slugs,enabled:parsed.enabled,configuredAt:input.configuredAt,inventorySha256:input.inventorySha256,sourceUrls:input.sourceUrls},this.scope);
  const raw=encoded(value);
  return this.transaction(async c=>{
   const replay=one((await c.query(CONTROL_SQL.mutation,[...this.params(),owner,parsed.mutationId])).rows);
   if (replay) { const old=this.decodeVersion(replay,owner); if (old.requestSha256!==request) throw new WatchlistConflict('Watchlist conflict'); return old; }
   const current=await this.readHead(c,owner);
   if ((current?.version ?? 0)!==parsed.expectedVersion) throw new WatchlistConflict('Watchlist conflict');
   await c.query(CONTROL_SQL.insertVersion,[...this.params(),owner,value.watchlistId,value.version,value.mutationId,request,sha256(raw),raw]);
   if (current) await c.query(CONTROL_SQL.advanceHead,[...this.params(),owner,value.watchlistId,value.version,current.version]);
   else await c.query(CONTROL_SQL.insertHead,[...this.params(),owner,value.watchlistId,value.version]);
   const saved=await this.readHead(c,owner); if (!saved || !controlEqual(saved,value)) throw new WatchlistConflict('Watchlist conflict'); return saved;
  });
 }
 private async readBinding(c: SqlClient,owner: string) {
  const row=one((await c.query(CONTROL_SQL.binding,[...this.params(),owner])).rows); if (!row) return null;
  const value=billingBindingSchema.parse({scope:this.scope,ownerKey:row.owner_key,customerId:row.customer_id,subscriptionId:row.subscription_id,enabled:row.enabled});
  if (value.ownerKey!==owner) throw unavailable(); return value;
 }
 async getBinding(ownerKey: string) { if (this.access === 'configure') throw unavailable(); const owner=controlHash.parse(ownerKey); return this.transaction(c=>this.readBinding(c,owner)); }
 private async readJob(c: SqlClient,id: string): Promise<CanonicalJob | null> {
  const row=one((await c.query(CONTROL_SQL.job,[...this.params(),id])).rows); if (!row) return null;
  const raw=bytes(row.job_bytes), job=validateCanonicalJob(parseCanonical(raw,LIMIT),this.scope);
  checkServiceJob(job.job,job.createdAt);
  if (Date.parse(job.createdAt)<Date.parse(job.job.periodEnd) || Date.parse(job.expiresAt)>Date.parse(job.job.periodEnd)+86400000) throw unavailable();
  if (!raw.equals(encoded(job)) || row.job_sha256!==sha256(raw) || row.job_id!==id || job.jobId!==id || row.owner_key!==job.job.ownerKey || row.watchlist_id!==job.job.watchlistId || row.version!==job.job.version || row.writer_role!=='everymcp_monitor_job_writer') throw unavailable(); return job;
 }
 async getCanonicalJob(id: string) { if (this.access === 'configure') throw unavailable(); controlHash.parse(id); return this.transaction(c=>this.readJob(c,id)); }
 async putCanonicalJob(input: CanonicalJob) {
  this.require('produce'); const value=validateCanonicalJob(input,this.scope), raw=encoded(value);
  checkServiceJob(value.job,value.createdAt);
  if (Date.parse(value.createdAt)<Date.parse(value.job.periodEnd) || Date.parse(value.expiresAt)>Date.parse(value.job.periodEnd)+86400000) throw unavailable();
  return this.transaction(async c=>{
   const existing=await this.readJob(c,value.jobId); if (existing) { if (!controlEqual(existing.job,value.job)) throw unavailable(); return existing; }
   const watch=await this.readHead(c,value.job.ownerKey), binding=await this.readBinding(c,value.job.ownerKey);
   if (!watch || !watch.enabled || watch.version!==value.job.version || watch.watchlistId!==value.job.watchlistId || sha256(encoded(watch))!==value.watchlistSha256 || watch.inventorySha256!==value.inventorySha256 || !controlEqual(watch.slugs,value.job.slugs) || (value.job.kind==='capture' && !controlEqual(value.job.sourceUrls,watch.sourceUrls)) || Date.parse(value.job.periodStart)<Date.parse(value.authorization.periodStart) || Date.parse(value.job.periodEnd)>Date.parse(value.authorization.periodEnd) || !binding || !binding.enabled || binding.customerId!==value.authorization.customerId || binding.subscriptionId!==value.authorization.subscriptionId) throw unavailable();
   await c.query(CONTROL_SQL.insertJob,[...this.params(),value.job.ownerKey,value.job.watchlistId,value.job.version,value.jobId,sha256(raw),raw]);
   const winner=await this.readJob(c,value.jobId); if (!winner || !controlEqual(winner.job,value.job)) throw unavailable(); return winner;
  });
 }
}
