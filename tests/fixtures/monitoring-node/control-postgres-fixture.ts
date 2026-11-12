/** Fictional in-memory SQL protocol model; not a PostgreSQL isolation test. */
import type { SqlClient, SqlPool } from '../../../lib/recovery/postgres-store';
import { CONTROL_SQL } from '../../../lib/monitoring/control-postgres';
import { SCOPE } from './runtime-fixture';
import { CONTROL_ACCESS_SQL, CONTROL_DEFINITION_SQL } from '../../../lib/monitoring/control-postgres-policy';
export const DEFINITION = 'a'.repeat(64);
type Row = Record<string, unknown>;
const key = (v: unknown[]) => JSON.stringify(v);
export class FictionalControl {
 readonly heads = new Map<string, Row>(); readonly versions = new Map<string, Row>(); readonly jobs = new Map<string, Row>(); readonly bindings = new Map<string, Row>();
 ready = true; definition = DEFINITION; acquisitions = 0; duplicateBinding = false;
 readonly calls: { access: string; sql: string; values: unknown[] }[] = []; readonly releases: (Error | undefined)[] = [];
 failNext: { sql: string; code: string; afterCommit?: boolean } | null = null;
 private queue: Promise<void> = Promise.resolve();
 pool(access: 'configure'|'produce'|'recover'): SqlPool {
  const model=this;
  return { async connect() {
   model.acquisitions++;
   type Maps = {heads: Map<string,Row>; versions: Map<string,Row>; jobs: Map<string,Row>; bindings: Map<string,Row>};
   let draft: Maps | null=null, unlock: (()=>void) | undefined;
   const copy=(m: Map<string,Row>)=>new Map([...m].map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([a,b])=>[a,Buffer.isBuffer(b)?Buffer.from(b):b]))]));
   const end=()=>{ draft=null; unlock?.(); unlock=undefined; };
   const client = { async query(sql: string, values: unknown[] = []) {
    model.calls.push({access,sql,values});
    const fault=model.failNext?.sql===sql ? model.failNext : null;
    if (fault) model.failNext=null;
    if (fault && !fault.afterCommit) throw Object.assign(new Error('Fictional fault'),{code:fault.code});
    if(sql===CONTROL_SQL.begin) { const prior=model.queue; model.queue=new Promise<void>(resolve=>{unlock=resolve;}); await prior; draft={heads:copy(model.heads),versions:copy(model.versions),jobs:copy(model.jobs),bindings:copy(model.bindings)}; return {rows:[]}; }
    if(sql===CONTROL_SQL.rollback) {end(); return {rows:[]};}
    if (!draft) throw new Error('Transaction missing');
    if(sql===CONTROL_SQL.commit) { for(const name of ['heads','versions','jobs','bindings'] as const) {model[name].clear(); for(const [k,v] of draft[name]) model[name].set(k,v);} end(); if(fault?.afterCommit) throw Object.assign(new Error('Fictional lost acknowledgement'),{code:fault.code}); return {rows:[]}; }
    const state=draft;
    const scope=values.slice(0,3), owner=values[3]; let rows: Row[]=[];
    const get=(map: Map<string,Row>, parts: unknown[]) => { const r=map.get(key(parts)); return r ? [{...r}] : []; };
    if (sql===CONTROL_ACCESS_SQL) rows=[{ready:model.ready && values[0]===SCOPE.accountId && values[1]===SCOPE.mode && values[2]===SCOPE.productKey && values[3]===access,role_name:{configure:'everymcp_monitor_configurator',produce:'everymcp_monitor_job_writer',recover:'everymcp_monitor_control_recovery'}[access]}];
    else if (sql===CONTROL_DEFINITION_SQL) rows=[{definition_sha256:model.definition}];
    else if (sql===CONTROL_SQL.head) rows=get(state.heads,[...scope,owner]);
    else if (sql===CONTROL_SQL.version) rows=get(state.versions,[...scope,owner,values[4]]);
    else if (sql===CONTROL_SQL.mutation) rows=[...state.versions.entries()].filter(([k,v])=>k.startsWith(JSON.stringify([...scope,owner]).slice(0,-1)+',') && v.mutation_id===values[4]).map(([,v])=>({...v}));
    else if ([CONTROL_SQL.insertVersion,CONTROL_SQL.insertHead,CONTROL_SQL.advanceHead].includes(sql as never) && access!=='configure') throw Object.assign(new Error('Denied'),{code:'42501'});
    else if (sql===CONTROL_SQL.insertJob && access!=='produce') throw Object.assign(new Error('Denied'),{code:'42501'});
    else if ([CONTROL_SQL.binding,CONTROL_SQL.job].includes(sql as never) && access==='configure') throw Object.assign(new Error('Denied'),{code:'42501'});
    else if (sql===CONTROL_SQL.insertVersion) { const k=key([...scope,owner,values[5]]); if(!state.versions.has(k)) state.versions.set(k,{owner_key:owner,watchlist_id:values[4],version:values[5],mutation_id:values[6],request_sha256:values[7],config_sha256:values[8],config_bytes:values[9],writer_role:'everymcp_monitor_configurator'}); }
    else if (sql===CONTROL_SQL.insertHead) { const k=key([...scope,owner]); if(!state.heads.has(k)) state.heads.set(k,{owner_key:owner,watchlist_id:values[4],current_version:values[5],writer_role:'everymcp_monitor_configurator'}); }
    else if (sql===CONTROL_SQL.advanceHead) { const r=state.heads.get(key([...scope,owner])); if(r && r.watchlist_id===values[4] && r.current_version===values[6]) r.current_version=values[5]; }
    else if (sql===CONTROL_SQL.binding) { rows=get(state.bindings,[...scope,owner]); if(model.duplicateBinding && rows.length) rows.push({...rows[0],subscription_id:'sub_conflicting'}); }
    else if (sql===CONTROL_SQL.job) rows=get(state.jobs,[...scope,owner]);
    else if (sql===CONTROL_SQL.insertJob) { const k=key([...scope,values[6]]); if(!state.jobs.has(k)) state.jobs.set(k,{owner_key:owner,watchlist_id:values[4],version:values[5],job_id:values[6],job_sha256:values[7],job_bytes:values[8],writer_role:'everymcp_monitor_job_writer'}); }
    else if (![CONTROL_SQL.begin,CONTROL_SQL.settings,CONTROL_SQL.commit,CONTROL_SQL.rollback].includes(sql as never)) throw new Error('Unexpected fixture query');
    return { rows };
   }, release(error?: Error) { model.releases.push(error); end(); } };
   return client as SqlClient;
  } };
 }
 bind(scope: {accountId:string;mode:string;productKey:string},owner: string, customer='cus_fixture', subscription='sub_fixture') { this.bindings.set(key([scope.accountId,scope.mode,scope.productKey,owner]),{owner_key:owner,customer_id:customer,subscription_id:subscription,enabled:true}); }
}
