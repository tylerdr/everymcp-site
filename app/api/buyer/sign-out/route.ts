import { signOutBuyer } from "@/lib/buyer/auth";
export const runtime = "nodejs";
export async function POST(request: Request) { return signOutBuyer(request); }
