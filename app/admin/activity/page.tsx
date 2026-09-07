import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  if (!isAdminRequest()) redirect("/admin/login");
  let rows: { id: string; actor: string; action: string; target_type: string | null; target_id: string | null; detail: string | null; created_at: string }[] = [];
  try {
    const { data } = await supabaseAdmin().from("admin_events").select("*").order("created_at", { ascending: false }).limit(80);
    rows = data ?? [];
  } catch {
    rows = [];
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Accountability</p>
      <h1 className="mt-2 font-display text-5xl">Desk activity</h1>
      <p className="mt-3 max-w-2xl text-sand/60">Log of officer actions. Empty until you run supabase/step2_4.sql.</p>
      <div className="mt-8 space-y-2">
        {rows.length === 0 && <p className="text-sand/50">No events yet.</p>}
        {rows.map((r) => (
          <article key={r.id} className="glass rounded-2xl px-5 py-4 text-sm">
            <p className="text-gold">{r.action.replaceAll("_", " ")}</p>
            <p className="mt-1 text-sand/55">{r.actor}{r.detail ? ` · ${r.detail}` : ""}{r.target_type ? ` · ${r.target_type}` : ""}</p>
            <p className="mt-1 text-xs text-sand/40">{new Date(r.created_at).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
