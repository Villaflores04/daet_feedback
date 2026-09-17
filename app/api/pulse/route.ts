import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const faces = new Set(["wow", "happy", "medium", "sad"]);
const categories = new Set(["Coast", "Heritage", "Island", "Civic", "Park"]);

function toMillis(value: string | number | null | undefined) {
  const time = typeof value === "number" ? value : Date.parse(value || "");
  return Number.isFinite(time) ? time : Date.now();
}

function pulseFromRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    channelId: String(row.channel_id),
    parentId: row.parent_id ? String(row.parent_id) : null,
    callsign: String(row.callsign || "Visitor"),
    face: String(row.face),
    body: String(row.body || ""),
    photo: row.photo ? String(row.photo) : undefined,
    createdAt: toMillis(row.created_at as string),
    reacts: {
      up: Number(row.reacts_up || 0),
      down: Number(row.reacts_down || 0),
    },
  };
}

function wishFromRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    name: String(row.name || ""),
    where: String(row.where_in_daet || ""),
    why: String(row.why || ""),
    category: String(row.category),
    callsign: String(row.callsign || "Visitor"),
    photo: row.photo ? String(row.photo) : undefined,
    status: String(row.status || "open"),
    channelId: row.channel_id ? String(row.channel_id) : undefined,
    createdAt: toMillis(row.created_at as string),
  };
}

function channelFromRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    slug: String(row.slug),
    name: String(row.name),
    category: String(row.category),
    featured: Boolean(row.featured),
    cover: String(row.cover || ""),
    blurb: String(row.blurb || ""),
    about: String(row.about || ""),
  };
}

export async function GET() {
  try {
    const db = supabaseServer();
    const [channels, pulses, wishes] = await Promise.all([
      db
        .from("channels")
        .select("id,slug,name,category,featured,cover,blurb,about")
        .order("name"),
      db
        .from("pulses")
        .select(
          "id,channel_id,parent_id,callsign,face,body,photo,reacts_up,reacts_down,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
      db
        .from("wishes")
        .select(
          "id,name,where_in_daet,why,category,callsign,photo,status,channel_id,created_at",
        )
        .order("created_at", { ascending: false })
        .limit(500),
    ]);
    const error = channels.error || pulses.error || wishes.error;
    if (error) throw error;
    return NextResponse.json(
      {
        channels: (channels.data || []).map(channelFromRow),
        pulses: (pulses.data || []).map(pulseFromRow),
        wishes: (wishes.data || []).map(wishFromRow),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Shared feedback is unavailable.",
      },
      { status: 503 },
    );
  }
}

export async function POST(request: Request) {
  const payload = await request.json().catch(() => ({}));
  try {
    const db = supabaseServer();
    if (payload.action === "pulse") {
      const pulse = payload.pulse || {};
      if (
        !faces.has(pulse.face) ||
        typeof pulse.channelId !== "string" ||
        !pulse.channelId ||
        typeof pulse.id !== "string"
      ) {
        return NextResponse.json(
          { error: "Invalid feedback." },
          { status: 400 },
        );
      }
      const { data, error } = await db
        .from("pulses")
        .upsert(
          {
            id: pulse.id,
            channel_id: pulse.channelId,
            parent_id: pulse.parentId || null,
            callsign:
              String(pulse.callsign || "Visitor")
                .trim()
                .slice(0, 40) || "Visitor",
            face: pulse.face,
            body: String(pulse.body || "")
              .trim()
              .slice(0, 1000),
            // Local image blobs are intentionally not stored in the shared database.
            photo:
              typeof pulse.photo === "string" &&
              /^https?:\/\//.test(pulse.photo)
                ? pulse.photo
                : null,
            created_at: new Date(
              Number(pulse.createdAt) || Date.now(),
            ).toISOString(),
          },
          { onConflict: "id", ignoreDuplicates: true },
        )
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(pulseFromRow(data), { status: 201 });
    }
    if (payload.action === "wish") {
      const wish = payload.wish || {};
      if (
        typeof wish.id !== "string" ||
        String(wish.name || "").trim().length < 3 ||
        !categories.has(wish.category)
      ) {
        return NextResponse.json(
          { error: "Invalid place suggestion." },
          { status: 400 },
        );
      }
      const { data, error } = await db
        .from("wishes")
        .upsert(
          {
            id: wish.id,
            name: String(wish.name).trim().slice(0, 120),
            where_in_daet: String(wish.where || "")
              .trim()
              .slice(0, 160),
            why: String(wish.why || "")
              .trim()
              .slice(0, 1000),
            category: wish.category,
            callsign:
              String(wish.callsign || "Visitor")
                .trim()
                .slice(0, 40) || "Visitor",
            photo: null,
            status: "open",
            created_at: new Date(
              Number(wish.createdAt) || Date.now(),
            ).toISOString(),
          },
          { onConflict: "id", ignoreDuplicates: true },
        )
        .select()
        .single();
      if (error) throw error;
      return NextResponse.json(wishFromRow(data), { status: 201 });
    }
    return NextResponse.json(
      { error: "Unsupported shared-data request." },
      { status: 400 },
    );
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Could not save shared feedback.",
      },
      { status: 503 },
    );
  }
}
