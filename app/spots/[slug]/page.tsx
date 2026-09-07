import { notFound } from "next/navigation";
import { fetchFeedback, fetchSpot } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";
import { SpotPulse } from "@/components/SpotPulse";

export const dynamic = "force-dynamic";

export default async function SpotPage({ params }: { params: { slug: string } }) {
  if (!hasPublicEnv()) notFound();
  const spot = await fetchSpot(params.slug);
  if (!spot) notFound();
  const reviews = await fetchFeedback(spot.id);
  return (
    <div>
      <div className="h-72 rounded-[2rem] bg-cover bg-center" style={{ backgroundImage: spot.cover_url ? `url(${spot.cover_url})` : undefined }} />
      <p className="mt-6 text-xs uppercase tracking-[0.22em] text-gold">
        {spot.category}{spot.barangay ? ` · ${spot.barangay}` : ""}
      </p>
      <h1 className="mt-2 font-display text-5xl">{spot.name}</h1>
      <p className="mt-4 max-w-2xl text-sand/70">{spot.description}</p>
      <div className="mt-10">
        <SpotPulse spotId={spot.id} spotName={spot.name} initial={reviews} />
      </div>
    </div>
  );
}
