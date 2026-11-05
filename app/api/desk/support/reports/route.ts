import { NextResponse } from "next/server";
import { hasDeskSession, sameOrigin } from "@/lib/desk-session";
import { REPORT_STATUSES } from "@/lib/support-shared";
import { missingTable, reportFromRow, supportDb } from "@/lib/support-db";

export const dynamic = "force-dynamic";
const denied = () => NextResponse.json({ error: "Your admin session expired. Open the desk again." }, { status: 401 });
const failed = (error: unknown) => NextResponse.json({ error: missingTable(error as { code?: string }) ? "Run the Help & Support SQL (supabase/migrations/20261105_help_support.sql) in Supabase first." : "Could not load or save. Check the Supabase configuration and try again." }, { status: 503 });
const guard = async (request: Request) => sameOrigin(request) && await hasDeskSession();

/** Latest reports plus how many are still new (for the badge). Optional ?kind=bug|improve&status=new|progress|resolved */
export async function GET(request: Request) {
  if (!await guard(request)) return denied();
  const url = new URL(request.url);
  try {
    const db = supportDb();
    let query = db.from("support_reports").select("*").order("created_at", { ascending: false }).limit(300);
    const kind = url.searchParams.get("kind"), status = url.searchParams.get("status");
    if (kind === "bug" || kind === "improve") query = query.eq("kind", kind);
    if (status && (REPORT_STATUSES as readonly string[]).includes(status)) query = query.eq("status", status);
    const [list, fresh] = await Promise.all([query, db.from("support_reports").select("id", { count: "exact", head: true }).eq("status", "new")]);
    if (list.error) throw list.error;
    return NextResponse.json({ reports: (list.data || []).map(reportFromRow), newCount: fresh.count ?? 0 }, { headers: { "cache-control": "no-store" } });
  } catch (error) { return failed(error); }
}

/** Update status and/or the private admin note. */
export async function PATCH(request: Request) {
  if (!await guard(request)) return denied();
  const p = await request.json().catch(() => null) as { id?: unknown; status?: unknown; adminNote?: unknown } | null;
  if (typeof p?.id !== "string" || !p.id) return NextResponse.json({ error: "Invalid report." }, { status: 400 });
  const patch: Record<string, string> = {};
  if (p.status !== undefined) {
    if (typeof p.status !== "string" || !(REPORT_STATUSES as readonly string[]).includes(p.status)) return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    patch.status = p.status;
  }
  if (p.adminNote !== undefined) patch.admin_note = String(p.adminNote).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, 1000);
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  const { data, error } = await supportDb().from("support_reports").update(patch).eq("id", p.id).select("*").maybeSingle();
  if (error) return failed(error);
  if (!data) return NextResponse.json({ error: "That report no longer exists." }, { status: 404 });
  return NextResponse.json({ report: reportFromRow(data) });
}

export async function DELETE(request: Request) {
  if (!await guard(request)) return denied();
  const p = await request.json().catch(() => null) as { id?: unknown } | null;
  if (typeof p?.id !== "string" || !p.id) return NextResponse.json({ error: "Invalid report." }, { status: 400 });
  const { error } = await supportDb().from("support_reports").delete().eq("id", p.id);
  if (error) return failed(error);
  return NextResponse.json({ id: p.id });
}
