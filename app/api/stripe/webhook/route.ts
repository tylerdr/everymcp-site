// Deliberately unbound until account/mode, durable store and owner adapters are approved.
export const dynamic = "force-dynamic";
export async function POST() {
  return Response.json({ error: "Receipt setup pending" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
}
