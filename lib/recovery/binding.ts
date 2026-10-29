import { createHash } from "node:crypto";
import type Stripe from "stripe";
import { Pool } from "pg";
import { buildStarterKit } from "@/lib/starter-kit";
import { verifyPaidSession } from "@/lib/stripe-fulfillment";
import { getStripeConfiguration, verifyStripeAccount } from "@/lib/stripe-config";
import { assertLedger, recordPayment, receiptId, sameScope, type EntitlementStore, type Scope, type VerifiedPurchase } from "./entitlements";
import { createRecoveryHandlers } from "./handlers";
import { PostgresStore } from "./postgres-store";
import { stripeNoticeVerifier, stripeNoticeResolver } from "./stripe-notice";
import { supabaseOwner, type Principal } from "./owner";

// Production is source-disabled. Explicit preview opt-in is confined to the
// named sandbox and a platform-owned preview origin; store checks still apply.
export const starterRecoveryEnabled = false; // Production remains source-disabled.
export function previewRecoveryEnabled(env: Record<string, string | undefined> = process.env) {
  let origin: URL;
  try { origin = new URL(env.NEXT_PUBLIC_SITE_URL || ""); } catch { return false; }
  const host = origin.host;
  const previewOrigin = origin.protocol === "https:" && origin.pathname === "/" && !origin.search && !origin.hash && !origin.username && !origin.password
    && host.endsWith(".vercel.app") && (host === env.VERCEL_URL || host === env.VERCEL_BRANCH_URL);
  return previewOrigin && env.VERCEL_ENV === "preview" && env.EVERYMCP_PREVIEW_RECOVERY === "named-sandbox-v1"
    && env.STRIPE_MODE === "test" && env.STRIPE_ACCOUNT_ID === "acct_1Re4ltEQ7c58oLZ4";
}
export type StarterBinding = ReturnType<typeof createStarterBinding>;
type Dependencies = {
  scope: Scope;
  authProject: string;
  store: EntitlementStore & { checkReadiness(): Promise<boolean> };
  authenticate: (request: Request) => Promise<Principal | null>;
  verifyPurchase: (id: string, scope: Scope) => Promise<VerifiedPurchase>;
  verifyAccount: () => Promise<boolean>;
  resolveNotice?: (notice: import("./entitlements").PaymentNotice) => Promise<import("./entitlements").PaymentNotice | null>;
  verifyNotice: ReturnType<typeof stripeNoticeVerifier>;
};
export function createStarterBinding(dependencies: Dependencies) {
  const { scope, authProject, store, authenticate, verifyPurchase, verifyAccount, verifyNotice, resolveNotice } = dependencies;
  async function ready() {
    try {
      if (!store?.checkReadiness || !authenticate || !verifyPurchase || !verifyAccount || !verifyNotice || !/^acct_[A-Za-z0-9]+$/.test(scope?.accountId || "") || !/^[a-z]{20}$/.test(authProject || "") || !["test", "live"].includes(scope.mode)) return false;
      if (!await verifyAccount() || !await store.checkReadiness()) return false;
      await store.transaction((ledger) => { assertLedger(ledger); });
      return true;
    } catch { return false; }
  }
  async function owner(request: Request) {
    const principal = await authenticate(request);
    return principal && sameScope(principal.scope, scope) && /^[a-f0-9]{64}$/.test(principal.ownerKey) && principal.email ? principal : null;
  }
  return {
    scope,
    authenticate: owner,
    ownerMetadata(principal: Principal) { return checkoutOwnerMetadata(principal, authProject); },
    async checkoutPrincipal(request: Request) {
      if (!await ready()) return null;
      return owner(request).catch(() => null);
    },
    ready,
    handlers: createRecoveryHandlers({ scope, store, authenticate, verifyPurchase, verifyNotice, resolveNotice }),
    async packet(sessionId: string) {
      // Same authoritative reader and atomic snapshot path as webhook fulfillment.
      const purchase = await verifyPurchase(sessionId, scope);
      if (!purchase.paid) return null;
      await recordPayment(store, scope, {
        id: "verified-return:" + sessionId, type: "checkout.session.completed", sessionId, scope,
        payloadSha256: createHash("sha256").update(JSON.stringify(["verified-return", scope, sessionId])).digest("hex")
      }, async () => purchase);
      return store.transaction((ledger) => {
        assertLedger(ledger);
        const receipt = ledger.receipts[receiptId(scope, sessionId)];
        if (!receipt || receipt.ownerKey !== purchase.ownerKey) throw new Error("Paid snapshot unavailable");
        return receipt.packet;
      });
    }
  };
}

export function purchaseReader(scope: Scope, project: string, verify = verifyPaidSession, build = buildStarterKit, store?: EntitlementStore) {
  return async (id: string, requestedScope: Scope): Promise<VerifiedPurchase> => {
    if (!sameScope(scope, requestedScope)) throw new Error("Purchase scope mismatch");
    const result = await verify(id, "starter");
    if (result.status === "unavailable") throw new Error("Authoritative purchase unavailable");
    if (result.status !== "paid" && result.status !== "revoked") return { sessionId: id, scope, ownerKey: "", paid: false, packet: "" };
    const session = result.session;
    if (session.id !== id || session.livemode !== (scope.mode === "live")) throw new Error("Session identity mismatch");
    const metadata = session.metadata || {};
    const owner = metadata.fulfillment_owner;
    if (["fulfillment_owner", "fulfillment_auth_project", "pricing_policy"].some((key) => key in metadata) && (metadata.fulfillment_auth_project !== project || !/^[a-f0-9]{64}$/.test(owner || "") || metadata.pricing_policy !== "usd4900-no-discount-v1")) throw new Error("Owner metadata mismatch");
    // Older paid rights retain session-bearer delivery. Never attach historical
    // ownerless sessions to an unverified new login or permit lost-return listing.
    const purchaseOwner = owner || "legacy:" + createHash("sha256").update(JSON.stringify([scope, id])).digest("hex");
    const snapshot = store ? await store.transaction((ledger) => {
      assertLedger(ledger);
      const saved = ledger.receipts[receiptId(scope, id)];
      if (saved && saved.ownerKey !== purchaseOwner) throw new Error("Owner conflict");
      return saved?.packet;
    }) : undefined;
    return { sessionId: id, scope, ownerKey: purchaseOwner, paid: result.status === "paid", packet: snapshot ?? (result.status === "paid" ? build(metadata.acquisition_goal) : "") };
  };
}

let binding: StarterBinding | null = null;
export function getStarterBinding(): StarterBinding | null {
  if (!starterRecoveryEnabled && !previewRecoveryEnabled()) return null;
  if (binding) return binding;
  const stripe = getStripeConfiguration();
  const project = process.env.EVERYMCP_AUTH_PROJECT;
  const publicKey = process.env.EVERYMCP_AUTH_PUBLISHABLE_KEY;
  const url = process.env.EVERYMCP_RECEIPT_DATABASE_URL;
  const signingSecret = process.env.EVERYMCP_STRIPE_WEBHOOK_SECRET;
  if (!stripe || !project || !publicKey || !url || !signingSecret?.startsWith("whsec_")) return null;
  try {
    const database = new URL(url);
    const role = decodeURIComponent(database.username);
    const direct = database.hostname === `db.${project}.supabase.co` && role === "everymcp_receipt_server";
    const pooled = database.hostname.endsWith(".pooler.supabase.com") && role === `everymcp_receipt_server.${project}`;
    if (database.protocol !== "postgresql:" || database.pathname !== "/postgres" || (!direct && !pooled) || !database.password || database.search || database.hash) return null;
    const scope: Scope = { accountId: stripe.accountId, mode: stripe.mode };
    const pool = new Pool({ connectionString: url, ssl: { rejectUnauthorized: true }, max: 2, options: "-c statement_timeout=5000 -c lock_timeout=5000 -c idle_in_transaction_session_timeout=5000", connectionTimeoutMillis: 5000, idleTimeoutMillis: 5000 });
    const authenticate = supabaseOwner(scope, project, publicKey);
    const store = new PostgresStore(pool, scope);
    binding = createStarterBinding({ scope, authProject: project, store, authenticate, verifyPurchase: purchaseReader(scope, project, verifyPaidSession, buildStarterKit, store), verifyAccount: async () => await verifyStripeAccount(stripe) === "valid", verifyNotice: stripeNoticeVerifier(signingSecret, scope), resolveNotice: stripeNoticeResolver(stripe.client, scope) });
    return binding;
  } catch { return null; }
}
// Used only for metadata derived from a verified server principal.
export function checkoutOwnerMetadata(principal: Principal, project: string): Stripe.MetadataParam {
  return { fulfillment_owner: principal.ownerKey, fulfillment_auth_project: project, pricing_policy: "usd4900-no-discount-v1" };
}
