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
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Officer view</p>
      <h1 className="mt-2 font-display text-5xl">Tourism spots</h1>
      <p className="mt-3 max-w-2xl text-sand/60">Read-only inventory inside the desk. Manage photos under Manage. Moderate text under Comments.</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2">
        {spots.map((s) => {
          const st = stats[s.id];
          return (
            <Link key={s.id} href={`/admin/view/${s.slug}`} className="glass overflow-hidden rounded-3xl hover:border-gold/30">
              <div className="h-44 bg-cover bg-center" style={{ backgroundImage: s.cover_url ? `url(${s.cover_url})` : undefined }} />
              <div className="p-5">
                <p className="text-xs uppercase tracking-[0.16em] text-gold/70">{s.category}{s.barangay ? ` · ${s.barangay}` : ""}</p>
                <h2 className="mt-1 font-display text-3xl">{s.name}</h2>
                <p className="mt-2 line-clamp-2 text-sm text-sand/55">{s.description}</p>
                <p className="mt-3 text-sm text-sand/70">{st && st.count ? `${st.avg.toFixed(2)} avg · ${st.count} pulses` : "No pulses yet"}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
