import { NextResponse } from "next/server";
import { hasDeskSession, sameOrigin } from "@/lib/desk-session";
import { uid } from "@/lib/pulse/ids";
import { cleanContact } from "@/lib/support-validate";
import { contactFromRow, missingTable, supportDb } from "@/lib/support-db";

export const dynamic = "force-dynamic";
const denied = () => NextResponse.json({ error: "Your admin session expired. Open the desk again." }, { status: 401 });
const failed = (error: unknown) => NextResponse.json({ error: missingTable(error as { code?: string }) ? "Run the Help & Support SQL (supabase/migrations/20261105_help_support.sql) in Supabase first." : "Could not save. Check the Supabase configuration and try again." }, { status: 503 });
const guard = async (request: Request) => sameOrigin(request) && await hasDeskSession();

export async function GET(request: Request) {
  if (!await guard(request)) return denied();
  const { data, error } = await supportDb().from("support_contacts").select("*").order("sort").order("created_at").limit(100);
  if (error) return failed(error);
  return NextResponse.json({ contacts: (data || []).map(contactFromRow) });
}

/** Create (no id) or update (with id) one contact account. */
export async function POST(request: Request) {
  if (!await guard(request)) return denied();
  const payload = await request.json().catch(() => null) as Record<string, unknown> | null;
  const result = cleanContact(payload);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  try {
    const db = supportDb();
    const editing = typeof payload?.id === "string" && /^[a-zA-Z0-9_-]{4,80}$/.test(payload.id) ? payload.id : "";
    if (editing) {
      const { data, error } = await db.from("support_contacts").update(result.value).eq("id", editing).select("*").maybeSingle();
      if (error) throw error;
      if (!data) return NextResponse.json({ error: "That contact no longer exists." }, { status: 404 });
      return NextResponse.json({ contact: contactFromRow(data) });
    }
    const { count, error: countError } = await db.from("support_contacts").select("id", { count: "exact", head: true });
    if (countError) throw countError;
    if ((count ?? 0) >= 30) return NextResponse.json({ error: "You can publish up to 30 contacts. Remove one first." }, { status: 400 });
    const { data, error } = await db.from("support_contacts").insert({ id: uid("ct"), ...result.value, sort: (count ?? 0) + 1 }).select("*").single();
    if (error) throw error;
    return NextResponse.json({ contact: contactFromRow(data) });
  } catch (error) { return failed(error); }
}

/** Reorder: { order: [id, id, ...] } */
export async function PUT(request: Request) {
  if (!await guard(request)) return denied();
  const payload = await request.json().catch(() => null) as { order?: unknown } | null;
  const order = Array.isArray(payload?.order) ? payload.order.filter((v): v is string => typeof v === "string").slice(0, 50) : [];
  if (!order.length) return NextResponse.json({ error: "Nothing to reorder." }, { status: 400 });
  try {
    const db = supportDb();
    const results = await Promise.all(order.map((id, i) => db.from("support_contacts").update({ sort: i + 1 }).eq("id", id)));
    const bad = results.find(r => r.error);
    if (bad?.error) throw bad.error;
    return NextResponse.json({ ok: true });
  } catch (error) { return failed(error); }
}

export async function DELETE(request: Request) {
  if (!await guard(request)) return denied();
  const payload = await request.json().catch(() => null) as { id?: unknown } | null;
  if (typeof payload?.id !== "string" || !payload.id) return NextResponse.json({ error: "Invalid contact." }, { status: 400 });
  const { error } = await supportDb().from("support_contacts").delete().eq("id", payload.id);
  if (error) return failed(error);
  return NextResponse.json({ id: payload.id });
}
