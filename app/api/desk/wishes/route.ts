import { createHash } from "node:crypto";
import { hasDeskSession, sameOrigin } from "@/lib/desk-session";
import { slugify } from "@/lib/pulse/ids";
import { NextResponse } from "next/server";
import { supabaseStorageServer } from "@/lib/supabase-server";

export async function DELETE(request: Request) {
  if (!sameOrigin(request) || !await hasDeskSession()) return NextResponse.json({ error: "Your admin session expired. Open the desk again." }, { status: 401 });
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

export async function POST(request: Request) {
  if (!sameOrigin(request) || !await hasDeskSession()) return NextResponse.json({ error: "Your admin session expired. Open the desk again." }, { status: 401 });
  const payload = await request.json().catch(() => null);
  if (typeof payload?.id !== "string" || !payload.id || payload.id.length > 200) return NextResponse.json({ error: "Invalid suggestion." }, { status: 400 });
  try {
    const db = supabaseStorageServer();
    const { data: wish, error } = await db.from("wishes").select("*").eq("id", payload.id).maybeSingle();
    if (error) throw error;
    if (!wish || wish.status === "burned") return NextResponse.json({ error: "This suggestion is no longer available." }, { status: 404 });
    // Stable identifiers make retries and repeated clicks create only one place.
    const suffix = createHash("sha256").update(wish.id).digest("hex").slice(0, 16);
    const channelId = wish.channel_id || `ch-wish-${suffix}`;
    const { data: existing, error: lookupError } = await db.from("channels").select("*").eq("id", channelId).maybeSingle();
    if (lookupError) throw lookupError;
    let channel = existing;
    if (!channel) {
      const entry = {
        id: channelId, slug: `${slugify(wish.name).slice(0, 80) || "place"}-${suffix}`,
        name: wish.name, category: wish.category, featured: false,
        cover: /^https?:\/\//.test(wish.photo || "") ? wish.photo : "",
        blurb: wish.why || wish.where_in_daet || "Recommended by a visitor.",
        about: [wish.where_in_daet, wish.why].filter(Boolean).join(" — ") || wish.name,
      };
      const { error: insertError } = await db.from("channels").upsert(entry, { onConflict: "id", ignoreDuplicates: true });
      if (insertError) throw insertError;
      const result = await db.from("channels").select("*").eq("id", channelId).single();
      if (result.error) throw result.error;
      channel = result.data;
    }
    const { data: updated, error: updateError } = await db.from("wishes").update({ status: "kept", channel_id: channelId }).eq("id", wish.id).neq("status", "burned").select("id").maybeSingle();
    if (updateError) throw updateError;
    if (!updated) return NextResponse.json({ error: "This suggestion was removed. Refresh the inbox." }, { status: 409 });
    return NextResponse.json({ channel, wishId: wish.id });
  } catch {
    return NextResponse.json({ error: "Could not add this place. Check the connection and try again." }, { status: 503 });
  }
}
