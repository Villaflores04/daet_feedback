import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createHmac } from "node:crypto";
import { supabaseServer } from "@/lib/supabase-server";
import { equal, sameOrigin } from "@/lib/desk-session";
import { reactionCounts, type Reaction } from "@/lib/pulse/reactions";

export const dynamic = "force-dynamic";
// Browser-scoped participation, not verified identity. Signed HttpOnly receipts
// prevent the client from claiming a previous vote just to decrement counts.
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const input = await request.json().catch(() => ({}));
  if (typeof input.id !== "string" || !/^[a-zA-Z0-9_-]{1,120}$/.test(input.id) || !["up", "down", null].includes(input.side)) return NextResponse.json({ error: "Invalid reaction." }, { status: 400 });
  try {
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secret) throw new Error("Reaction saving is not configured.");
    const sign = (side: string) => createHmac("sha256", secret).update(`reaction:${input.id}:${side}`).digest("hex");
    const name = `daet-r-${input.id}`;
    const [value, signature = ""] = ((await cookies()).get(name)?.value || "").split(".");
    const previous: Reaction = (value === "up" || value === "down") && equal(signature, sign(value)) ? value : null;
    const next: Reaction = input.side;
    const db = supabaseServer();
    for (let attempt = 0; attempt < 6; attempt++) {
      const row = await db.from("pulses").select("reacts_up,reacts_down").eq("id", input.id).single();
      if (row.error) throw new Error("This comment could not be loaded. Please refresh.");
      const counts = reactionCounts({ up: row.data.reacts_up, down: row.data.reacts_down }, previous, next);
      if (previous !== next) {
        // Compare-and-swap prevents concurrent visitors overwriting each other's counts.
        const saved = await db.from("pulses").update({ reacts_up: counts.up, reacts_down: counts.down }).eq("id", input.id).eq("reacts_up", row.data.reacts_up).eq("reacts_down", row.data.reacts_down).select("id");
        if (saved.error) throw new Error("Could not save your reaction. Please try again.");
        if (!saved.data?.length) continue;
      }
      const response = NextResponse.json({ reacts: counts, side: next }, { headers: { "cache-control": "no-store" } });
      response.cookies.set(name, `${next || "none"}.${sign(next || "none")}`, { httpOnly: true, sameSite: "lax", secure: new URL(request.url).protocol === "https:", path: "/", maxAge: 31536000 });
      return response;
    }
    return NextResponse.json({ error: "This comment is busy. Please try again." }, { status: 409 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save reaction." }, { status: 503 });
  }
}
