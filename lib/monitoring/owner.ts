import { createHash } from "node:crypto";
import { z } from "zod";
import { buyerCookie, cookieToken } from "@/lib/buyer/session";
import { MonitoringUnavailable, type Principal, type Scope } from "./runtime";

const configuration = z.object({
  scope: z.object({ accountId: z.string().regex(/^acct_[A-Za-z0-9]{1,64}$/), mode: z.enum(["test", "live"]), productKey: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).max(80) }).strict(),
  project: z.string().regex(/^[a-z]{20}$/),
  publishableKey: z.string().regex(/^sb_publishable_[A-Za-z0-9_-]{16,200}$/),
}).strict();
const currentUser = z.object({
  id: z.string().regex(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/),
  email: z.string().min(1).max(320).regex(/^[^\s\x00-\x1f\x7f]+@[^\s\x00-\x1f\x7f]+$/),
  email_confirmed_at: z.string().datetime({ offset: true }),
  is_anonymous: z.literal(false),
});
const MAX_AUTH_BYTES = 64_000;
const AUTH_DEADLINE_MS = 5_000;
export type MonitoringOwnerConfiguration = { scope: Scope; project: string; publishableKey: string };

function bearer(request: Request): string | null {
  // Absence is different from malformed/duplicate cookies. Never let a header
  // mask an invalid cookie or choose between two presented identities.
  const cookies = (request.headers.get("cookie") || "").split(";").map(value => value.trim());
  const present = cookies.some(value => value.split("=", 1)[0].trim() === buyerCookie);
  const authorization = request.headers.get("authorization");
  if (authorization !== null && present) return null;
  if (authorization !== null) return /^Bearer ([A-Za-z0-9_.-]{16,8192})$/.exec(authorization)?.[1] ?? null;
  if (!present) return null;
  const matching = cookies.filter(value => value.split("=", 1)[0].trim() === buyerCookie);
  return matching.length === 1 ? cookieToken(request) : null;
}

/** Current identity only. No signup, token refresh, session persistence or paid rights. */
export function createMonitoringOwner(input: MonitoringOwnerConfiguration, fetcher: typeof fetch = fetch) {
  // Snapshot trusted server configuration; a caller cannot retarget a constructed adapter.
  const { scope, project, publishableKey } = configuration.parse(input);
  const endpoint = `https://${project}.supabase.co/auth/v1/user`;
  return async (request: Request): Promise<Principal | null> => {
    const token = bearer(request);
    if (!token) return null;
    const controller = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let cancelled = false;
    const cancel = () => {
      controller.abort();
      if (!cancelled && reader) { cancelled = true; void reader.cancel().catch(() => {}); }
    };
    let rejectCancelled: (error: Error) => void = () => {};
    const unavailable = () => new MonitoringUnavailable("Owner verification unavailable");
    const expired = new Promise<never>((_resolve, reject) => { rejectCancelled = reject; });
    const abort = () => { cancel(); rejectCancelled(unavailable()); };
    request.signal.addEventListener("abort", abort, { once: true });
    const timer = setTimeout(abort, AUTH_DEADLINE_MS);
    const verify = async (): Promise<Principal | null> => {
      if (request.signal.aborted) throw unavailable();
      const response = await fetcher(endpoint, {
        method: "GET", headers: { apikey: publishableKey, Authorization: "Bearer " + token, Accept: "application/json" },
        redirect: "error", cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer", signal: controller.signal,
      });
      reader = response.body?.getReader();
      // Includes a late response from a fixture/transport that ignored cancellation.
      if (controller.signal.aborted) { cancel(); throw unavailable(); }
      if (response.redirected || response.url !== endpoint) throw unavailable();
      if (response.status === 401 || response.status === 403) return null;
      if (response.status !== 200 || !reader || !/^application\/json(?:\s*;\s*charset=(?:utf-8|"utf-8"))?\s*$/i.test(response.headers.get("content-type") || "")) throw unavailable();
      const length = response.headers.get("content-length");
      if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_AUTH_BYTES)) throw unavailable();
      const chunks: Uint8Array[] = [];
      let bytes = 0;
      for (;;) {
        const { value, done } = await reader.read();
        if (controller.signal.aborted) throw unavailable();
        if (done) break;
        bytes += value.byteLength;
        if (bytes > MAX_AUTH_BYTES) throw unavailable();
        chunks.push(value);
      }
      const parsed: unknown = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)));
      const user = currentUser.safeParse(parsed);
      if (!user.success) throw unavailable();
      const ownerKey = createHash("sha256").update(JSON.stringify([
        "everymcp-monitoring-owner-v1", scope.accountId, scope.mode, scope.productKey, project, user.data.id,
      ])).digest("hex");
      return { scope: { ...scope }, ownerKey };
    };
    try { return await Promise.race([verify(), expired]); }
    catch { throw unavailable(); }
    finally { clearTimeout(timer); request.signal.removeEventListener("abort", abort); cancel(); }
  };
}
