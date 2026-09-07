import Link from "next/link";
import { fetchAnalytics, fetchSpots } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  if (!hasPublicEnv()) return <Hero reviews={0} avg={0} spots={[]} />;
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
  reviews, avg, spots, top = []
}: {
  reviews: number;
  avg: number;
  spots: Awaited<ReturnType<typeof fetchSpots>>;
  top?: { id: string; name: string; slug: string; count: number; avg: number }[];
}) {
  return (
    <div>
      <section className="relative overflow-hidden rounded-2xl bg-[url('https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center md:rounded-[2rem]">
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/65 to-black/25" />
        <div className="relative grid gap-6 px-5 py-10 md:grid-cols-[1.2fr_.8fr] md:px-12 md:py-20">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">Camarines Norte · Pacific edge</p>
            <h1 className="mt-3 font-display text-3xl leading-[1.12] text-white md:text-6xl">The town, told by the people who just left the sand.</h1>
            <p className="mt-4 max-w-xl text-sm text-white md:text-lg">Public emoji pulse for Daet tourism. No account. Pick a face, write a short note, see the town mood.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/spots" className="btn-gold px-5 py-2.5 text-sm md:px-6 md:py-3">Leave a pulse</Link>
              <Link href="/dashboard" className="rounded-full border-2 border-white bg-black/30 px-5 py-2.5 text-sm text-white">Town pulse</Link>
            </div>
          </div>
          <div className="self-end">
            <div className="rounded-2xl bg-paper p-5">
              <p className="text-xs text-ink-soft">Live average</p>
              <p className="font-display text-4xl text-ink md:text-6xl">{avg ? avg.toFixed(2) : "—"}</p>
              <p className="text-sm text-ink-soft">{reviews} visitor pulses</p>
            </div>
          </div>
        </div>
      </section>
      {top.length > 0 && (
        <section className="mt-10 md:mt-14">
          <h2 className="font-display text-2xl md:text-4xl">From visitor pulses</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3 md:gap-4">
            {top.map((s, i) => (
              <Link key={s.id} href={`/spots/${s.slug}`} className="card p-4 md:p-5">
                <p className="text-xs text-gold">#{i + 1}</p>
                <h3 className="mt-1 font-display text-xl text-ink">{s.name}</h3>
                <p className="mt-1 text-sm text-ink-soft">{s.avg.toFixed(2)} avg · {s.count} pulses</p>
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="mt-10 md:mt-14">
        <div className="mb-4 flex items-end justify-between">
          <h2 className="font-display text-2xl md:text-4xl">Where Daet is felt</h2>
          <Link href="/spots" className="text-sm text-tide">All spots</Link>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {spots.map((s) => (
            <Link key={s.id} href={`/spots/${s.slug}`} className="card overflow-hidden">
              <div className="h-36 bg-tide-mist bg-cover bg-center md:h-52" style={{ backgroundImage: s.cover_url ? `url(${s.cover_url})` : undefined }} />
              <div className="p-4 md:p-5">
                <p className="text-xs font-medium text-tide">{s.category}{s.barangay ? ` · ${s.barangay}` : ""}</p>
                <h3 className="mt-1 font-display text-xl text-ink md:text-2xl">{s.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-ink-soft">{s.description}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
