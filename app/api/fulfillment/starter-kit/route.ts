import { NextResponse } from "next/server";
import { starterKit, starterKitFilename } from "@/lib/starter-kit";
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

  return new NextResponse(starterKit, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${starterKitFilename}"`,
      "Content-Type": "text/markdown; charset=utf-8"
    }
  });
}
