import { NextResponse } from "next/server";
import { hasDeskSession, sameOrigin } from "@/lib/desk-session";
import { supabaseStorageServer } from "@/lib/supabase-server";

export async function DELETE(request: Request) {
  if (!sameOrigin(request) || !await hasDeskSession()) return NextResponse.json({ error: "Please sign in to the admin desk again." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (typeof body?.id !== "string" || !/^[a-zA-Z0-9_-]{1,120}$/.test(body.id)) return NextResponse.json({ error: "Invalid comment ID." }, { status: 400 });
  try {
    // The schema cascades deletion to replies when deleting a root comment.
    const { error } = await supabaseStorageServer().from("pulses").delete().eq("id", body.id);
    if (error) throw error;
    return NextResponse.json({ id: body.id });
  } catch {
    return NextResponse.json({ error: "Could not delete the comment. Please try again." }, { status: 503 });
  }
}
