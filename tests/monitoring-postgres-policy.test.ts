/** Static query/proposal regression only. These tests do not execute SQL or prove RLS. */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { CUSTODY_ACCESS_SQL, CUSTODY_DEFINITION_SQL } from "../lib/monitoring/postgres-policy";
describe("custody SQL security contract source", () => {
  it("rejects unmodeled triggers, rewrite rules, and both directions of table inheritance", () => {
    expect(CUSTODY_ACCESS_SQL).toContain("NOT EXISTS (SELECT 1 FROM pg_trigger tr JOIN target t ON t.oid=tr.tgrelid WHERE NOT tr.tgisinternal)");
    expect(CUSTODY_ACCESS_SQL).toContain("NOT EXISTS (SELECT 1 FROM pg_rewrite rw JOIN target t ON t.oid=rw.ev_class)");
    expect(CUSTODY_ACCESS_SQL).toContain("NOT EXISTS (SELECT 1 FROM pg_inherits i JOIN target t ON t.oid=i.inhparent OR t.oid=i.inhrelid)");
  });
  it("checks effective MAINTAIN rights only on supported PostgreSQL versions", () => {
    const expressions = [...CUSTODY_ACCESS_SQL.matchAll(/'([^']+)' \|\| CASE WHEN current_setting\('server_version_num'\)::integer>=170000 THEN ',MAINTAIN' ELSE '' END/g)];
    expect(expressions).toHaveLength(2);
    for (const version of [150000, 160000, 170000, 180000]) for (const expression of expressions) {
      const privileges = expression[1] + (version >= 170000 ? ",MAINTAIN" : "");
      expect(privileges.includes("MAINTAIN")).toBe(version >= 170000);
      expect(privileges).toContain("UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER");
    }
  });
  it("fingerprints policy expressions, columns/defaults, constraints and valid indexes while the proposal remains unbound", () => {
    for (const part of ["pg_get_expr(p.polqual", "pg_get_expr(p.polwithcheck", "p.polroles", "p.polpermissive", "a.attnotnull", "pg_get_expr(d.adbin", "pg_get_constraintdef", "c.convalidated", "x.indisvalid", "pg_get_indexdef"]) expect(CUSTODY_DEFINITION_SQL).toContain(part);
    const proposal = readFileSync("documents/monitoring-custody.proposal.sql", "utf8");
    expect(proposal.trim().endsWith("ROLLBACK;")).toBe(true);
    expect(proposal).toContain("NOLOGIN NOINHERIT"); expect(proposal).toContain("FORCE ROW LEVEL SECURITY");
    expect(proposal).not.toMatch(/INSERT INTO everymcp_monitoring\.role_bindings|CREATE EXTENSION|SECURITY DEFINER|PASSWORD\s*'/);
    expect(proposal).toContain("FOR INSERT TO everymcp_monitor_producer");
    expect(proposal).not.toMatch(/GRANT .* TO (?:anon|authenticated|service_role)/);
  });
});
