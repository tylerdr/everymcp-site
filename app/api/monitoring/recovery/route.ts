import { getMonitoringRuntime } from "@/lib/monitoring/runtime";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
export async function GET(request: Request) {
  const binding = getMonitoringRuntime();
  if (!binding) return Response.json({ error: "Monitoring runtime unavailable" }, { status: 503, headers });
  try {
    const url = new URL(request.url);
    const jobId = url.searchParams.get("jobId");
    if (!jobId || url.searchParams.size !== 1 || !/^[a-f0-9]{64}$/.test(jobId)) return Response.json({ error: "Invalid job reference" }, { status: 400, headers });
    const report = await binding.recover(request, jobId);
    if (!report) return Response.json({ error: "Report unavailable" }, { status: 404, headers });
    return new Response(new Uint8Array(report), { headers: { ...headers, "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": 'attachment; filename="source-history.md"' } });
  } catch { return Response.json({ error: "Monitoring unavailable" }, { status: 503, headers }); }
}
