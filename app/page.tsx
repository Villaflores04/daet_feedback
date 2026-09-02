import Link from "next/link";
import { fetchAnalytics, fetchSpots } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!hasPublicEnv()) return <Hero reviews={0} avg={0} spots={[]} />;
  const [spots, analytics] = await Promise.all([fetchSpots(), fetchAnalytics()]);
  return <Hero reviews={analytics.totalReviews} avg={analytics.avgRating} spots={spots.filter((s) => s.featured)} />;
}

function Hero({ reviews, avg, spots }: { reviews: number; avg: number; spots: Awaited<ReturnType<typeof fetchSpots>> }) {
  return (
    <div>
      <section className="relative overflow-hidden rounded-[2.2rem] border border-white/10 bg-[url('https://images.unsplash.com/photo-1500375592092-40eb2168fd21?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/80 to-ink/20" />
        <div className="relative grid gap-10 px-8 py-16 md:grid-cols-[1.2fr_.8fr] md:px-12 md:py-24">
          <div>
            <p className="text-xs uppercase tracking-[0.32em] text-gold">Camarines Norte · Pacific edge</p>
            <h1 className="mt-4 font-display text-5xl leading-[1.05] text-sand md:text-7xl">The town, told by the people who just left the sand.</h1>
            <p className="mt-6 max-w-xl text-lg text-sand/70">DAET Pulse is the public sentiment desk for Daet tourism. No accounts. Set a name, rate a place, watch the live pulse.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/spots" className="rounded-full bg-gold px-6 py-3 font-semibold text-ink">Review a spot</Link>
              <Link href="/dashboard" className="rounded-full border border-white/15 px-6 py-3 text-sand">Open dashboard</Link>
            </div>
          </div>
          <div className="grid gap-3 self-end">
            <div className="glass rounded-3xl p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-sand/45">Live average</p>
              <p className="font-display text-6xl">{avg ? avg.toFixed(2) : "—"}</p>
              <p className="text-sm text-sand/55">{reviews} visitor pulses</p>
            </div>
          </div>
        </div>
      </section>
      <section className="mt-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.22em] text-gold">Featured ground</p>
            <h2 className="font-display text-4xl">Where Daet is felt</h2>
          </div>
          <Link href="/spots" className="text-sm text-gold hover:underline">All spots</Link>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {spots.map((s) => (
            <Link key={s.id} href={`/spots/${s.slug}`} className="group overflow-hidden rounded-[1.8rem] border border-white/10">
              <div className="h-52 bg-tide bg-cover bg-center transition duration-500 group-hover:scale-[1.03]" style={{ backgroundImage: s.cover_url ? `url(${s.cover_url})` : undefined }} />
              <div className="bg-tide/80 p-5">
                <p className="text-xs uppercase tracking-[0.18em] text-gold/80">{s.category}{s.barangay ? ` · ${s.barangay}` : ""}</p>
                <h3 className="mt-1 font-display text-3xl">{s.name}</h3>
                <p className="mt-2 line-clamp-2 text-sm text-sand/60">{s.description}</p>
              </div>
            </Link>
          ))}
          {spots.length === 0 && <p className="text-sand/50">Spots appear after Supabase is connected and seeded.</p>}
        </div>
      </section>
    </div>
  );
}
