import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    { ok: false, error: "Online inquiries are unavailable. Nothing was saved or sent. Email tai@sprinterconsulting.com about EveryMCP." },
    { status: 503 }
  );
}
