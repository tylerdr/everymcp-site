-- SOURCE PROPOSAL ONLY. UNAPPLIED, NATIVE ACCEPTANCE UNRUN.
-- Fresh private schema/roles only; refuses collisions. No hosted target selected.
-- Runtime roles are NOLOGIN placeholders and have no membership or scope rows.
-- This file always rolls back. No unrelated grants or PUBLIC rights are changed.
BEGIN;
SET LOCAL statement_timeout='10s';
SET LOCAL lock_timeout='5s';
CREATE ROLE everymcp_monitor_control_owner NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE everymcp_monitor_configurator NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE everymcp_monitor_job_writer NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE ROLE everymcp_monitor_control_recovery NOLOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS NOCREATEDB NOCREATEROLE NOREPLICATION;
CREATE SCHEMA everymcp_monitor_control AUTHORIZATION everymcp_monitor_control_owner;
-- Create objects under this fresh private owner, never under installer default ACLs.
SET LOCAL ROLE everymcp_monitor_control_owner;
CREATE TABLE everymcp_monitor_control.role_bindings (
 role_name name PRIMARY KEY CHECK (role_name IN ('everymcp_monitor_configurator','everymcp_monitor_job_writer','everymcp_monitor_control_recovery')),
 account_id text NOT NULL CHECK (account_id ~ '^acct_[A-Za-z0-9]{1,64}$'), mode text NOT NULL CHECK (mode IN ('test','live')), product_key text NOT NULL CHECK (product_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(product_key)<=80), access_kind text NOT NULL CHECK (access_kind IN ('configure','produce','recover')),
 contract_version integer NOT NULL CHECK (contract_version=1),
 CHECK ((role_name='everymcp_monitor_configurator' AND access_kind='configure') OR (role_name='everymcp_monitor_job_writer' AND access_kind='produce') OR (role_name='everymcp_monitor_control_recovery' AND access_kind='recover'))
);
CREATE TABLE everymcp_monitor_control.watchlist_versions (
 account_id text NOT NULL CHECK (account_id ~ '^acct_[A-Za-z0-9]{1,64}$'), mode text NOT NULL CHECK (mode IN ('test','live')), product_key text NOT NULL CHECK (product_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(product_key)<=80), owner_key text NOT NULL CHECK (owner_key ~ '^[a-f0-9]{64}$'), watchlist_id text NOT NULL CHECK (watchlist_id ~ '^[a-f0-9]{64}$'), version integer NOT NULL CHECK (version>0),
 mutation_id uuid NOT NULL, request_sha256 text NOT NULL CHECK (request_sha256 ~ '^[a-f0-9]{64}$'),
 config_sha256 text NOT NULL CHECK (config_sha256 ~ '^[a-f0-9]{64}$'),
 config_bytes bytea NOT NULL CHECK (octet_length(config_bytes) BETWEEN 1 AND 65536),
 writer_role name NOT NULL DEFAULT current_user CHECK (writer_role='everymcp_monitor_configurator'),
 PRIMARY KEY (account_id,mode,product_key,owner_key,version),
 UNIQUE(account_id,mode,product_key,owner_key,watchlist_id,version),
 UNIQUE(account_id,mode,product_key,owner_key,mutation_id),
 CHECK (config_sha256=encode(sha256(config_bytes),'hex'))
);
CREATE TABLE everymcp_monitor_control.watchlist_heads (
 account_id text NOT NULL CHECK (account_id ~ '^acct_[A-Za-z0-9]{1,64}$'), mode text NOT NULL CHECK (mode IN ('test','live')), product_key text NOT NULL CHECK (product_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(product_key)<=80), owner_key text NOT NULL CHECK (owner_key ~ '^[a-f0-9]{64}$'), watchlist_id text NOT NULL CHECK (watchlist_id ~ '^[a-f0-9]{64}$'), current_version integer NOT NULL CHECK (current_version>0),
 writer_role name NOT NULL DEFAULT current_user CHECK (writer_role='everymcp_monitor_configurator'),
 PRIMARY KEY(account_id,mode,product_key,owner_key), UNIQUE(account_id,mode,product_key,watchlist_id),
 FOREIGN KEY(account_id,mode,product_key,owner_key,watchlist_id,current_version) REFERENCES everymcp_monitor_control.watchlist_versions(account_id,mode,product_key,owner_key,watchlist_id,version)
);
CREATE TABLE everymcp_monitor_control.billing_bindings (
 account_id text NOT NULL CHECK (account_id ~ '^acct_[A-Za-z0-9]{1,64}$'), mode text NOT NULL CHECK (mode IN ('test','live')), product_key text NOT NULL CHECK (product_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(product_key)<=80), owner_key text NOT NULL CHECK (owner_key ~ '^[a-f0-9]{64}$'), customer_id text NOT NULL CHECK (customer_id ~ '^cus_[A-Za-z0-9]{1,100}$'),
 subscription_id text NOT NULL CHECK (subscription_id ~ '^sub_[A-Za-z0-9]{1,100}$'), enabled boolean NOT NULL DEFAULT false,
 PRIMARY KEY(account_id,mode,product_key,owner_key), UNIQUE(account_id,mode,product_key,subscription_id), UNIQUE(account_id,mode,product_key,customer_id)
);
CREATE TABLE everymcp_monitor_control.canonical_jobs (
 account_id text NOT NULL CHECK (account_id ~ '^acct_[A-Za-z0-9]{1,64}$'), mode text NOT NULL CHECK (mode IN ('test','live')), product_key text NOT NULL CHECK (product_key ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND length(product_key)<=80), owner_key text NOT NULL CHECK (owner_key ~ '^[a-f0-9]{64}$'), watchlist_id text NOT NULL CHECK (watchlist_id ~ '^[a-f0-9]{64}$'), version integer NOT NULL CHECK (version>0),
 job_id text NOT NULL CHECK (job_id ~ '^[a-f0-9]{64}$'), job_sha256 text NOT NULL CHECK (job_sha256 ~ '^[a-f0-9]{64}$'),
 job_bytes bytea NOT NULL CHECK (octet_length(job_bytes) BETWEEN 1 AND 65536),
 writer_role name NOT NULL DEFAULT current_user CHECK (writer_role='everymcp_monitor_job_writer'),
 PRIMARY KEY(account_id,mode,product_key,job_id),
 FOREIGN KEY(account_id,mode,product_key,owner_key,watchlist_id,version) REFERENCES everymcp_monitor_control.watchlist_versions(account_id,mode,product_key,owner_key,watchlist_id,version),
 CHECK (job_sha256=encode(sha256(job_bytes),'hex'))
);
ALTER TABLE everymcp_monitor_control.role_bindings OWNER TO everymcp_monitor_control_owner;
ALTER TABLE everymcp_monitor_control.role_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE everymcp_monitor_control.role_bindings FORCE ROW LEVEL SECURITY;
REVOKE ALL ON everymcp_monitor_control.role_bindings FROM PUBLIC;
CREATE POLICY control_owner ON everymcp_monitor_control.role_bindings TO everymcp_monitor_control_owner USING (true) WITH CHECK (true);
ALTER TABLE everymcp_monitor_control.watchlist_heads OWNER TO everymcp_monitor_control_owner;
ALTER TABLE everymcp_monitor_control.watchlist_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE everymcp_monitor_control.watchlist_heads FORCE ROW LEVEL SECURITY;
REVOKE ALL ON everymcp_monitor_control.watchlist_heads FROM PUBLIC;
CREATE POLICY control_owner ON everymcp_monitor_control.watchlist_heads TO everymcp_monitor_control_owner USING (true) WITH CHECK (true);
ALTER TABLE everymcp_monitor_control.watchlist_versions OWNER TO everymcp_monitor_control_owner;
ALTER TABLE everymcp_monitor_control.watchlist_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE everymcp_monitor_control.watchlist_versions FORCE ROW LEVEL SECURITY;
REVOKE ALL ON everymcp_monitor_control.watchlist_versions FROM PUBLIC;
CREATE POLICY control_owner ON everymcp_monitor_control.watchlist_versions TO everymcp_monitor_control_owner USING (true) WITH CHECK (true);
ALTER TABLE everymcp_monitor_control.canonical_jobs OWNER TO everymcp_monitor_control_owner;
ALTER TABLE everymcp_monitor_control.canonical_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE everymcp_monitor_control.canonical_jobs FORCE ROW LEVEL SECURITY;
REVOKE ALL ON everymcp_monitor_control.canonical_jobs FROM PUBLIC;
CREATE POLICY control_owner ON everymcp_monitor_control.canonical_jobs TO everymcp_monitor_control_owner USING (true) WITH CHECK (true);
ALTER TABLE everymcp_monitor_control.billing_bindings OWNER TO everymcp_monitor_control_owner;
ALTER TABLE everymcp_monitor_control.billing_bindings ENABLE ROW LEVEL SECURITY;
ALTER TABLE everymcp_monitor_control.billing_bindings FORCE ROW LEVEL SECURITY;
REVOKE ALL ON everymcp_monitor_control.billing_bindings FROM PUBLIC;
CREATE POLICY control_owner ON everymcp_monitor_control.billing_bindings TO everymcp_monitor_control_owner USING (true) WITH CHECK (true);
CREATE POLICY binding_self ON everymcp_monitor_control.role_bindings FOR SELECT TO everymcp_monitor_configurator,everymcp_monitor_job_writer,everymcp_monitor_control_recovery USING (role_name=current_user);
CREATE POLICY scoped_read ON everymcp_monitor_control.watchlist_heads FOR SELECT TO everymcp_monitor_configurator,everymcp_monitor_job_writer,everymcp_monitor_control_recovery USING (EXISTS (SELECT 1 FROM everymcp_monitor_control.role_bindings b WHERE b.role_name=current_user AND b.account_id=watchlist_heads.account_id AND b.mode=watchlist_heads.mode AND b.product_key=watchlist_heads.product_key AND b.contract_version=1));
CREATE POLICY scoped_insert ON everymcp_monitor_control.watchlist_heads FOR INSERT TO everymcp_monitor_configurator WITH CHECK (EXISTS (SELECT 1 FROM everymcp_monitor_control.role_bindings b WHERE b.role_name=current_user AND b.account_id=watchlist_heads.account_id AND b.mode=watchlist_heads.mode AND b.product_key=watchlist_heads.product_key AND b.contract_version=1));
CREATE POLICY scoped_head_update ON everymcp_monitor_control.watchlist_heads FOR UPDATE TO everymcp_monitor_configurator USING (EXISTS (SELECT 1 FROM everymcp_monitor_control.role_bindings b WHERE b.role_name=current_user AND b.account_id=watchlist_heads.account_id AND b.mode=watchlist_heads.mode AND b.product_key=watchlist_heads.product_key AND b.contract_version=1)) WITH CHECK (EXISTS (SELECT 1 FROM everymcp_monitor_control.role_bindings b WHERE b.role_name=current_user AND b.account_id=watchlist_heads.account_id AND b.mode=watchlist_heads.mode AND b.product_key=watchlist_heads.product_key AND b.contract_version=1));
CREATE POLICY scoped_read ON everymcp_monitor_control.watchlist_versions FOR SELECT TO everymcp_monitor_configurator,everymcp_monitor_job_writer,everymcp_monitor_control_recovery USING (EXISTS (SELECT 1 FROM everymcp_monitor_control.role_bindings b WHERE b.role_name=current_user AND b.account_id=watchlist_versions.account_id AND b.mode=watchlist_versions.mode AND b.product_key=watchlist_versions.product_key AND b.contract_version=1));
CREATE POLICY scoped_insert ON everymcp_monitor_control.watchlist_versions FOR INSERT TO everymcp_monitor_configurator WITH CHECK (EXISTS (SELECT 1 FROM everymcp_monitor_control.role_bindings b WHERE b.role_name=current_user AND b.account_id=watchlist_versions.account_id AND b.mode=watchlist_versions.mode AND b.product_key=watchlist_versions.product_key AND b.contract_version=1));
CREATE POLICY scoped_read ON everymcp_monitor_control.canonical_jobs FOR SELECT TO everymcp_monitor_job_writer,everymcp_monitor_control_recovery USING (EXISTS (SELECT 1 FROM everymcp_monitor_control.role_bindings b WHERE b.role_name=current_user AND b.account_id=canonical_jobs.account_id AND b.mode=canonical_jobs.mode AND b.product_key=canonical_jobs.product_key AND b.contract_version=1));
CREATE POLICY scoped_insert ON everymcp_monitor_control.canonical_jobs FOR INSERT TO everymcp_monitor_job_writer WITH CHECK (EXISTS (SELECT 1 FROM everymcp_monitor_control.role_bindings b WHERE b.role_name=current_user AND b.account_id=canonical_jobs.account_id AND b.mode=canonical_jobs.mode AND b.product_key=canonical_jobs.product_key AND b.contract_version=1));
CREATE POLICY scoped_read ON everymcp_monitor_control.billing_bindings FOR SELECT TO everymcp_monitor_job_writer,everymcp_monitor_control_recovery USING (EXISTS (SELECT 1 FROM everymcp_monitor_control.role_bindings b WHERE b.role_name=current_user AND b.account_id=billing_bindings.account_id AND b.mode=billing_bindings.mode AND b.product_key=billing_bindings.product_key AND b.contract_version=1));
REVOKE ALL ON SCHEMA everymcp_monitor_control FROM PUBLIC;
GRANT USAGE ON SCHEMA everymcp_monitor_control TO everymcp_monitor_configurator,everymcp_monitor_job_writer,everymcp_monitor_control_recovery;
GRANT SELECT ON everymcp_monitor_control.role_bindings,everymcp_monitor_control.watchlist_heads,everymcp_monitor_control.watchlist_versions TO everymcp_monitor_configurator,everymcp_monitor_job_writer,everymcp_monitor_control_recovery;
GRANT SELECT ON everymcp_monitor_control.canonical_jobs,everymcp_monitor_control.billing_bindings TO everymcp_monitor_job_writer,everymcp_monitor_control_recovery;
GRANT INSERT(account_id,mode,product_key,owner_key,watchlist_id,current_version),UPDATE(current_version) ON everymcp_monitor_control.watchlist_heads TO everymcp_monitor_configurator;
GRANT INSERT(account_id,mode,product_key,owner_key,watchlist_id,version,mutation_id,request_sha256,config_sha256,config_bytes) ON everymcp_monitor_control.watchlist_versions TO everymcp_monitor_configurator;
GRANT INSERT(account_id,mode,product_key,owner_key,watchlist_id,version,job_id,job_sha256,job_bytes) ON everymcp_monitor_control.canonical_jobs TO everymcp_monitor_job_writer;
-- No runtime write grant on role_bindings or billing_bindings. Enrollment is a separate trusted-owner boundary.
-- No USAGE/table/column/sequence/function grants to or from the existing custody roles.
-- Actual direct-login bindings, installation fingerprint and effective ambient privileges require separate acceptance.
ROLLBACK;
