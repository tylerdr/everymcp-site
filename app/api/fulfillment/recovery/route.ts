import { getStarterBinding } from "@/lib/recovery/binding";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  const binding = getStarterBinding();
  if (!binding) return Response.json({ error: "Recovery setup pending" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  return binding.handlers.recovery(request);
}
