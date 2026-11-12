-- PROPOSAL ONLY: do not apply as a migration. Native PostgreSQL acceptance,
-- owner review, binding values and isolated login provisioning are unresolved.
-- This transaction deliberately rolls back, including roles and schema.
-- The NOLOGIN roles are placeholders: an owner must separately authorize actual
-- LOGIN/credential issuance and an approved role_bindings tuple. No binding is
-- inserted here. The runtime guard must fail closed until that work is complete.
-- Native acceptance must review installed DDL and run negative RLS/privilege
-- checks before obtaining the catalog definition fingerprint. Independently bind
-- that reviewed fingerprint in trusted server configuration; never derive the
-- expected fingerprint from the same live query or enable access from client input.
-- Fingerprints are installation/version specific; fictional test values prove no
-- production security property.
BEGIN;
CREATE ROLE everymcp_monitor_owner NOLOGIN NOINHERIT;
CREATE ROLE everymcp_monitor_producer NOLOGIN NOINHERIT;
CREATE ROLE everymcp_monitor_recovery NOLOGIN NOINHERIT;
CREATE SCHEMA everymcp_monitoring AUTHORIZATION everymcp_monitor_owner;
REVOKE ALL ON SCHEMA everymcp_monitoring FROM PUBLIC;
GRANT USAGE ON SCHEMA everymcp_monitoring TO everymcp_monitor_producer, everymcp_monitor_recovery;
SET LOCAL ROLE everymcp_monitor_owner;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON TABLES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON SEQUENCES FROM PUBLIC;
ALTER DEFAULT PRIVILEGES REVOKE ALL ON FUNCTIONS FROM PUBLIC;
CREATE TABLE everymcp_monitoring.role_bindings (
 role_name name PRIMARY KEY, account_id text NOT NULL CHECK(account_id ~ '^acct_[A-Za-z0-9]{1,64}$'), mode text NOT NULL CHECK(mode IN ('test','live')), product_key text NOT NULL CHECK(length(product_key)<=80 AND product_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), access_kind text NOT NULL CHECK(access_kind IN ('producer','recovery')), contract_version integer NOT NULL CHECK(contract_version=1), CHECK ((role_name='everymcp_monitor_producer' AND access_kind='producer') OR (role_name='everymcp_monitor_recovery' AND access_kind='recovery'))
);
CREATE TABLE everymcp_monitoring.execution_starts (
 account_id text NOT NULL CHECK(account_id ~ '^acct_[A-Za-z0-9]{1,64}$'), mode text NOT NULL CHECK(mode IN ('test','live')), product_key text NOT NULL CHECK(length(product_key)<=80 AND product_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
 execution_id text NOT NULL CHECK(execution_id ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'), nonce text NOT NULL CHECK(nonce ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'), job_id text NOT NULL CHECK(job_id ~ '^[0-9a-f]{64}$'), owner_key text NOT NULL CHECK(owner_key ~ '^[0-9a-f]{64}$'), start_sha256 text NOT NULL CHECK(start_sha256 ~ '^[0-9a-f]{64}$'), start_bytes bytea NOT NULL CHECK(octet_length(start_bytes) BETWEEN 1 AND 65536 AND encode(sha256(start_bytes),'hex')=start_sha256), writer_role name NOT NULL DEFAULT current_user,
 PRIMARY KEY(account_id,mode,product_key,execution_id), UNIQUE(account_id,mode,product_key,nonce), UNIQUE(account_id,mode,product_key,execution_id,job_id,owner_key,start_sha256)
);
CREATE TABLE everymcp_monitoring.execution_completions (
 account_id text NOT NULL CHECK(account_id ~ '^acct_[A-Za-z0-9]{1,64}$'), mode text NOT NULL CHECK(mode IN ('test','live')), product_key text NOT NULL CHECK(length(product_key)<=80 AND product_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), execution_id text NOT NULL, job_id text NOT NULL CHECK(job_id ~ '^[0-9a-f]{64}$'), owner_key text NOT NULL CHECK(owner_key ~ '^[0-9a-f]{64}$'), start_sha256 text NOT NULL CHECK(start_sha256 ~ '^[0-9a-f]{64}$'), receipt_id text NOT NULL CHECK(receipt_id ~ '^[0-9a-f]{64}$'), receipt_bytes bytea NOT NULL CHECK(octet_length(receipt_bytes) BETWEEN 1 AND 65536 AND encode(sha256(receipt_bytes),'hex')=receipt_id), source_bytes bytea, report_bytes bytea, source_sha256 text, report_sha256 text, report_length integer NOT NULL CHECK(report_length>=0 AND report_length<=2097152), writer_role name NOT NULL DEFAULT current_user,
 CHECK ((source_bytes IS NOT NULL AND report_bytes IS NULL AND source_sha256 IS NOT NULL AND source_sha256 ~ '^[0-9a-f]{64}$' AND report_sha256 IS NULL AND octet_length(source_bytes) BETWEEN 1 AND 2097152 AND report_length=0 AND encode(sha256(source_bytes),'hex')=source_sha256) OR (source_bytes IS NULL AND report_bytes IS NOT NULL AND source_sha256 IS NULL AND report_sha256 IS NOT NULL AND report_sha256 ~ '^[0-9a-f]{64}$' AND octet_length(report_bytes) BETWEEN 1 AND 2097152 AND octet_length(report_bytes)=report_length AND encode(sha256(report_bytes),'hex')=report_sha256)),
 PRIMARY KEY(account_id,mode,product_key,receipt_id), UNIQUE(account_id,mode,product_key,execution_id), UNIQUE(account_id,mode,product_key,receipt_id,job_id,owner_key), FOREIGN KEY(account_id,mode,product_key,execution_id,job_id,owner_key,start_sha256) REFERENCES everymcp_monitoring.execution_starts(account_id,mode,product_key,execution_id,job_id,owner_key,start_sha256)
);
CREATE TABLE everymcp_monitoring.job_commits (
 account_id text NOT NULL CHECK(account_id ~ '^acct_[A-Za-z0-9]{1,64}$'), mode text NOT NULL CHECK(mode IN ('test','live')), product_key text NOT NULL CHECK(length(product_key)<=80 AND product_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$'), job_id text NOT NULL CHECK(job_id ~ '^[0-9a-f]{64}$'), owner_key text NOT NULL CHECK(owner_key ~ '^[0-9a-f]{64}$'), receipt_id text NOT NULL CHECK(receipt_id ~ '^[0-9a-f]{64}$'), job_sha256 text NOT NULL CHECK(job_sha256 ~ '^[0-9a-f]{64}$'), job_bytes bytea NOT NULL CHECK(octet_length(job_bytes) BETWEEN 1 AND 65536 AND encode(sha256(job_bytes),'hex')=job_sha256), writer_role name NOT NULL DEFAULT current_user,
 PRIMARY KEY(account_id,mode,product_key,job_id), FOREIGN KEY(account_id,mode,product_key,receipt_id,job_id,owner_key) REFERENCES everymcp_monitoring.execution_completions(account_id,mode,product_key,receipt_id,job_id,owner_key)
);
ALTER TABLE everymcp_monitoring.role_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE everymcp_monitoring.role_bindings FORCE ROW LEVEL SECURITY;
-- Only an existing authorized owner-controlled SET ROLE may populate an
-- approved mapping during a separately authorized installation.
CREATE POLICY owner_manage_binding ON everymcp_monitoring.role_bindings FOR ALL TO everymcp_monitor_owner USING (true) WITH CHECK (true);
CREATE POLICY own_binding ON everymcp_monitoring.role_bindings FOR SELECT TO everymcp_monitor_producer,everymcp_monitor_recovery USING(role_name=current_user);
GRANT SELECT ON everymcp_monitoring.role_bindings TO everymcp_monitor_producer,everymcp_monitor_recovery;
ALTER TABLE everymcp_monitoring.execution_starts ENABLE ROW LEVEL SECURITY;
ALTER TABLE everymcp_monitoring.execution_starts FORCE ROW LEVEL SECURITY;
CREATE POLICY scoped_read ON everymcp_monitoring.execution_starts FOR SELECT TO everymcp_monitor_producer,everymcp_monitor_recovery USING (EXISTS (SELECT 1 FROM everymcp_monitoring.role_bindings b WHERE b.role_name=current_user AND b.account_id=execution_starts.account_id AND b.mode=execution_starts.mode AND b.product_key=execution_starts.product_key AND b.contract_version=1));
CREATE POLICY scoped_insert ON everymcp_monitoring.execution_starts FOR INSERT TO everymcp_monitor_producer WITH CHECK (writer_role=current_user AND EXISTS (SELECT 1 FROM everymcp_monitoring.role_bindings b WHERE b.role_name=current_user AND b.account_id=execution_starts.account_id AND b.mode=execution_starts.mode AND b.product_key=execution_starts.product_key AND b.contract_version=1 AND b.access_kind='producer'));
GRANT SELECT ON everymcp_monitoring.execution_starts TO everymcp_monitor_producer,everymcp_monitor_recovery;
GRANT INSERT (account_id,mode,product_key,execution_id,nonce,job_id,owner_key,start_sha256,start_bytes) ON everymcp_monitoring.execution_starts TO everymcp_monitor_producer;
ALTER TABLE everymcp_monitoring.execution_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE everymcp_monitoring.execution_completions FORCE ROW LEVEL SECURITY;
CREATE POLICY scoped_read ON everymcp_monitoring.execution_completions FOR SELECT TO everymcp_monitor_producer,everymcp_monitor_recovery USING (EXISTS (SELECT 1 FROM everymcp_monitoring.role_bindings b WHERE b.role_name=current_user AND b.account_id=execution_completions.account_id AND b.mode=execution_completions.mode AND b.product_key=execution_completions.product_key AND b.contract_version=1));
CREATE POLICY scoped_insert ON everymcp_monitoring.execution_completions FOR INSERT TO everymcp_monitor_producer WITH CHECK (writer_role=current_user AND EXISTS (SELECT 1 FROM everymcp_monitoring.role_bindings b WHERE b.role_name=current_user AND b.account_id=execution_completions.account_id AND b.mode=execution_completions.mode AND b.product_key=execution_completions.product_key AND b.contract_version=1 AND b.access_kind='producer'));
GRANT SELECT ON everymcp_monitoring.execution_completions TO everymcp_monitor_producer,everymcp_monitor_recovery;
GRANT INSERT (account_id,mode,product_key,execution_id,job_id,owner_key,start_sha256,receipt_id,receipt_bytes,source_bytes,report_bytes,source_sha256,report_sha256,report_length) ON everymcp_monitoring.execution_completions TO everymcp_monitor_producer;
ALTER TABLE everymcp_monitoring.job_commits ENABLE ROW LEVEL SECURITY;
ALTER TABLE everymcp_monitoring.job_commits FORCE ROW LEVEL SECURITY;
CREATE POLICY scoped_read ON everymcp_monitoring.job_commits FOR SELECT TO everymcp_monitor_producer,everymcp_monitor_recovery USING (EXISTS (SELECT 1 FROM everymcp_monitoring.role_bindings b WHERE b.role_name=current_user AND b.account_id=job_commits.account_id AND b.mode=job_commits.mode AND b.product_key=job_commits.product_key AND b.contract_version=1));
CREATE POLICY scoped_insert ON everymcp_monitoring.job_commits FOR INSERT TO everymcp_monitor_producer WITH CHECK (writer_role=current_user AND EXISTS (SELECT 1 FROM everymcp_monitoring.role_bindings b WHERE b.role_name=current_user AND b.account_id=job_commits.account_id AND b.mode=job_commits.mode AND b.product_key=job_commits.product_key AND b.contract_version=1 AND b.access_kind='producer'));
GRANT SELECT ON everymcp_monitoring.job_commits TO everymcp_monitor_producer,everymcp_monitor_recovery;
GRANT INSERT (account_id,mode,product_key,job_id,owner_key,receipt_id,job_sha256,job_bytes) ON everymcp_monitoring.job_commits TO everymcp_monitor_producer;
RESET ROLE;
-- No binding rows or logins are proposed. Owner must review and test native RLS,
-- immutable constraints, grants, role isolation and rollback before provisioning.
ROLLBACK;
