import { NextResponse } from "next/server";
import { hasDeskSession, sameOrigin } from "@/lib/desk-session";
import { supabaseStorageServer } from "@/lib/supabase-server";
import { CATEGORIES } from "@/lib/pulse/types";

async function mutate(request: Request) {
  if (!sameOrigin(request) || !await hasDeskSession()) return NextResponse.json({ error: "Please sign in to the admin desk again." }, { status: 401 });
  const body = await request.json().catch(() => null);
  if (!body || typeof body.id !== "string" || !/^[a-zA-Z0-9_-]{1,120}$/.test(body.id)) return NextResponse.json({ error: "Invalid place ID." }, { status: 400 });
  try {
    const db = supabaseStorageServer();
    if (request.method === "DELETE") {
      const { error } = await db.from("channels").delete().eq("id", body.id);
      if (error) throw error;
      return NextResponse.json({ id: body.id });
    }
    const { name, category, blurb, about, cover } = body;
    if (typeof name !== "string" || name.trim().length < 2 || name.length > 120 || !CATEGORIES.includes(category) || typeof blurb !== "string" || blurb.length > 1000 || typeof about !== "string" || about.length > 5000 || typeof cover !== "string" || cover.length > 2048 || (cover && !/^https?:\/\//.test(cover) && !/^\/(?!\/)/.test(cover))) {
      return NextResponse.json({ error: "Check the place name, category, description, and photo." }, { status: 400 });
    }
    const data = { name: name.trim(), category, blurb: blurb.trim(), about: about.trim(), cover };
    let query;
    if (request.method === "POST") {
      if (typeof body.slug !== "string" || !/^[a-z0-9-]{1,180}$/.test(body.slug)) return NextResponse.json({ error: "Invalid place link." }, { status: 400 });
      // Retry-safe creation; the client keeps this ID until saving succeeds.
      const created = await db.from("channels").upsert({ ...data, id: body.id, slug: body.slug, featured: Boolean(body.featured) }, { onConflict: "id", ignoreDuplicates: true });
      if (created.error) throw created.error;
      query = db.from("channels").select("*").eq("id", body.id).single();
    } else {
      query = db.from("channels").update(data).eq("id", body.id).select("*").single();
    }
    const result = await query;
    if (result.error) throw result.error;
    return NextResponse.json(result.data);
  } catch {
    return NextResponse.json({ error: "Could not save this change. Please retry; check the server's Supabase configuration if it continues." }, { status: 503 });
  }
}
export const POST = mutate;
export const PATCH = mutate;
export const DELETE = mutate;
