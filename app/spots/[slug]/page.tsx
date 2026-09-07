import { notFound } from "next/navigation";
import { fetchFeedback, fetchSpot } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";
import { SpotPulse } from "@/components/SpotPulse";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function SpotPage({ params }: { params: { slug: string } }) {
  if (!hasPublicEnv()) notFound();
  const spot = await fetchSpot(params.slug);
  if (!spot) notFound();
  const reviews = await fetchFeedback(spot.id);
  return (
    <div>
      <div className="h-40 rounded-2xl bg-tide-mist bg-cover bg-center md:h-64 md:rounded-[2rem]" style={{ backgroundImage: spot.cover_url ? `url(${spot.cover_url})` : undefined }} />
      <p className="mt-4 text-sm text-tide">{spot.category}{spot.barangay ? ` · ${spot.barangay}` : ""}</p>
      <h1 className="mt-1 font-display text-3xl md:text-5xl">{spot.name}</h1>
      <p className="mt-3 max-w-2xl text-sm text-ink-soft md:text-base">{spot.description}</p>
      <div className="mt-8"><SpotPulse spotId={spot.id} spotName={spot.name} initial={reviews} /></div>
    </div>
  );
}
