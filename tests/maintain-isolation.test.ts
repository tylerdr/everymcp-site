import { expect, it, vi } from "vitest";
import { databaseIsolationSql, PostgresStore, type SqlClient } from "../lib/recovery/postgres-store";

// SQL-contract/adapter fixtures, not native PostgreSQL privilege evidence.
// Evaluate only the version-selected privilege argument sent by the real guard.
function requestedPrivileges(version: number) {
  const expression = databaseIsolationSql.match(/has_table_privilege\(current_user,c\.oid,\s*'([^']+)'\s*\|\|\s*CASE WHEN current_setting\('server_version_num'\)::integer >= (\d+) THEN '([^']*)' ELSE '([^']*)' END\)/);
  if (!expression) throw new Error("Unrecognized version-compatible effective privilege expression");
  const privileges = (expression[1] + (version >= Number(expression[2]) ? expression[3] : expression[4])).split(",");
  if (version < 170000 && privileges.includes("MAINTAIN")) throw new Error("Older PostgreSQL rejects MAINTAIN");
  return privileges;
}
function fixture(version: number, grants: { direct?: string[]; public?: string[] }) {
  const calls: string[] = [];
  const release = vi.fn();
  const query: SqlClient["query"] = async <Row,>(sql: string) => {
    calls.push(sql);
    let rows: unknown[] = [];
    if (sql === databaseIsolationSql) {
      // Effective rights are direct UNION PUBLIC even when the role is NOINHERIT.
      const effective = new Set([...(grants.direct || []), ...(grants.public || [])]);
      rows = [{isolated: !requestedPrivileges(version).some(p => effective.has(p))}];
    } else if (sql.includes("AS ready")) rows = [{ready:true}];
    return {rows:rows as Row[]};
  };
  return {calls,release,store:new PostgresStore({connect:async()=>({query,release})},{accountId:"acct_synthetic",mode:"test"})};
}
it.each([170000,170011,180000])("PG%s rejects dedicated-role MAINTAIN-only rights before receipt access",async version=>{
  const f=fixture(version,{direct:["MAINTAIN"]}), callback=vi.fn();
  await expect(f.store.transaction(callback)).rejects.toThrow("Cross-product store isolation");
  expect(callback).not.toHaveBeenCalled();expect(f.calls).toEqual(["BEGIN ISOLATION LEVEL SERIALIZABLE",databaseIsolationSql,"ROLLBACK"]);expect(f.release).toHaveBeenCalledOnce();
});
it("PG17 rejects PUBLIC-derived MAINTAIN-only access before readiness INSERT",async()=>{
 const f=fixture(170011,{public:["MAINTAIN"]});expect(await f.store.checkReadiness()).toBe(false);
 expect(f.calls).toEqual(["BEGIN ISOLATION LEVEL SERIALIZABLE",databaseIsolationSql,"ROLLBACK"]);
});
it.each([150000,160000])("PG%s never sends unsupported MAINTAIN and retains existing SELECT denial",async version=>{
 const f=fixture(version,{public:["SELECT"]});await expect(f.store.transaction(()=>true)).rejects.toThrow("Cross-product store isolation");
 expect(requestedPrivileges(version)).not.toContain("MAINTAIN");
});
it("PG17 clean effective ACL proceeds through existing permission checks without altering ACLs",async()=>{
 const f=fixture(170011,{});expect(await f.store.transaction(()=>"clean")).toBe("clean");
 expect(f.calls.at(-1)).toBe("COMMIT");expect(f.calls.some(sql=>/^(GRANT|REVOKE|ALTER|CREATE)/.test(sql))).toBe(false);
});
