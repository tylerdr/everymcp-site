import { describe, expect, it, vi } from "vitest";
import { fetchStarterKit } from "../lib/starter-kit-download";

const href = "/api/fulfillment/starter-kit?session_id=cs_test_synthetic";
const packet = "# EveryMCP MCP Integration Starter Kit\n\nSynthetic test packet.";

describe("starter kit browser delivery", () => {
  it("retries the same entitlement after a transient failure and validates the packet", async () => {
    const request = vi.fn<typeof fetch>()
      .mockResolvedValueOnce(new Response('{"error":"unavailable"}', { status: 503 }))
      .mockResolvedValueOnce(new Response(packet, { headers: { "content-type": "text/markdown; charset=utf-8" } }));
    await expect(fetchStarterKit(href, request)).rejects.toThrow("do not need to pay again");
    expect(await (await fetchStarterKit(href, request)).text()).toBe(packet);
    expect(request.mock.calls).toEqual([[href, { cache: "no-store" }], [href, { cache: "no-store" }]]);
  });

  it("keeps rejected entitlement separate from successful delivery", async () => {
    await expect(fetchStarterKit(href, vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status: 403 })))).rejects.toThrow("Payment could not be verified");
  });

  it.each([
    ["application/json", '{"error":"unavailable"}'],
    ["text/markdown", ""],
    ["text/markdown", "# An unrelated product"],
    ["text/markdown", packet + "x".repeat(1_000_000)]
  ])("rejects a non-kit or incomplete response (%s)", async (type, body) => {
    const request = vi.fn<typeof fetch>().mockResolvedValue(new Response(body, { headers: { "content-type": type } }));
    await expect(fetchStarterKit(href, request)).rejects.toThrow();
  });
});
