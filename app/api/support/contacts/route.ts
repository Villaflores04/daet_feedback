import { NextResponse } from "next/server";
import { contactFromRow, missingTable, supportDb } from "@/lib/support-db";

export const dynamic = "force-dynamic";

/** Public: the contact accounts the office chose to publish. */
export async function GET() {
  try {
    const { data, error } = await supportDb().from("support_contacts").select("*").order("sort", { ascending: true }).order("created_at", { ascending: true }).limit(50);
    if (error) {
      if (missingTable(error)) return NextResponse.json({ contacts: [], unavailable: true });
      throw error;
    }
    return NextResponse.json({ contacts: (data || []).map(contactFromRow) }, { headers: { "cache-control": "public, s-maxage=60, stale-while-revalidate=300" } });
  } catch { return NextResponse.json({ contacts: [], unavailable: true }, { status: 503 }); }
}
