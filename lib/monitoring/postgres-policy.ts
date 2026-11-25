/** Deny-only inspection; no provisioning, mutation, or assumption of readiness. */
export const CUSTODY_ACCESS_SQL = `
WITH expected(table_name, columns) AS (VALUES
 ('role_bindings', ARRAY['role_name','account_id','mode','product_key','access_kind','contract_version']::text[]),
 ('execution_starts', ARRAY['account_id','mode','product_key','execution_id','nonce','job_id','owner_key','start_sha256','start_bytes','writer_role']::text[]),
 ('execution_completions', ARRAY['account_id','mode','product_key','execution_id','job_id','owner_key','start_sha256','receipt_id','receipt_bytes','source_bytes','report_bytes','source_sha256','report_sha256','report_length','writer_role']::text[]),
 ('job_commits', ARRAY['account_id','mode','product_key','job_id','owner_key','receipt_id','job_sha256','job_bytes','writer_role']::text[])
), target AS (
 SELECT c.oid,c.relname,c.relowner,c.relrowsecurity,c.relforcerowsecurity,c.relkind,e.columns
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN expected e ON e.table_name=c.relname
 WHERE n.nspname='everymcp_monitoring'
), role_check AS (
 SELECT r.* FROM pg_roles r WHERE r.rolname=current_user
)
SELECT current_user::text AS role_name, COALESCE((
 SELECT current_user=session_user
 AND current_user=CASE $4::text WHEN 'producer' THEN 'everymcp_monitor_producer' WHEN 'recovery' THEN 'everymcp_monitor_recovery' ELSE '' END
 AND NOT r.rolsuper AND NOT r.rolinherit AND NOT r.rolbypassrls AND NOT r.rolcreatedb AND NOT r.rolcreaterole AND NOT r.rolreplication
 AND NOT EXISTS (SELECT 1 FROM pg_auth_members m WHERE m.member=r.oid)
 AND NOT has_database_privilege(current_user,current_database(),'CREATE')
 AND EXISTS (SELECT 1 FROM everymcp_monitoring.role_bindings b WHERE b.role_name=current_user AND b.account_id=$1 AND b.mode=$2 AND b.product_key=$3 AND b.access_kind=$4 AND b.contract_version=1)
 AND has_schema_privilege(current_user,'everymcp_monitoring','USAGE') AND NOT has_schema_privilege(current_user,'everymcp_monitoring','CREATE')
 AND (SELECT count(*)=4 FROM target)
 AND NOT EXISTS (SELECT 1 FROM target t WHERE t.relkind<>'r' OR NOT t.relrowsecurity OR NOT t.relforcerowsecurity OR pg_get_userbyid(t.relowner)<>'everymcp_monitor_owner' OR t.relowner=r.oid
   OR NOT has_table_privilege(current_user,t.oid,'SELECT')
   OR has_table_privilege(current_user,t.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER' || CASE WHEN current_setting('server_version_num')::integer>=170000 THEN ',MAINTAIN' ELSE '' END)
   OR (SELECT COALESCE(array_agg(a.attname::text ORDER BY a.attname::text),ARRAY[]::text[]) FROM pg_attribute a WHERE a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped) <> (SELECT array_agg(x ORDER BY x) FROM unnest(t.columns) x))
 AND NOT EXISTS (SELECT 1 FROM target t JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped WHERE
   NOT has_column_privilege(current_user,t.oid,a.attnum,'SELECT')
   OR has_column_privilege(current_user,t.oid,a.attnum,'UPDATE,REFERENCES')
   OR has_column_privilege(current_user,t.oid,a.attnum,'INSERT') <> ($4='producer' AND t.relname<>'role_bindings' AND a.attname<>'writer_role'))
 AND NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='everymcp_monitoring' AND c.relkind IN ('r','p','v','m','f','S') AND NOT EXISTS(SELECT 1 FROM target t WHERE t.oid=c.oid))
 AND NOT EXISTS (SELECT 1 FROM pg_trigger tr JOIN target t ON t.oid=tr.tgrelid WHERE NOT tr.tgisinternal)
 AND NOT EXISTS (SELECT 1 FROM pg_rewrite rw JOIN target t ON t.oid=rw.ev_class)
 AND NOT EXISTS (SELECT 1 FROM pg_inherits i JOIN target t ON t.oid=i.inhparent OR t.oid=i.inhrelid)
 AND NOT EXISTS (SELECT 1 FROM pg_namespace n WHERE n.nspname NOT IN ('pg_catalog','information_schema','everymcp_monitoring') AND n.nspname NOT LIKE 'pg_%' AND has_schema_privilege(current_user,n.oid,'CREATE'))
 AND NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema','everymcp_monitoring') AND n.nspname NOT LIKE 'pg_%' AND has_schema_privilege(current_user,n.oid,'USAGE') AND ((c.relkind IN ('r','p','v','m','f') AND (has_table_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER' || CASE WHEN current_setting('server_version_num')::integer>=170000 THEN ',MAINTAIN' ELSE '' END) OR has_any_column_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) OR (c.relkind='S' AND has_sequence_privilege(current_user,c.oid,'USAGE,SELECT,UPDATE'))))
 AND NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.prosecdef AND n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_%' AND has_schema_privilege(current_user,n.oid,'USAGE') AND has_function_privilege(current_user,p.oid,'EXECUTE'))
 FROM role_check r
),false) AS ready`;

// The caller must compare this to an independently reviewed, installation-specific
// fingerprint. Never trust a value learned from this same query as the expected value.
export const CUSTODY_DEFINITION_SQL = `
WITH tables AS (
 SELECT c.oid,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity,
        pg_get_userbyid(c.relowner) AS owner
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='everymcp_monitoring' AND c.relname IN ('role_bindings','execution_starts','execution_completions','job_commits')
), metadata AS (
 SELECT jsonb_build_object(
  'tables', COALESCE((SELECT jsonb_agg(jsonb_build_array(t.relname,t.relkind,t.owner,t.relrowsecurity,t.relforcerowsecurity) ORDER BY t.relname) FROM tables t),'[]'::jsonb),
  'columns', COALESCE((SELECT jsonb_agg(jsonb_build_array(t.relname,a.attnum,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_get_expr(d.adbin,d.adrelid)) ORDER BY t.relname,a.attnum)
    FROM tables t JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum),'[]'::jsonb),
  'constraints', COALESCE((SELECT jsonb_agg(jsonb_build_array(t.relname,c.conname,c.contype,c.convalidated,c.condeferrable,c.condeferred,pg_get_constraintdef(c.oid,true)) ORDER BY t.relname,c.conname)
    FROM tables t JOIN pg_constraint c ON c.conrelid=t.oid),'[]'::jsonb),
  'indexes', COALESCE((SELECT jsonb_agg(jsonb_build_array(t.relname,i.relname,x.indisvalid,x.indisready,x.indislive,x.indisunique,x.indisprimary,pg_get_indexdef(i.oid)) ORDER BY t.relname,i.relname)
    FROM tables t JOIN pg_index x ON x.indrelid=t.oid JOIN pg_class i ON i.oid=x.indexrelid),'[]'::jsonb),
  'policies', COALESCE((SELECT jsonb_agg(jsonb_build_array(t.relname,p.polname,p.polcmd,p.polpermissive,
    (SELECT jsonb_agg(CASE WHEN role_id=0 THEN 'PUBLIC' ELSE COALESCE(pg_get_userbyid(role_id),'UNKNOWN') END ORDER BY CASE WHEN role_id=0 THEN 'PUBLIC' ELSE COALESCE(pg_get_userbyid(role_id),'UNKNOWN') END) FROM unnest(p.polroles) role_id),
    pg_get_expr(p.polqual,p.polrelid),pg_get_expr(p.polwithcheck,p.polrelid)) ORDER BY t.relname,p.polname)
    FROM tables t JOIN pg_policy p ON p.polrelid=t.oid),'[]'::jsonb)
 ) AS value
)
SELECT encode(sha256(convert_to(value::text,'UTF8')),'hex') AS definition_sha256 FROM metadata`;
