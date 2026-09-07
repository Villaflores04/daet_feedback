import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminActivityPage() {
  if (!isAdminRequest()) redirect("/admin/login");
  let rows: { id: string; actor: string; action: string; target_type: string | null; target_id: string | null; detail: string | null; created_at: string }[] = [];
  try {
    const { data } = await supabaseAdmin()
      .from("admin_events")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(80);
    rows = data ?? [];
  } catch {
    rows = [];
  }

  return (
    <div>
      <p className="eyebrow">Accountability</p>
      <h1 className="mt-0.5">Desk activity</h1>
      <p className="mt-1 max-w-2xl text-[13px] text-ink-soft">Log of officer actions. Empty until you run supabase/step2_4.sql.</p>
      <div className="mt-3 space-y-1.5">
        {rows.length === 0 && <p className="text-[13px] text-ink-soft">No events yet.</p>}
        {rows.map((r) => (
          <article key={r.id} className="card px-3 py-2.5 text-[13px]">
            <p className="font-medium text-gold">{r.action.replaceAll("_", " ")}</p>
            <p className="mt-0.5 text-ink-soft">
              {r.actor}
              {r.detail ? ` · ${r.detail}` : ""}
              {r.target_type ? ` · ${r.target_type}` : ""}
            </p>
            <p className="mt-0.5 text-[11px] text-ink-soft">{new Date(r.created_at).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
