import { NextResponse } from "next/server";
import { hasDeskSession, sameOrigin } from "@/lib/desk-session";
import { supabaseStorageServer } from "@/lib/supabase-server";

export async function DELETE(request: Request) {
  if (!sameOrigin(request) || !await hasDeskSession()) return NextResponse.json({ error: "Please sign in to the admin desk again." }, { status: 401 });
  const body = await request.json().catch(() => null);
  // Bulk: a list of ids (up to 500) or a whole import batch.
  if (Array.isArray(body?.ids) || typeof body?.batch === "string") {
    try {
      const db = supabaseStorageServer();
      if (Array.isArray(body.ids)) {
        const ids: string[] = body.ids.filter((x: unknown): x is string => typeof x === "string" && /^[a-zA-Z0-9_-]{1,120}$/.test(x));
        if (!ids.length || ids.length > 500) return NextResponse.json({ error: "Choose between 1 and 500 entries." }, { status: 400 });
        const { error, count } = await db.from("pulses").delete({ count: "exact" }).in("id", ids);
        if (error) throw error;
        return NextResponse.json({ deleted: count ?? ids.length });
      }
      const batch = body.batch.trim();
      if (!batch || batch.length > 120) return NextResponse.json({ error: "Invalid import." }, { status: 400 });
      const { error, count } = await db.from("pulses").delete({ count: "exact" }).eq("ext->>batch", batch);
      if (error) throw error;
      return NextResponse.json({ deleted: count ?? 0 });
    } catch {
      return NextResponse.json({ error: "Could not delete the entries. Please try again." }, { status: 503 });
    }
  }
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
