import { z } from "zod";
import { MonitoringDenied, type Principal, type Scope } from "./runtime";
import { controlEqual, WatchlistConflict, type Watchlist } from "./control-contract";
import { WatchlistSelectionError } from "./watchlist-selection";
import type { createOwnedMonitoringWorkflow } from "./owned-workflow";
const headers = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
const publicWatchlist = (row: Watchlist | null) => row && ({ id: row.watchlistId, version: row.version, slugs: row.slugs, enabled: row.enabled, configuredAt: row.configuredAt });

/** Unbound owner handlers. No hosted route, Auth configuration or provider setup is activated. */
export function createOwnedMonitoringHandlers(config: { origin: string; scope: Scope; authenticateOwner(request: Request): Promise<Principal | null>; workflow: ReturnType<typeof createOwnedMonitoringWorkflow>; recover(request: Request, id: string): Promise<Buffer | null> }) {
  const origin = new URL(config.origin);
  if (origin.origin !== config.origin || origin.protocol !== "https:" && !(config.scope.mode === "test" && ["localhost", "127.0.0.1"].includes(origin.hostname) && origin.protocol === "http:")) throw new Error("Owned monitoring origin unavailable");
  async function owner(request: Request) {
    const result = await config.authenticateOwner(request);
    if (!result || !controlEqual(result.scope, config.scope) || !/^[a-f0-9]{64}$/.test(result.ownerKey)) throw new MonitoringDenied("Authentication required");
    return result.ownerKey;
  }
  async function body(request: Request) {
    if (request.headers.get("origin") !== config.origin || ![null, "same-origin", "none"].includes(request.headers.get("sec-fetch-site"))) throw new MonitoringDenied("Same-origin request required");
    if (!/^application\/json(?:;\s*charset=utf-8)?$/i.test(request.headers.get("content-type") || "")) throw new SyntaxError("JSON required");
    const length = request.headers.get("content-length"); if (length !== null && (!/^\d+$/.test(length) || Number(length) > 2048)) throw new SyntaxError("Body too large");
    const reader = request.body?.getReader(); if (!reader) throw new SyntaxError("Body required");
    let timer: ReturnType<typeof setTimeout> | undefined;
    const expired = new Promise<never>((_resolve, reject) => { timer = setTimeout(() => reject(new SyntaxError("Body deadline exceeded")), 2000); });
    const chunks: Uint8Array[] = []; let size = 0;
    try {
      for (;;) { const part = await Promise.race([reader.read(), expired]); if (request.signal.aborted) throw new SyntaxError("Request canceled"); if (part.done) break; size += part.value.byteLength; if (size > 2048) throw new SyntaxError("Body too large"); chunks.push(part.value); }
      return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks))) as unknown;
    } finally { clearTimeout(timer); void reader.cancel().catch(() => {}); }
  }
  const errorResponse = (error: unknown) => {
    if (error instanceof WatchlistSelectionError) return Response.json({ error: "This selection cannot be monitored under the current source limits. Every canonical reference counts; select at most two source URLs on one host.", reasons: error.selection.reasons, sourceCount: error.selection.sourceCount, hostCount: error.selection.hostCount, limits: { sourceCount: 2, hostCount: 1 } }, { status: 422, headers });
    return Response.json({ error: error instanceof MonitoringDenied ? "Access denied" : error instanceof WatchlistConflict ? "Watchlist changed; reload and review your selection" : error instanceof SyntaxError || error instanceof z.ZodError ? "Invalid monitoring request" : "Monitoring unavailable" }, { status: error instanceof MonitoringDenied ? 403 : error instanceof WatchlistConflict ? 409 : error instanceof SyntaxError || error instanceof z.ZodError ? 400 : 503, headers });
  };
  return {
    async GET(request: Request) {
      try { return Response.json({ watchlist: publicWatchlist(await config.workflow.current(await owner(request))) }, { headers }); } catch (error) { return errorResponse(error); }
    },
    async PUT(request: Request) {
      try { const key = await owner(request); const input = await body(request); return Response.json({ watchlist: publicWatchlist(await config.workflow.configure(key, input)) }, { headers }); } catch (error) { return errorResponse(error); }
    },
    async POST(request: Request) {
      try { const key = await owner(request); const input = z.object({ kind: z.enum(["capture", "report"]) }).strict().parse(await body(request)); return Response.json(await config.workflow.prepare(key, input.kind), { headers }); } catch (error) { return errorResponse(error); }
    },
    async GETReport(request: Request) {
      try {
        const params = new URL(request.url).searchParams;
        if ([...params.keys()].some(key => key !== "jobId") || params.getAll("jobId").length !== 1 || !/^[a-f0-9]{64}$/.test(params.get("jobId") || "")) return Response.json({ error: "Report unavailable" }, { status: 404, headers });
        const bytes = await config.recover(request, params.get("jobId")!);
        return bytes ? new Response(new Uint8Array(bytes), { headers: { ...headers, "Content-Type": "text/markdown; charset=utf-8", "Content-Disposition": 'attachment; filename="monitoring-report.md"' } }) : Response.json({ error: "Report unavailable" }, { status: 404, headers });
      } catch (error) { return errorResponse(error); }
    },
  };
}
