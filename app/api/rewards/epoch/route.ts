import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { lastRewardReset } from "@/lib/reward-reset";
export const dynamic = "force-dynamic";

export async function GET() {
  try { return NextResponse.json({ epoch: await lastRewardReset(supabaseServer()) }, { headers: { "cache-control": "no-store" } }); }
  catch { return NextResponse.json({ epoch: 0 }); }
}
