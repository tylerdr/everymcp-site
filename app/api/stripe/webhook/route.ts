import { getStarterBinding } from "@/lib/recovery/binding";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function POST(request: Request) {
  const binding = getStarterBinding();
  if (!binding) return Response.json({ error: "Receipt setup pending" }, { status: 503, headers: { "Cache-Control": "private, no-store" } });
  return binding.handlers.webhook(request);
}
