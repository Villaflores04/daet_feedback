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
      <div
        className="h-[120px] rounded-[16px] bg-tide-mist bg-cover bg-center sm:h-48"
        style={{ backgroundImage: spot.cover_url ? `url(${spot.cover_url})` : undefined }}
      />
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-tide">
        {spot.category}
        {spot.barangay ? ` · ${spot.barangay}` : ""}
      </p>
      <p className="mt-1 max-w-2xl text-[12px] leading-relaxed text-ink-soft">{spot.description}</p>
      <div className="relative z-10 -mt-1 pt-3">
        <SpotPulse spotId={spot.id} spotName={spot.name} initial={reviews} />
      </div>
    </div>
  );
}
