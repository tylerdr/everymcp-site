import { afterEach, describe, expect, it, vi } from "vitest";
import { createHash } from "node:crypto";
import { createMonitoringOwner } from "../lib/monitoring/owner";
import { MonitoringUnavailable } from "../lib/monitoring/runtime";
import { buyerCookie } from "../lib/buyer/session";
import { ownerKey as kitOwnerKey } from "../lib/recovery/owner";
import { AUTH_URL, OWNER_CONFIG, TOKEN_A, USER_A, authResponse, ownerRequest } from "./fixtures/monitoring-node/owner-fixture";

afterEach(() => { vi.useRealTimers(); });
describe("monitoring authoritative owner adapter — fictional Auth only", () => {
  it("reads the fixed current-user endpoint every time with only the user's bearer and public key", async () => {
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => authResponse());
    const owner = createMonitoringOwner(OWNER_CONFIG, fetcher);
    const request = ownerRequest();
    const one = await owner(request), two = await owner(ownerRequest());
    expect(two).toEqual(one); expect(fetcher).toHaveBeenCalledTimes(2);
    const [url, options] = fetcher.mock.calls[0];
    expect(url).toBe(AUTH_URL);
    expect(options).toMatchObject({ method: "GET", redirect: "error", cache: "no-store", credentials: "omit", referrerPolicy: "no-referrer" });
    expect(options?.headers).toEqual({ apikey: OWNER_CONFIG.publishableKey, Authorization: "Bearer " + TOKEN_A, Accept: "application/json" });
    expect(options?.signal?.aborted).toBe(true);
    expect(one).toEqual({ scope: OWNER_CONFIG.scope, ownerKey: createHash("sha256").update(JSON.stringify(["everymcp-monitoring-owner-v1", OWNER_CONFIG.scope.accountId, "test", OWNER_CONFIG.scope.productKey, OWNER_CONFIG.project, USER_A.id])).digest("hex") });
    expect(one?.ownerKey).not.toBe(kitOwnerKey(OWNER_CONFIG.scope, OWNER_CONFIG.project, USER_A.id));
    expect(await owner(new Request(request.url, { headers: { authorization: "Bearer " + TOKEN_A } }))).toEqual(one);
  });
  it("ignores metadata, submitted ownership/entitlements and email changes; separates account/mode/product/project", async () => {
    let body: object = USER_A;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async url => authResponse(JSON.stringify(body), undefined, String(url)));
    const config = structuredClone(OWNER_CONFIG);
    const owner = createMonitoringOwner(config, fetcher), original = await owner(ownerRequest());
    body = { ...USER_A, email: "new@example.invalid", ownerKey: "f".repeat(64), user_metadata: { ownerKey: "f".repeat(64), monitoring: true }, app_metadata: { paid: true } };
    expect(await owner(ownerRequest())).toEqual(original);
    config.project = "z".repeat(20); config.scope.productKey = "retargeted"; config.publishableKey = "sb_publishable_different_fixture";
    expect(await owner(ownerRequest())).toEqual(original);
    for (const changed of [
      { ...OWNER_CONFIG, project: "b".repeat(20) },
      { ...OWNER_CONFIG, scope: { ...OWNER_CONFIG.scope, accountId: "acct_other" } },
      { ...OWNER_CONFIG, scope: { ...OWNER_CONFIG.scope, mode: "live" as const } },
      { ...OWNER_CONFIG, scope: { ...OWNER_CONFIG.scope, productKey: "other-monitoring" } },
    ]) expect((await createMonitoringOwner(changed, fetcher)(ownerRequest()))?.ownerKey).not.toBe(original?.ownerKey);
  });
  it("refuses missing, malformed, duplicated or competing credentials before Auth", async () => {
    const fetcher = vi.fn<typeof fetch>(); const owner = createMonitoringOwner(OWNER_CONFIG, fetcher);
    const cases: Record<string, string>[] = [
      {}, { authorization: "Bearer short" }, { authorization: "Bearer " + TOKEN_A + ", Bearer " + TOKEN_A },
      { cookie: buyerCookie + "=short" }, { cookie: `${buyerCookie}=${TOKEN_A}; ${buyerCookie}=${TOKEN_A}` },
      { authorization: "Bearer " + TOKEN_A, cookie: buyerCookie + "=" + TOKEN_A },
      { authorization: "Bearer " + TOKEN_A, cookie: buyerCookie + "=short" },
      { authorization: "Bearer " + TOKEN_A, cookie: buyerCookie },
      { authorization: "Bearer " + TOKEN_A, cookie: buyerCookie + " =short" },
    ];
    for (const headers of cases) expect(await owner(new Request("https://fictional.invalid/", { headers }))).toBeNull();
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("rejects invalid or privileged configuration without network", () => {
    for (const config of [
      { ...OWNER_CONFIG, project: "https://other.invalid" },
      { ...OWNER_CONFIG, publishableKey: "sb_secret_fictional_fixture_only" },
      { ...OWNER_CONFIG, scope: { ...OWNER_CONFIG.scope, productKey: "" } },
    ]) expect(() => createMonitoringOwner(config)).toThrow();
  });
  it("refuses malformed, missing, unconfirmed and anonymous identity fields", async () => {
    for (const fields of [{ id: "not-a-uuid" }, { email: "" }, { email_confirmed_at: null }, { email_confirmed_at: "not-a-date" }, { is_anonymous: true }, { is_anonymous: undefined }]) {
      const owner = createMonitoringOwner(OWNER_CONFIG, async () => authResponse(JSON.stringify({ ...USER_A, ...fields })));
      await expect(owner(ownerRequest())).rejects.toBeInstanceOf(MonitoringUnavailable);
    }
  });
  it("distinguishes authoritative denial from unavailable status, redirects, malformed bodies and wrong endpoints", async () => {
    for (const status of [401, 403]) expect(await createMonitoringOwner(OWNER_CONFIG, async () => authResponse(null, { status }))(ownerRequest())).toBeNull();
    for (const response of [
      authResponse(null, { status: 204 }), authResponse(null, { status: 302 }), authResponse(null, { status: 429 }), authResponse(null, { status: 503 }),
      authResponse("{not-json}"), authResponse(new Uint8Array([0xff, 0xfe])),
      authResponse(JSON.stringify(USER_A), { headers: { "content-type": "text/html" } }),
      authResponse(JSON.stringify(USER_A), undefined, "https://other.invalid/user"),
    ]) await expect(createMonitoringOwner(OWNER_CONFIG, async () => response)(ownerRequest())).rejects.toBeInstanceOf(MonitoringUnavailable);
    const redirect = authResponse(); Object.defineProperty(redirect, "redirected", { value: true });
    await expect(createMonitoringOwner(OWNER_CONFIG, async () => redirect)(ownerRequest())).rejects.toBeInstanceOf(MonitoringUnavailable);
  });
  it("caps streamed bytes and cancels without waiting on an uncooperative cancellation", async () => {
    const cancel = vi.fn(() => new Promise<void>(() => {}));
    const body = new ReadableStream<Uint8Array>({ start(c) { c.enqueue(Buffer.alloc(64_001)); }, cancel });
    const response = authResponse(body);
    await expect(createMonitoringOwner(OWNER_CONFIG, async () => response)(ownerRequest())).rejects.toBeInstanceOf(MonitoringUnavailable);
    expect(cancel).toHaveBeenCalledOnce();
    await expect(createMonitoringOwner(OWNER_CONFIG, async () => authResponse(null, { headers: { "content-type": "application/json", "content-length": "64001" } }))(ownerRequest())).rejects.toBeInstanceOf(MonitoringUnavailable);
  });
  it("bounds stalled headers and discards a late transport response", async () => {
    vi.useFakeTimers(); let deliver!: (response: Response) => void;
    const fetcher = vi.fn<typeof fetch>().mockImplementation(() => new Promise(resolve => { deliver = resolve; }));
    const pending = createMonitoringOwner(OWNER_CONFIG, fetcher)(ownerRequest());
    const assertion = expect(pending).rejects.toBeInstanceOf(MonitoringUnavailable);
    await vi.advanceTimersByTimeAsync(5000); await assertion;
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
    const cancel = vi.fn(); deliver(authResponse(new ReadableStream({ cancel })));
    await vi.advanceTimersByTimeAsync(0); expect(cancel).toHaveBeenCalledOnce();
  });
  it("uses one deadline for headers plus a stalled body and respects request cancellation", async () => {
    vi.useFakeTimers(); const cancel = vi.fn();
    const fetcher = vi.fn<typeof fetch>().mockImplementation(async () => {
      await new Promise(resolve => setTimeout(resolve, 4000));
      return authResponse(new ReadableStream({ start(c) { c.enqueue(Buffer.from('{"id":')); }, cancel }));
    });
    const pending = createMonitoringOwner(OWNER_CONFIG, fetcher)(ownerRequest());
    const assertion = expect(pending).rejects.toBeInstanceOf(MonitoringUnavailable);
    await vi.advanceTimersByTimeAsync(5000); await assertion; expect(cancel).toHaveBeenCalledOnce();
    const controller = new AbortController(); controller.abort();
    const aborted = new Request(ownerRequest(), { signal: controller.signal });
    await expect(createMonitoringOwner(OWNER_CONFIG, fetcher)(aborted)).rejects.toBeInstanceOf(MonitoringUnavailable);
    expect(fetcher).toHaveBeenCalledOnce();
  });
});
