import { getBuyerAuth, buyerUnavailable } from "@/lib/buyer/auth";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: Request) { const auth = getBuyerAuth(); return auth ? auth.session(request) : buyerUnavailable(); }
