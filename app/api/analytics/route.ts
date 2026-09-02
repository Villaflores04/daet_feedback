import { NextResponse } from "next/server";
import { fetchAnalytics } from "@/lib/data";

export async function GET() {
  try {
    return NextResponse.json(await fetchAnalytics());
  } catch (e) {
    const message = e instanceof Error ? e.message : "Analytics failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
