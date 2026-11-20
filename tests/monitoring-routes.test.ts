import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../lib/monitoring/runtime", async importOriginal => ({ ...await importOriginal<typeof import("../lib/monitoring/runtime")>(), getMonitoringRuntime: vi.fn(() => null) }));
import { getMonitoringRuntime } from "../lib/monitoring/runtime";
import { POST } from "../app/api/monitoring/run/route";
import { GET } from "../app/api/monitoring/recovery/route";
const bind = vi.mocked(getMonitoringRuntime);
afterEach(() => { bind.mockReturnValue(null); vi.useRealTimers(); });
const runRequest = (body: string) => new Request("https://fictional.invalid/api/monitoring/run", { method: "POST", body });
describe("default-off monitoring Node routes", () => {
  it("returns private 503 before reading any input when no production binding exists", async () => {
    const request = runRequest("invalid"); const read = vi.spyOn(request.body!, "getReader");
    const result = await POST(request);
    expect(result.status).toBe(503); expect(result.headers.get("cache-control")).toBe("private, no-store"); expect(read).not.toHaveBeenCalled();
    expect((await GET(new Request("https://fictional.invalid/api/monitoring/recovery?jobId=" + "a".repeat(64)))).status).toBe(503);
  });
  it("accepts only a job reference, never posted evidence/success, and caps bytes", async () => {
    const run = vi.fn(); bind.mockReturnValue({ run, recover: vi.fn() });
    expect((await POST(runRequest(JSON.stringify({ jobId: "a".repeat(64), success: true })))).status).toBe(400);
    expect((await POST(runRequest(" ".repeat(129)))).status).toBe(400);
    expect(run).not.toHaveBeenCalled();
    await POST(runRequest(JSON.stringify({ jobId: "a".repeat(64) })));
    expect(run).toHaveBeenCalledOnce();
  });
  it("cancels a stalled body on its bounded read deadline", async () => {
    vi.useFakeTimers(); const cancel = vi.fn(), run = vi.fn(); bind.mockReturnValue({ run, recover: vi.fn() });
    const stream = new ReadableStream<Uint8Array>({ start(controller) { controller.enqueue(Buffer.from('{"jobId":')); }, cancel });
    const req = new Request("https://fictional.invalid/api/monitoring/run", { method: "POST", body: stream, duplex: "half" } as RequestInit);
    const pending = POST(req); await vi.advanceTimersByTimeAsync(2001);
    expect((await pending).status).toBe(503); expect(cancel).toHaveBeenCalledOnce(); expect(run).not.toHaveBeenCalled();
  });
  it("serves only exact recovered original markdown with private/no-store and hides absent/denied reports", async () => {
    const recover = vi.fn().mockResolvedValue(Buffer.from("fictional original\n")); bind.mockReturnValue({ run: vi.fn(), recover });
    const url = "https://fictional.invalid/api/monitoring/recovery?jobId=" + "a".repeat(64);
    expect((await GET(new Request(url + "&jobId=" + "b".repeat(64)))).status).toBe(400);
    const result = await GET(new Request(url)); expect(await result.text()).toBe("fictional original\n"); expect(result.headers.get("cache-control")).toBe("private, no-store");
    recover.mockResolvedValue(null); expect((await GET(new Request(url))).status).toBe(404);
  });
});
