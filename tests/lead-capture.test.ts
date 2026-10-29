import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/lead/route";
import { captureLead, leadIdempotencyKey, type LeadInput } from "@/lib/lead-capture";

const input: LeadInput = { name: "Test Buyer", email: "buyer@example.test", message: "Connect our tools", intent: "catalog", consent: true };
const request = (body: unknown = input) => new Request("https://everymcp.example/api/lead", { method: "POST", body: JSON.stringify(body) });
const provider = (status: number, body: unknown = {}) => new Response(JSON.stringify(body), { status });

beforeEach(() => {
  vi.stubEnv("EVERYMCP_LEAD_STORAGE_URL", "https://provider.example.test/leads");
  vi.stubEnv("EVERYMCP_LEAD_STORAGE_TOKEN", "synthetic-test-token");
});
afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); vi.useRealTimers(); });

describe("lead outcome recovery through the real route and adapter", () => {
  it("retains uncertainty after a provider saved the request but its response was lost, then retries with the same key", async () => {
    const seen = new Set<string>();
    const keys: string[] = [];
    vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
      const key = (init.headers as Record<string, string>)["Idempotency-Key"];
      keys.push(key);
      if (!seen.has(key)) { seen.add(key); throw new TypeError("response lost after commit"); }
      return provider(409, { confirmation_status: "sent" });
    }));
    const first = await POST(request());
    expect(first.status).toBe(503);
    expect(first.headers.get("Retry-After")).toBe("10");
    expect(await first.json()).toMatchObject({ ok: false, saved: null, retryable: true, resourcePath: "/methodology" });
    const retry = await POST(request({ ...input, email: " BUYER@EXAMPLE.TEST " }));
    expect(retry.status).toBe(200);
    expect(await retry.json()).toMatchObject({ ok: true, confirmation: { status: "already_registered", resourcePath: "/methodology" } });
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe(keys[1]);
    expect(seen.size).toBe(1);
  });

  it.each([408, 425, 429, 500, 502, 503])("reports HTTP %i as unknown instead of claiming nothing was saved", async (status) => {
    vi.stubGlobal("fetch", vi.fn(async () => provider(status)));
    const response = await POST(request());
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body).toMatchObject({ ok: false, saved: null, retryable: true });
    expect(body.error).toContain("could not confirm");
    expect(body.error).not.toContain("Nothing was saved");
  });

  it("bounds the provider timeout and retains an unknown outcome", async () => {
    vi.useFakeTimers();
    vi.stubGlobal("fetch", vi.fn((_url: string, init: RequestInit) => new Promise<Response>((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(new DOMException("Aborted", "AbortError")));
    })));
    const result = captureLead(input);
    await vi.advanceTimersByTimeAsync(5_000);
    await expect(result).resolves.toEqual({ status: "outcome_unknown", retryable: true });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("does not call a provider when configuration is missing", async () => {
    vi.stubEnv("EVERYMCP_LEAD_STORAGE_TOKEN", "");
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    const response = await POST(request());
    expect(await response.json()).toMatchObject({ ok: false, saved: false, resourcePath: "/methodology" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects invalid consent before a provider call", async () => {
    const fetchMock = vi.fn(); vi.stubGlobal("fetch", fetchMock);
    expect((await POST(request({ ...input, consent: false }))).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it.each([200, 409])("does not claim confirmation for HTTP %i without provider confirmation", async (status) => {
    vi.stubGlobal("fetch", vi.fn(async () => provider(status)));
    const response = await POST(request());
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ ok: false, saved: true, retryable: true });
  });

  it("preserves a confirmed successful request", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => provider(201, { confirmation_status: "queued" })));
    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, confirmation: { status: "confirmed" } });
  });

  it("keeps the existing identity-plus-intent key contract, without implying distinct same-intent inquiries", () => {
    expect(leadIdempotencyKey(input)).toBe(leadIdempotencyKey({ ...input, email: input.email }));
    expect(leadIdempotencyKey(input)).not.toBe(leadIdempotencyKey({ ...input, intent: "sponsor" }));
    expect(leadIdempotencyKey(input)).not.toBe(leadIdempotencyKey({ ...input, email: "second@example.test" }));
    expect(leadIdempotencyKey(input)).not.toContain(input.email);
  });
});
