import Link from "next/link";
import { fetchAnalytics, fetchSpots } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SpotsPage() {
  if (!hasPublicEnv()) {
    return (
      <div>
        <h1>Places</h1>
        <p className="mt-1 text-[13px] text-ink-soft">Connect Supabase to load spots.</p>
      </div>
    );
  }
  const [spots, analytics] = await Promise.all([fetchSpots(), fetchAnalytics()]);
  const stats = Object.fromEntries(analytics.bySpot.map((s) => [s.id, s]));
  return (
    <div>
      <p className="eyebrow">Catalog</p>
      <h1 className="mt-0.5">Places</h1>
      <p className="mt-1 max-w-xl text-[13px] text-ink-soft">Pick a place. Set a public name once. Leave an emoji pulse — no account.</p>
      <div className="horizon-rule mt-3" />
      <div className="mt-3 grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
        {spots.map((s) => {
          const st = stats[s.id];
          return (
            <Link key={s.id} href={`/spots/${s.slug}`} className="card overflow-hidden">
              <div className="h-28 bg-tide-mist bg-cover bg-center" style={{ backgroundImage: s.cover_url ? `url(${s.cover_url})` : undefined }} />
              <div className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-tide">
                  {s.category}
                  {s.barangay ? ` · ${s.barangay}` : ""}
                </p>
                <h2 className="mt-0.5 leading-snug">{s.name}</h2>
                <p className="mt-1 line-clamp-2 text-[12px] text-ink-soft">{s.description}</p>
                <p className="mt-1.5 text-[11px] text-ink-soft">
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
