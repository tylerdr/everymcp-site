-- REVIEW-ONLY PROPOSAL. Not applied. Requires approval of the exact instance,
-- dedicated everymcp_receipt_server role, account/mode, backups and retention.
-- A production adapter must use SERIALIZABLE transactions with bounded retries.
BEGIN;
CREATE SCHEMA everymcp_receipts;
REVOKE ALL ON SCHEMA everymcp_receipts FROM PUBLIC;
CREATE TABLE everymcp_receipts.payment_events (
  account_id text NOT NULL CHECK (account_id ~ '^acct_[A-Za-z0-9]+$'),
  mode text NOT NULL CHECK (mode IN ('test', 'live')),
  event_id text NOT NULL CHECK (length(event_id) BETWEEN 1 AND 255),
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
-- This dedicated backend role is not provisioned by this proposal. Never grant
-- it to an anonymous/browser/authenticated-client role. Identity filtering is
-- server-side; every read includes account_id, mode and verified owner_key.
GRANT USAGE ON SCHEMA everymcp_receipts TO everymcp_receipt_server;
GRANT SELECT, INSERT ON ALL TABLES IN SCHEMA everymcp_receipts TO everymcp_receipt_server;
-- No UPDATE or DELETE: paid snapshots/event receipts are immutable to this role.
COMMIT;
