import { NextResponse } from "next/server";
import { fetchSpots } from "@/lib/data";

export async function GET() {
  try {
    return NextResponse.json(await fetchSpots());
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to load spots";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
