// Deliberately unbound: no environment flag can activate local/synthetic storage.
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json({ error: "Recovery setup pending" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
}
