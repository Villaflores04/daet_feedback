import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";
import { fetchAnalytics, fetchSpots } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminViewSpotsPage() {
  if (!isAdminRequest()) redirect("/admin/login");
  const [spots, analytics] = hasPublicEnv()
    ? await Promise.all([fetchSpots(), fetchAnalytics()])
    : [[], { bySpot: [] as { id: string; count: number; avg: number }[] }];
  const stats = Object.fromEntries(analytics.bySpot.map((s) => [s.id, s]));

  return (
    <div>
      <p className="eyebrow">Inventory</p>
      <h1 className="mt-0.5">View places</h1>
      <p className="mt-1 max-w-xl text-[13px] text-ink-soft">Read-only inventory. Manage photos under Manage. Moderate text under Comments.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {spots.map((s) => {
          const st = stats[s.id];
          return (
            <Link key={s.id} href={`/admin/view/${s.slug}`} className="card flex overflow-hidden">
              <div
                className="h-[88px] w-[88px] shrink-0 bg-tide-mist bg-cover bg-center"
                style={{ backgroundImage: s.cover_url ? `url(${s.cover_url})` : undefined }}
              />
              <div className="min-w-0 flex-1 p-2.5">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-tide">
                  {s.category}
                  {s.barangay ? ` · ${s.barangay}` : ""}
                </p>
                <h2 className="truncate text-[1.05rem]">{s.name}</h2>
                <p className="mt-0.5 text-[11px] text-ink-soft">
                  {st && st.count ? `${st.avg.toFixed(2)} avg · ${st.count} pulses` : "No pulses yet"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
