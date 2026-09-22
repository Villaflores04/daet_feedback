import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { supabaseStorageServer } from "@/lib/supabase-server";

export async function DELETE(request: Request) {
  const expected = process.env.ADMIN_DESK_KEY;
  if (!expected) return NextResponse.json({ error: "Set ADMIN_DESK_KEY in the deployment environment to enable suggestion removal." }, { status: 503 });
  const supplied = request.headers.get("x-admin-key") ?? "";
  const a = Buffer.from(supplied), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "The admin removal key is incorrect." }, { status: 401 });
  }
  const payload = await request.json().catch(() => null);
  if (typeof payload?.id !== "string" || !payload.id || payload.id.length > 200) {
    return NextResponse.json({ error: "Invalid suggestion." }, { status: 400 });
  }
  try {
    // Retain a tombstone so older browser caches cannot recreate removed suggestions.
    // Removing a suggestion must never delete an accepted place or its feedback.
    const { error } = await supabaseStorageServer().from("wishes").update({ status: "burned" }).eq("id", payload.id);
    if (error) throw error;
    return NextResponse.json({ id: payload.id });
  } catch {
    return NextResponse.json({ error: "Could not remove the suggestion. Check the server's Supabase service-role configuration and try again." }, { status: 503 });
  }
}
