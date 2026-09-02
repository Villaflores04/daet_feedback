import { notFound } from "next/navigation";
import { fetchFeedback, fetchSpot } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";
import { FeedbackForm } from "@/components/FeedbackForm";

export const dynamic = "force-dynamic";

export default async function SpotPage({ params }: { params: { slug: string } }) {
  if (!hasPublicEnv()) notFound();
  const spot = await fetchSpot(params.slug);
  if (!spot) notFound();
  const reviews = await fetchFeedback(spot.id);
  const avg = reviews.length === 0 ? 0 : reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;
  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
      <div>
        <div className="h-72 rounded-[2rem] bg-cover bg-center" style={{ backgroundImage: spot.cover_url ? `url(${spot.cover_url})` : undefined }} />
        <p className="mt-6 text-xs uppercase tracking-[0.22em] text-gold">{spot.category}{spot.barangay ? ` · ${spot.barangay}` : ""}</p>
        <h1 className="mt-2 font-display text-5xl">{spot.name}</h1>
        <p className="mt-4 max-w-2xl text-sand/70">{spot.description}</p>
        <div className="mt-6 flex gap-6">
          <div><p className="text-xs text-sand/45">Average</p><p className="font-display text-4xl">{avg ? avg.toFixed(2) : "—"}</p></div>
          <div><p className="text-xs text-sand/45">Pulses</p><p className="font-display text-4xl">{reviews.length}</p></div>
        </div>
        <div className="mt-10 space-y-3">
          {reviews.map((f) => (
            <article key={f.id} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between"><p className="text-gold">{f.display_name}</p><span>{f.emoji}</span></div>
              <p className="mt-2 text-sand/80">{f.comment}</p>
              <p className="mt-2 text-xs text-sand/40">{f.rating}/5 · {new Date(f.created_at).toLocaleString()}</p>
            </article>
          ))}
        </div>
      </div>
      <FeedbackForm spotId={spot.id} spotName={spot.name} />
    </div>
  );
}
