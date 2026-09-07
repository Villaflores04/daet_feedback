import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json({ admin: isAdminRequest() }, { headers: { "Cache-Control": "no-store" } });
}
