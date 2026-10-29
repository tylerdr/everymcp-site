import { createHash } from "node:crypto";
import { assertLedger, recordPayment, recoverCurrentPacket, sameScope, type EntitlementStore, type PaymentNotice, type Scope, type VerifiedPurchase } from "./entitlements";

// No production wiring. Identity/signature/purchase adapters must be independently
// approved and server-bound; a caller-supplied owner is never an identity.
export type RecoveryAdapters = {
  store: EntitlementStore;
  scope: Scope;
  verifyNotice: (raw: string, signature: string) => PaymentNotice;
  verifyPurchase: (session: string, scope: Scope) => Promise<VerifiedPurchase>;
  resolveNotice?: (notice: PaymentNotice) => Promise<PaymentNotice | null>;
  authenticate: (request: Request) => Promise<{ scope: Scope; ownerKey: string } | null>;
};
const headers = { "Cache-Control": "private, no-store" };
const json = (body: unknown, status = 200) => Response.json(body, { status, headers });
export function createRecoveryHandlers(adapters: RecoveryAdapters) {
  return {
    async webhook(request: Request) {
      const signature = request.headers.get("stripe-signature");
      if (!signature) return json({ error: "Invalid webhook" }, 400);
      // Read bounded raw bytes, never JSON-reencode before signature verification.
      if (!request.body) return json({ error: "Invalid webhook" }, 400);
      const reader = request.body.getReader();
      const chunks: Uint8Array[] = [];
      let size = 0;
      let timer: ReturnType<typeof setTimeout> | undefined;
      const deadline = new Promise<never>((_, reject) => { timer = setTimeout(() => { reject(new Error("Webhook body deadline")); void reader.cancel().catch(() => {}); }, 3000); });
      try {
        for (;;) {
          const { done, value } = await Promise.race([reader.read(), deadline]);
          if (done) break;
          size += value.byteLength;
          if (size > 64_000) { void reader.cancel().catch(() => {}); return json({ error: "Invalid webhook" }, 400); }
          chunks.push(value);
        }
      } catch { return json({ error: "Invalid webhook" }, 400); }
      finally { clearTimeout(timer); void reader.cancel().catch(() => {}); }
      const bytes = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
      let notice: PaymentNotice;
      try {
        notice = adapters.verifyNotice(new TextDecoder("utf-8", { fatal: true }).decode(bytes), signature);
        if (notice.payloadSha256 !== createHash("sha256").update(bytes).digest("hex") || !sameScope(notice.scope, adapters.scope)) throw new Error("Invalid notice");
      } catch { return json({ error: "Invalid webhook" }, 400); }
      try {
        const resolved = adapters.resolveNotice ? await adapters.resolveNotice(notice) : notice;
        if (!resolved) return json({ status: "ignored" });
        const result = await recordPayment(adapters.store, adapters.scope, resolved, adapters.verifyPurchase);
        return json({ status: result });
      } catch { return json({ error: "Receipt persistence unavailable; retry delivery" }, 503); }
    },
    async recovery(request: Request) {
      try {
        const principal = await adapters.authenticate(request);
        if (!principal || !principal.ownerKey || !sameScope(principal.scope, adapters.scope)) return json({ error: "Authentication required" }, 401);
        const id = new URL(request.url).searchParams.get("receipt");
        if (!id) {
          const receipts = await adapters.store.transaction((ledger) => {
            assertLedger(ledger);
            return Object.values(ledger.receipts)
            .filter((receipt) => sameScope(receipt.scope, adapters.scope) && receipt.ownerKey === principal.ownerKey)
            .map((receipt) => ({ id: receipt.id, packetSha256: receipt.packetSha256, sessionId: receipt.sessionId }));
          });
          const current = [];
          for (const receipt of receipts) {
            const purchase = await adapters.verifyPurchase(receipt.sessionId, adapters.scope);
            if (purchase.paid && sameScope(purchase.scope, adapters.scope) && purchase.sessionId === receipt.sessionId && purchase.ownerKey === principal.ownerKey) current.push({id: receipt.id, packetSha256: receipt.packetSha256});
          }
          return json({ receipts: current });
        }
        const packet = await recoverCurrentPacket(adapters.store, adapters.scope, principal.ownerKey, id, adapters.verifyPurchase);
        if (!packet) return json({ error: "Receipt unavailable" }, 404);
        return new Response(packet, { headers: { ...headers, "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": 'attachment; filename="everymcp-mcp-integration-starter-kit.md"', "X-EveryMCP-Artifact-SHA256": createHash("sha256").update(packet).digest("hex") } });
      } catch { return json({ error: "Recovery unavailable; retry later" }, 503); }
    }
  };
}
