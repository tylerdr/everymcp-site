import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { buildStarterKit, starterKitFilename } from "@/lib/starter-kit";
import { getStarterBinding } from "@/lib/recovery/binding";
import { verifyPaidSession } from "@/lib/stripe-fulfillment";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionId = new URL(request.url).searchParams.get("session_id")?.trim() || null;
  const result = await verifyPaidSession(sessionId, "starter");

  if (result.status === "missing") {
    return NextResponse.json({ error: "Checkout session is required" }, { status: 400 });
  }
  if (result.status === "unavailable") {
    return NextResponse.json({ error: "Delivery verification is temporarily unavailable" }, { status: 503 });
  }
  if (result.status !== "paid") {
    return NextResponse.json({ error: "A completed payment is required before delivery" }, { status: 403 });
  }

  // Only the verified paid session may carry a goal into delivery. The kit builder
  // validates the bounded goal again; legacy/no-goal purchases keep the generic kit.
  const binding = getStarterBinding();
  let starterKit: string;
  try {
    if (binding) {
      const stored = await binding.packet(sessionId!);
      if (!stored) return NextResponse.json({ error: "A completed payment is required before delivery" }, { status: 403 });
      starterKit = stored;
    } else {
      // Only historical unbound rights may use the old delivery path. New
      // owned-contract sessions must retry their immutable snapshot after rollback.
      const metadata = result.session.metadata || {};
      if (["fulfillment_owner", "fulfillment_auth_project", "pricing_policy"].some((key) => key in metadata)) {
        return NextResponse.json({ error: "Paid snapshot temporarily unavailable; retry this link" }, { status: 503 });
      }
      starterKit = buildStarterKit(result.session.metadata?.acquisition_goal);
    }
  } catch { return NextResponse.json({ error: "Paid snapshot temporarily unavailable; retry this link" }, { status: 503 }); }
  return new NextResponse(starterKit, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${starterKitFilename}"`,
      "Content-Type": "text/markdown; charset=utf-8",
      "X-EveryMCP-Artifact-SHA256": createHash("sha256").update(starterKit).digest("hex")
    }
  });
}
