import { NextResponse } from "next/server";
import { captureLead, LEAD_FOLLOW_UP_PATH, LEAD_RESOURCE_PATH, parseLeadInput } from "@/lib/lead-capture";

export const runtime = "nodejs";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Send a valid request body." }, { status: 400 });
  }

  const parsed = parseLeadInput(body);
  if (!parsed.ok) {
    return NextResponse.json({ ok: false, error: parsed.error }, { status: 400 });
  }

  const result = await captureLead(parsed.value);
  if (result.status === "captured" || result.status === "already_captured") {
    return NextResponse.json({
      ok: true,
      confirmation: {
        status: result.status === "captured" ? "confirmed" : "already_registered",
        resourcePath: LEAD_RESOURCE_PATH,
        followUpPath: LEAD_FOLLOW_UP_PATH,
        transactional: true
      }
    });
  }

  if (result.status === "confirmation_unavailable") {
    return NextResponse.json(
      {
        ok: false,
        saved: result.saved,
        retryable: true,
        resourcePath: LEAD_RESOURCE_PATH,
        error: "Your request reached storage, but confirmation is temporarily unavailable. Retry safely; duplicate submissions are deduplicated."
      },
      { status: 503, headers: { "Retry-After": "10" } }
    );
  }

  return NextResponse.json(
    {
      ok: false,
      saved: false,
      retryable: result.retryable,
      resourcePath: LEAD_RESOURCE_PATH,
      error: "Online lead capture is temporarily unavailable. Nothing was saved or sent. Please try again later."
    },
    { status: 503, headers: { "Retry-After": "10" } }
  );
}
