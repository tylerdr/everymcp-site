import { createHash } from "node:crypto";
import { describe, expect, it, vi } from "vitest";
import { fetchStarterKit } from "../lib/starter-kit-download";
import { buildStarterKit } from "../lib/starter-kit";

const href = "/api/fulfillment/starter-kit?session_id=cs_test_synthetic";
const packet = buildStarterKit();
const sha = (body: string) => createHash("sha256").update(body).digest("hex");
const headers = (body = packet) => ({ "content-type": "text/markdown; charset=utf-8", "x-everymcp-artifact-sha256": sha(body) });
const response = (body = packet) => new Response(body, { headers: headers(body) });

describe("starter kit browser delivery", () => {
  it("retries the same entitlement after a transient failure and validates the real packet", async () => {
    const request = vi.fn<typeof fetch>().mockResolvedValueOnce(new Response(null, { status: 503 })).mockResolvedValueOnce(response());
    await expect(fetchStarterKit(href, request)).rejects.toThrow("do not need to pay again");
    expect(await (await fetchStarterKit(href, request)).text()).toBe(packet);
    for (const [url, options] of request.mock.calls) {
      expect(url).toBe(href);
      expect(options).toMatchObject({ cache: "no-store", signal: expect.any(AbortSignal) });
    }
  });
  it("keeps rejected entitlement separate from successful delivery", async () => {
    await expect(fetchStarterKit(href, vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 403 })))).rejects.toThrow("Payment could not be verified");
  });
  it.each(["", "# An unrelated product", "# EveryMCP MCP Integration Starter Kit", packet.slice(0, packet.indexOf("## 7."))])("rejects incomplete producer packets even with matching digests", async (body) => {
    await expect(fetchStarterKit(href, vi.fn<typeof fetch>().mockResolvedValue(response(body)))).rejects.toThrow("incomplete");
  });
  it("rejects a truncated real packet against the original full digest", async () => {
    await expect(fetchStarterKit(href, vi.fn<typeof fetch>().mockResolvedValue(new Response(packet.slice(0, -50), { headers: headers() })))).rejects.toThrow("incomplete");
  });
  it("rejects a changed complete packet against the original digest", async () => {
    await expect(fetchStarterKit(href, vi.fn<typeof fetch>().mockResolvedValue(new Response(packet + "changed", { headers: headers() })))).rejects.toThrow("incomplete");
  });
  it.each<HeadersInit>([{}, { "content-type": "application/json", "x-everymcp-artifact-sha256": sha(packet) }])("rejects missing integrity or wrong content type", async (invalidHeaders) => {
    await expect(fetchStarterKit(href, vi.fn<typeof fetch>().mockResolvedValue(new Response(packet, { headers: invalidHeaders })))).rejects.toThrow("incomplete");
  });
  it("stops an oversized stream before consuming the remaining body", async () => {
    const cancel = vi.fn();
    let emitted = 0;
    const stream = new ReadableStream<Uint8Array>({ pull(controller) { emitted++; controller.enqueue(new Uint8Array(600_000)); }, cancel }, { highWaterMark: 0 });
    await expect(fetchStarterKit(href, vi.fn<typeof fetch>().mockResolvedValue(new Response(stream, { headers: headers() })))).rejects.toThrow("incomplete");
    expect(emitted).toBe(2);
    expect(cancel).toHaveBeenCalled();
  });
  it("times out even an adapter that ignores abort, then allows retry", async () => {
    const request = vi.fn<typeof fetch>().mockImplementationOnce(() => new Promise(() => {})).mockResolvedValueOnce(response());
    await expect(fetchStarterKit(href, request, 20)).rejects.toThrow("timed out");
    expect(request.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(await (await fetchStarterKit(href, request)).text()).toBe(packet);
  });
  it("times out and cancels a stalled body", async () => {
    const cancel = vi.fn();
    const stream = new ReadableStream<Uint8Array>({ pull() { return new Promise(() => {}); }, cancel });
    await expect(fetchStarterKit(href, vi.fn<typeof fetch>().mockResolvedValue(new Response(stream, { headers: headers() })), 20)).rejects.toThrow("timed out");
    expect(cancel).toHaveBeenCalled();
  });
});
