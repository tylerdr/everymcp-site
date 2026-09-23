import { getAuditMcpReadiness } from "@/lib/audit-mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(getAuditMcpReadiness(process.env), {
    headers: { "Cache-Control": "no-store" }
  });
}
