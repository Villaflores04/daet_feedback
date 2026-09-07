import { NextResponse } from "next/server";
import { fetchAnalytics } from "@/lib/data";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const data = await fetchAnalytics();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store, max-age=0" }
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analytics failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
