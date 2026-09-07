import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";
import { fetchFeedback, fetchSpot } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function AdminViewSpotPage({ params }: { params: { slug: string } }) {
  if (!isAdminRequest()) redirect("/admin/login");
  if (!hasPublicEnv()) notFound();
  const spot = await fetchSpot(params.slug);
  if (!spot) notFound();
  const reviews = await fetchFeedback(spot.id);
  const avg = reviews.length === 0 ? 0 : reviews.reduce((a, b) => a + b.rating, 0) / reviews.length;

  return (
    <div>
      <Link href="/admin/view" className="text-sm text-gold hover:underline">← All officer spot views</Link>
      <div className="mt-5 h-64 rounded-[2rem] bg-cover bg-center" style={{ backgroundImage: spot.cover_url ? `url(${spot.cover_url})` : undefined }} />
      <p className="mt-6 text-xs uppercase tracking-[0.22em] text-gold">{spot.category}{spot.barangay ? ` · ${spot.barangay}` : ""}</p>
      <h1 className="mt-2 font-display text-5xl">{spot.name}</h1>
      <p className="mt-4 max-w-2xl text-sand/70">{spot.description}</p>
      <div className="mt-6 flex flex-wrap gap-6">
        <div><p className="text-xs text-sand/45">Average</p><p className="font-display text-4xl">{avg ? avg.toFixed(2) : "—"}</p></div>
        <div><p className="text-xs text-sand/45">Pulses</p><p className="font-display text-4xl">{reviews.length}</p></div>
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        <Link href="/admin/spots" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink">Edit in Manage</Link>
        <Link href="/admin/comments" className="rounded-full border border-white/15 px-4 py-2 text-sm">Moderate comments</Link>
      </div>
      <div className="mt-10 space-y-3">
        {reviews.length === 0 && <p className="text-sand/50">No pulses for this spot yet.</p>}
        {reviews.map((f) => (
          <article key={f.id} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between"><p className="text-gold">{f.display_name}</p><span>{f.emoji}</span></div>
            <p className="mt-2 text-sand/80">{f.comment}</p>
            <p className="mt-2 text-xs text-sand/40">{f.rating}/5 · {f.sentiment} · {new Date(f.created_at).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
