/** Deny-only control-store guard. No installation, repair, or public grant changes. */
export const CONTROL_ACCESS_SQL = `
WITH expected(table_name,columns) AS (VALUES
 ('role_bindings',ARRAY['role_name','account_id','mode','product_key','access_kind','contract_version']::text[]),
 ('watchlist_heads',ARRAY['account_id','mode','product_key','owner_key','watchlist_id','current_version','writer_role']::text[]),
 ('watchlist_versions',ARRAY['account_id','mode','product_key','owner_key','watchlist_id','version','mutation_id','request_sha256','config_sha256','config_bytes','writer_role']::text[]),
 ('canonical_jobs',ARRAY['account_id','mode','product_key','owner_key','watchlist_id','version','job_id','job_sha256','job_bytes','writer_role']::text[]),
 ('billing_bindings',ARRAY['account_id','mode','product_key','owner_key','customer_id','subscription_id','enabled']::text[])
), target AS (
 SELECT c.*,e.columns,($4<>'configure' OR c.relname IN ('role_bindings','watchlist_heads','watchlist_versions')) AS readable
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace JOIN expected e ON e.table_name=c.relname
 WHERE n.nspname='everymcp_monitor_control'
), role_check AS (SELECT * FROM pg_roles WHERE rolname=current_user)
SELECT current_user::text AS role_name, COALESCE((SELECT
 current_user=session_user
 AND current_user=CASE $4::text WHEN 'configure' THEN 'everymcp_monitor_configurator' WHEN 'produce' THEN 'everymcp_monitor_job_writer' WHEN 'recover' THEN 'everymcp_monitor_control_recovery' ELSE '' END
 AND NOT r.rolsuper AND NOT r.rolinherit AND NOT r.rolbypassrls AND NOT r.rolcreatedb AND NOT r.rolcreaterole AND NOT r.rolreplication
 AND NOT EXISTS(SELECT 1 FROM pg_auth_members m WHERE m.member=r.oid)
 AND NOT has_database_privilege(current_user,current_database(),'CREATE')
 AND EXISTS(SELECT 1 FROM everymcp_monitor_control.role_bindings b WHERE b.role_name=current_user AND b.account_id=$1 AND b.mode=$2 AND b.product_key=$3 AND b.access_kind=$4 AND b.contract_version=1)
 AND has_schema_privilege(current_user,'everymcp_monitor_control','USAGE') AND NOT has_schema_privilege(current_user,'everymcp_monitor_control','CREATE')
 AND NOT EXISTS(SELECT 1 FROM pg_namespace n CROSS JOIN LATERAL aclexplode(COALESCE(n.nspacl,acldefault('n',n.nspowner))) a WHERE n.nspname='everymcp_monitor_control' AND (pg_get_userbyid(n.nspowner)<>'everymcp_monitor_control_owner' OR (a.grantee<>n.nspowner AND (COALESCE(pg_get_userbyid(a.grantee),'PUBLIC') NOT IN ('everymcp_monitor_configurator','everymcp_monitor_job_writer','everymcp_monitor_control_recovery') OR a.privilege_type<>'USAGE' OR a.is_grantable))))
 AND NOT EXISTS(SELECT 1 FROM target t CROSS JOIN LATERAL aclexplode(COALESCE(t.relacl,acldefault('r',t.relowner))) a WHERE a.grantee<>t.relowner AND (a.privilege_type<>'SELECT' OR a.is_grantable OR COALESCE(pg_get_userbyid(a.grantee),'PUBLIC') NOT IN ('everymcp_monitor_configurator','everymcp_monitor_job_writer','everymcp_monitor_control_recovery') OR (pg_get_userbyid(a.grantee)='everymcp_monitor_configurator' AND t.relname IN ('canonical_jobs','billing_bindings'))))
 AND NOT EXISTS(SELECT 1 FROM target t JOIN pg_attribute c ON c.attrelid=t.oid AND c.attnum>0 AND NOT c.attisdropped CROSS JOIN LATERAL aclexplode(c.attacl) a WHERE a.grantee<>t.relowner AND (a.is_grantable OR NOT ((pg_get_userbyid(a.grantee)='everymcp_monitor_configurator' AND ((a.privilege_type='INSERT' AND t.relname IN ('watchlist_heads','watchlist_versions') AND c.attname<>'writer_role') OR (a.privilege_type='UPDATE' AND t.relname='watchlist_heads' AND c.attname='current_version'))) OR (pg_get_userbyid(a.grantee)='everymcp_monitor_job_writer' AND a.privilege_type='INSERT' AND t.relname='canonical_jobs' AND c.attname<>'writer_role')))))
 AND (SELECT count(*)=5 FROM target)
 AND NOT EXISTS(SELECT 1 FROM target t WHERE t.relkind<>'r' OR NOT t.relrowsecurity OR NOT t.relforcerowsecurity OR pg_get_userbyid(t.relowner)<>'everymcp_monitor_control_owner' OR t.relowner=r.oid
   OR has_table_privilege(current_user,t.oid,'SELECT')<>t.readable
   OR has_table_privilege(current_user,t.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER' || CASE WHEN current_setting('server_version_num')::integer>=170000 THEN ',MAINTAIN' ELSE '' END)
   OR (SELECT COALESCE(array_agg(a.attname::text ORDER BY a.attname::text),ARRAY[]::text[]) FROM pg_attribute a WHERE a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped)<>(SELECT array_agg(x ORDER BY x) FROM unnest(t.columns) x))
 AND NOT EXISTS(SELECT 1 FROM target t JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped WHERE
   has_column_privilege(current_user,t.oid,a.attnum,'SELECT')<>t.readable
   OR has_column_privilege(current_user,t.oid,a.attnum,'REFERENCES')
   OR has_column_privilege(current_user,t.oid,a.attnum,'UPDATE')<>($4='configure' AND t.relname='watchlist_heads' AND a.attname='current_version')
   OR has_column_privilege(current_user,t.oid,a.attnum,'INSERT')<>(a.attname<>'writer_role' AND (($4='configure' AND t.relname IN ('watchlist_heads','watchlist_versions')) OR ($4='produce' AND t.relname='canonical_jobs'))))
 AND NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname='everymcp_monitor_control' AND c.relkind IN ('r','p','v','m','f','S') AND NOT EXISTS(SELECT 1 FROM target t WHERE t.oid=c.oid))
 AND NOT EXISTS(SELECT 1 FROM pg_trigger tr JOIN target t ON t.oid=tr.tgrelid WHERE NOT tr.tgisinternal)
 AND NOT EXISTS(SELECT 1 FROM pg_rewrite rw JOIN target t ON t.oid=rw.ev_class)
 AND NOT EXISTS(SELECT 1 FROM pg_inherits i JOIN target t ON t.oid=i.inhparent OR t.oid=i.inhrelid)
 AND NOT EXISTS(SELECT 1 FROM pg_namespace n WHERE n.nspname NOT IN ('pg_catalog','information_schema','everymcp_monitor_control') AND n.nspname NOT LIKE 'pg_%' AND has_schema_privilege(current_user,n.oid,'CREATE'))
 AND NOT EXISTS(SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname NOT IN ('pg_catalog','information_schema','everymcp_monitor_control') AND n.nspname NOT LIKE 'pg_%' AND has_schema_privilege(current_user,n.oid,'USAGE') AND ((c.relkind IN ('r','p','v','m','f') AND (has_table_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER' || CASE WHEN current_setting('server_version_num')::integer>=170000 THEN ',MAINTAIN' ELSE '' END) OR has_any_column_privilege(current_user,c.oid,'SELECT,INSERT,UPDATE,REFERENCES'))) OR (c.relkind='S' AND has_sequence_privilege(current_user,c.oid,'USAGE,SELECT,UPDATE'))))
 AND NOT EXISTS(SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace WHERE p.prosecdef AND n.nspname NOT IN ('pg_catalog','information_schema') AND n.nspname NOT LIKE 'pg_%' AND has_schema_privilege(current_user,n.oid,'USAGE') AND has_function_privilege(current_user,p.oid,'EXECUTE'))
 AND NOT EXISTS(SELECT 1 FROM pg_roles other CROSS JOIN target t WHERE other.rolname IN ('everymcp_monitor_producer','everymcp_monitor_recovery') AND (has_table_privilege(other.oid,t.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') OR has_any_column_privilege(other.oid,t.oid,'SELECT,INSERT,UPDATE,REFERENCES')))
 FROM role_check r),false) AS ready`;

// Expected value must come from independently reviewed installation evidence.
export const CONTROL_DEFINITION_SQL = `
WITH tables AS (
 SELECT c.oid,c.relname,c.relkind,c.relrowsecurity,c.relforcerowsecurity,pg_get_userbyid(c.relowner) AS owner
 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
 WHERE n.nspname='everymcp_monitor_control' AND c.relname IN ('role_bindings','watchlist_heads','watchlist_versions','canonical_jobs','billing_bindings')
), metadata AS (SELECT jsonb_build_object(
 'tables',COALESCE((SELECT jsonb_agg(jsonb_build_array(t.relname,t.relkind,t.owner,t.relrowsecurity,t.relforcerowsecurity) ORDER BY t.relname) FROM tables t),'[]'::jsonb),
 'columns',COALESCE((SELECT jsonb_agg(jsonb_build_array(t.relname,a.attnum,a.attname,format_type(a.atttypid,a.atttypmod),a.attnotnull,pg_get_expr(d.adbin,d.adrelid)) ORDER BY t.relname,a.attnum) FROM tables t JOIN pg_attribute a ON a.attrelid=t.oid AND a.attnum>0 AND NOT a.attisdropped LEFT JOIN pg_attrdef d ON d.adrelid=a.attrelid AND d.adnum=a.attnum),'[]'::jsonb),
 'constraints',COALESCE((SELECT jsonb_agg(jsonb_build_array(t.relname,c.conname,c.contype,c.convalidated,c.condeferrable,c.condeferred,pg_get_constraintdef(c.oid,true)) ORDER BY t.relname,c.conname) FROM tables t JOIN pg_constraint c ON c.conrelid=t.oid),'[]'::jsonb),
 'indexes',COALESCE((SELECT jsonb_agg(jsonb_build_array(t.relname,i.relname,x.indisvalid,x.indisready,x.indislive,x.indisunique,x.indisprimary,pg_get_indexdef(i.oid)) ORDER BY t.relname,i.relname) FROM tables t JOIN pg_index x ON x.indrelid=t.oid JOIN pg_class i ON i.oid=x.indexrelid),'[]'::jsonb),
 'policies',COALESCE((SELECT jsonb_agg(jsonb_build_array(t.relname,p.polname,p.polcmd,p.polpermissive,(SELECT jsonb_agg(CASE WHEN role_id=0 THEN 'PUBLIC' ELSE COALESCE(pg_get_userbyid(role_id),'UNKNOWN') END ORDER BY CASE WHEN role_id=0 THEN 'PUBLIC' ELSE COALESCE(pg_get_userbyid(role_id),'UNKNOWN') END) FROM unnest(p.polroles) role_id),pg_get_expr(p.polqual,p.polrelid),pg_get_expr(p.polwithcheck,p.polrelid)) ORDER BY t.relname,p.polname) FROM tables t JOIN pg_policy p ON p.polrelid=t.oid),'[]'::jsonb)
 ) AS value) SELECT encode(sha256(convert_to(value::text,'UTF8')),'hex') AS definition_sha256 FROM metadata`;
