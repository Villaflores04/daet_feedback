import Link from "next/link";
import { fetchSpots } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function SpotsPage() {
  const spots = hasPublicEnv() ? await fetchSpots() : [];
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Inventory</p>
      <h1 className="mt-2 font-display text-5xl">Tourism spots</h1>
      <p className="mt-3 max-w-2xl text-sand/60">Pick a place. Set your name once. Rate and comment without creating an account.</p>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {spots.map((s) => (
          <Link key={s.id} href={`/spots/${s.slug}`} className="glass overflow-hidden rounded-3xl hover:border-gold/30">
            <div className="h-40 bg-cover bg-center" style={{ backgroundImage: s.cover_url ? `url(${s.cover_url})` : undefined }} />
            <div className="p-5">
              <p className="text-xs uppercase tracking-[0.16em] text-gold/70">{s.category}</p>
              <h2 className="mt-1 font-display text-2xl">{s.name}</h2>
              <p className="mt-2 line-clamp-3 text-sm text-sand/55">{s.description}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
