-- REVIEW ONLY: complete candidate sandbox proposal, not executed.
-- Requires approval of seller, test mode, named shared project and catalog-only
-- capacity/PUBLIC-ACL preflight. Stop if any cross-product access is possible.
-- Operator applies with existing administration access; no admin key goes to app.
BEGIN;
CREATE ROLE everymcp_receipt_server LOGIN NOINHERIT NOBYPASSRLS
  NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION CONNECTION LIMIT 2;
-- Password is deliberately absent. Operator supplies a dedicated random password
-- through approved secret tooling, never SQL committed to Git or a chat message.
ALTER ROLE everymcp_receipt_server SET statement_timeout = '5s';
ALTER ROLE everymcp_receipt_server SET idle_in_transaction_session_timeout = '5s';
ALTER ROLE everymcp_receipt_server SET search_path = everymcp_receipts, pg_catalog;
-- Apply recovery-schema-proposal.sql's two private tables in the same reviewed
-- migration; its GRANT recipient is the newly created dedicated role above.
-- The following statements require those tables already created by that proposal.
CREATE SCHEMA everymcp_receipts;
REVOKE ALL ON SCHEMA everymcp_receipts FROM PUBLIC;
CREATE TABLE everymcp_receipts.payment_events (
  account_id text NOT NULL CHECK (account_id ~ '^acct_[A-Za-z0-9]+$'),
  mode text NOT NULL CHECK (mode IN ('test', 'live')),
  event_id text NOT NULL CHECK (event_id ~ '^[a-f0-9]{64}$'),
  payload_sha256 text NOT NULL CHECK (payload_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, mode, event_id)
);
CREATE TABLE everymcp_receipts.paid_receipts (
  account_id text NOT NULL CHECK (account_id ~ '^acct_[A-Za-z0-9]+$'),
  mode text NOT NULL CHECK (mode IN ('test', 'live')),
  session_id text NOT NULL CHECK (length(session_id) BETWEEN 1 AND 255),
  receipt_id text NOT NULL CHECK (receipt_id ~ '^[a-f0-9]{64}$'),
  owner_key text NOT NULL CHECK (length(owner_key) BETWEEN 1 AND 255),
  packet text NOT NULL CHECK (octet_length(packet) BETWEEN 1 AND 1000000),
  packet_sha256 text NOT NULL CHECK (packet_sha256 ~ '^[a-f0-9]{64}$'),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (account_id, mode, session_id),
  UNIQUE (account_id, mode, receipt_id)
);
CREATE INDEX paid_receipts_owner ON everymcp_receipts.paid_receipts (account_id, mode, owner_key);
REVOKE ALL ON ALL TABLES IN SCHEMA everymcp_receipts FROM PUBLIC;
REVOKE ALL ON SCHEMA everymcp_receipts FROM PUBLIC, anon, authenticated, service_role;
REVOKE ALL ON ALL TABLES IN SCHEMA everymcp_receipts FROM PUBLIC, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA everymcp_receipts TO everymcp_receipt_server;
GRANT SELECT, INSERT ON everymcp_receipts.payment_events,
  everymcp_receipts.paid_receipts TO everymcp_receipt_server;
ALTER TABLE everymcp_receipts.payment_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE everymcp_receipts.payment_events FORCE ROW LEVEL SECURITY;
ALTER TABLE everymcp_receipts.paid_receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE everymcp_receipts.paid_receipts FORCE ROW LEVEL SECURITY;
CREATE POLICY everymcp_test_events_read ON everymcp_receipts.payment_events
  FOR SELECT TO everymcp_receipt_server
  USING (account_id = 'acct_1Re4lnCrDNIXmbyx' AND mode = 'test');
CREATE POLICY everymcp_test_events_insert ON everymcp_receipts.payment_events
  FOR INSERT TO everymcp_receipt_server
  WITH CHECK (account_id = 'acct_1Re4lnCrDNIXmbyx' AND mode = 'test');
CREATE POLICY everymcp_test_receipts_read ON everymcp_receipts.paid_receipts
  FOR SELECT TO everymcp_receipt_server
  USING (account_id = 'acct_1Re4lnCrDNIXmbyx' AND mode = 'test');
CREATE POLICY everymcp_test_receipts_insert ON everymcp_receipts.paid_receipts
  FOR INSERT TO everymcp_receipt_server
  WITH CHECK (account_id = 'acct_1Re4lnCrDNIXmbyx' AND mode = 'test');
-- No UPDATE/DELETE, auth schema grants, other-product grants, exposed Data API
-- schema, SECURITY DEFINER routine, or changes to existing PUBLIC privileges.
-- PRIVATE schema/RLS alone cannot neutralize inherited PUBLIC access elsewhere:
-- catalog preflight must prove the new role cannot access another product.
COMMIT;
