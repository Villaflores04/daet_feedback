import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { hasDeskSession, sameOrigin } from "@/lib/desk-session";
import { supabaseStorageServer } from "@/lib/supabase-server";
import { scanBody } from "@/lib/pulse/words";
import type { FaceId } from "@/lib/pulse/types";

const SOURCES = new Set(["facebook", "google", "tripadvisor", "survey", "walkin", "other"]);
const FACES = new Set<FaceId>(["wow", "happy", "medium", "sad"]);
const MAX_ITEMS = 200;

/** Star ratings (1-5) from review sites map onto the four faces. */
function faceFromStars(stars: number): FaceId {
  return stars >= 5 ? "wow" : stars >= 4 ? "happy" : stars >= 3 ? "medium" : "sad";
}

/** Desk-only: add feedback collected outside the site (social media, review sites, surveys, walk-ins). */
export async function POST(request: Request) {
  if (!sameOrigin(request) || !await hasDeskSession()) return NextResponse.json({ error: "Please sign in to the admin desk again." }, { status: 401 });
  const payload = await request.json().catch(() => null);
  const items: unknown[] = Array.isArray(payload?.items) ? payload.items : [];
  if (!items.length || items.length > MAX_ITEMS) return NextResponse.json({ error: `Send between 1 and ${MAX_ITEMS} entries.` }, { status: 400 });

  const rows: Record<string, unknown>[] = [];
  const skipped: { index: number; reason: string }[] = [];
  items.forEach((raw, index) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    const body = String(item.body ?? "").trim().slice(0, 1000);
    const channelId = typeof item.channelId === "string" ? item.channelId : "";
    const source = String(item.source ?? "");
    const stars = Number(item.stars);
    if (!channelId) return skipped.push({ index, reason: "Choose a place." });
    if (!SOURCES.has(source)) return skipped.push({ index, reason: "Choose a source." });
    let face: FaceId | null = FACES.has(item.face as FaceId) ? (item.face as FaceId) : null;
    if (!face && Number.isFinite(stars) && stars >= 1 && stars <= 5) face = faceFromStars(Math.round(stars));
    if (!face && body) {
      const mood = scanBody(body);
      face = mood === "POS" ? "happy" : mood === "NEG" ? "sad" : "medium";
    }
    if (!face) return skipped.push({ index, reason: "Add a comment or a rating." });
    const when = Number(item.createdAt);
    rows.push({
      id: `imp-${randomUUID()}`,
      channel_id: channelId,
      parent_id: null,
      callsign: String(item.callsign || "Imported").trim().slice(0, 40) || "Imported",
      face,
      body,
      photo: null,
      source,
      created_at: new Date(Number.isFinite(when) && when > 0 && when <= Date.now() ? when : Date.now()).toISOString(),
    });
  });

  if (!rows.length) return NextResponse.json({ error: "Nothing could be added.", skipped }, { status: 400 });
  try {
    const { error } = await supabaseStorageServer().from("pulses").insert(rows);
    if (error) {
      if (error.code === "42703" || error.code === "23514") return NextResponse.json({ error: "Run the feedback-sources SQL migration in Supabase first, then try again." }, { status: 503 });
      throw error;
    }
    return NextResponse.json({ added: rows.length, skipped }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Could not save the imported feedback. Please try again." }, { status: 503 });
  }
}
