import { getMonitoringRuntime, MonitoringDenied } from "@/lib/monitoring/runtime";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function POST(request: Request) {
  const binding = getMonitoringRuntime();
  if (!binding) return Response.json({ error: "Monitoring runtime unavailable" }, { status: 503, headers });
  try {
    const reader = request.body?.getReader();
    if (!reader) return Response.json({ error: "Invalid job reference" }, { status: 400, headers });
    const chunks: Uint8Array[] = []; let size = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const deadline = new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new Error("Request body deadline exceeded")), 2000); });
    try {
      while (true) {
        const part = await Promise.race([reader.read(), deadline]); if (part.done) break;
        size += part.value.byteLength;
        if (size > 128) return Response.json({ error: "Invalid job reference" }, { status: 400, headers });
        chunks.push(part.value);
      }
    } finally { clearTimeout(timer); void reader.cancel().catch(() => undefined); }
    const text = Buffer.concat(chunks).toString("utf8");
    const body: unknown = JSON.parse(text);
    if (!body || typeof body !== "object" || Object.keys(body).length !== 1 || !("jobId" in body) || typeof body.jobId !== "string" || !/^[a-f0-9]{64}$/.test(body.jobId)) return Response.json({ error: "Invalid job reference" }, { status: 400, headers });
    return Response.json(await binding.run(request, body.jobId), { headers });
  } catch (error) {
    return Response.json({ error: error instanceof MonitoringDenied ? "Access denied" : "Monitoring unavailable" }, { status: error instanceof MonitoringDenied ? 403 : 503, headers });
  }
}
