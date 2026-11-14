import { NextResponse } from "next/server";
import { hasDeskSession, sameOrigin } from "@/lib/desk-session";
import { supabaseServer } from "@/lib/supabase-server";
import { resetAllRewards } from "@/lib/reward-reset";
export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  if (!sameOrigin(request) || !await hasDeskSession()) return NextResponse.json({ error: "Your admin session expired. Open the desk again." }, { status: 401 });
  try { return NextResponse.json({ resetAt: await resetAllRewards(supabaseServer()) }); }
  catch { return NextResponse.json({ error: "Could not reset points. Check that the reward_claims table exists." }, { status: 503 }); }
}
