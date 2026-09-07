import Link from "next/link";
import { fetchAnalytics, fetchSpots } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  if (!hasPublicEnv()) {
    return <Hero reviews={0} avg={0} spots={[]} />;
  }
  const [spots, analytics] = await Promise.all([fetchSpots(), fetchAnalytics()]);
  return (
    <Hero
      reviews={analytics.totalReviews}
      avg={analytics.avgRating}
      spots={spots.filter((s) => s.featured)}
      top={analytics.bySpot.filter((s) => s.count > 0).slice(0, 3)}
    />
  );
}

function Hero({
  reviews,
  avg,
  spots,
  top = []
}: {
  reviews: number;
  avg: number;
  spots: Awaited<ReturnType<typeof fetchSpots>>;
  top?: { id: string; name: string; slug: string; count: number; avg: number }[];
}) {
  return (
    <div>
      <section className="relative overflow-hidden rounded-[16px] bg-[url('https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center md:rounded-[20px]">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/45 to-black/20" />
        <div className="relative flex min-h-[176px] flex-col justify-end px-3.5 py-4 sm:min-h-[260px] sm:px-7 sm:py-7">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-gold">Camarines Norte · Pacific edge</p>
          <h1 className="mt-1 max-w-lg text-[1.45rem] leading-[1.12] text-white sm:text-[2.4rem]">
            Share how your Daet visit felt.
          </h1>
          <p className="mt-1.5 max-w-md text-[12px] text-white/90 sm:text-sm">
            Public emoji pulse for Daet tourism. No account. Pick a face, write a short note.
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Link href="/spots" className="btn-gold">
              Leave a pulse
            </Link>
            <Link href="/dashboard" className="rounded-full border border-white/70 bg-black/25 px-3 py-1.5 text-xs text-white">
              Town pulse
            </Link>
          </div>
        </div>
      </section>

      <div className="mt-3 grid grid-cols-3 gap-2">
        <div className="kpi">
          <p className="kpi-k">Optional avg</p>
          <p className="kpi-v">{avg ? avg.toFixed(2) : "—"}</p>
        </div>
        <div className="kpi">
          <p className="kpi-k">Pulses</p>
          <p className="kpi-v">{reviews}</p>
        </div>
        <div className="kpi">
          <p className="kpi-k">Places</p>
          <p className="kpi-v">{spots.length}</p>
        </div>
      </div>

      {top.length > 0 && (
        <section className="mt-6">
          <p className="eyebrow">Heard most</p>
          <h2 className="mt-0.5">From visitor pulses</h2>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {top.map((s, i) => (
              <Link key={s.id} href={`/spots/${s.slug}`} className="card p-3">
                <p className="text-[10px] font-semibold text-gold">#{i + 1}</p>
                <h3 className="mt-0.5 text-[1.02rem] leading-snug">{s.name}</h3>
                <p className="mt-1 text-[11px] text-ink-soft">
                  {s.avg.toFixed(2)} avg · {s.count} pulses
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="mt-6">
        <div className="mb-2 flex items-end justify-between">
          <div>
            <p className="eyebrow">Featured ground</p>
            <h2 className="mt-0.5">Where Daet is felt</h2>
          </div>
          <Link href="/spots" className="text-[12px] font-semibold text-tide">
            All spots
          </Link>
        </div>
        <div className="grid gap-2.5 md:grid-cols-2">
          {spots.map((s) => (
            <Link key={s.id} href={`/spots/${s.slug}`} className="card overflow-hidden">
              <div
                className="h-28 bg-tide-mist bg-cover bg-center md:h-36"
                style={{ backgroundImage: s.cover_url ? `url(${s.cover_url})` : undefined }}
              />
              <div className="p-3">
                <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-tide">
                  {s.category}
                  {s.barangay ? ` · ${s.barangay}` : ""}
                </p>
                <h3 className="mt-0.5 text-[1.1rem] leading-snug">{s.name}</h3>
                <p className="mt-1 line-clamp-2 text-[12px] text-ink-soft">{s.description}</p>
              </div>
            </Link>
          ))}
          {spots.length === 0 && <p className="text-[13px] text-ink-soft">Spots appear after Supabase is connected and seeded.</p>}
        </div>
      </section>
    </div>
  );
}
