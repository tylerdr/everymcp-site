import {
  createAuditMcpHandler,
  createGatedAuditMcpHandler
} from "@/lib/audit-mcp";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const handler = createAuditMcpHandler();

export const POST = createGatedAuditMcpHandler(handler);
