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
      <Link href="/admin/view" className="text-[12px] font-semibold text-tide">
        ← All officer spot views
      </Link>
      <div
        className="mt-3 h-[120px] rounded-[16px] bg-tide-mist bg-cover bg-center sm:h-48"
        style={{ backgroundImage: spot.cover_url ? `url(${spot.cover_url})` : undefined }}
      />
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-tide">
        {spot.category}
        {spot.barangay ? ` · ${spot.barangay}` : ""}
      </p>
      <h1 className="mt-0.5">{spot.name}</h1>
      <p className="mt-1 max-w-2xl text-[13px] text-ink-soft">{spot.description}</p>
      <div className="mt-3 grid grid-cols-2 gap-2 sm:max-w-sm">
        <div className="kpi">
          <p className="kpi-k">Optional avg</p>
          <p className="kpi-v">{avg ? avg.toFixed(2) : "—"}</p>
        </div>
        <div className="kpi">
          <p className="kpi-k">Pulses</p>
          <p className="kpi-v">{reviews.length}</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5">
        <Link href="/admin/spots" className="btn-gold">
          Edit in Manage
        </Link>
        <Link href="/admin/comments" className="btn-ghost">
          Moderate comments
        </Link>
      </div>
      <div className="mt-4 space-y-1.5">
        {reviews.length === 0 && <p className="text-[13px] text-ink-soft">No pulses for this spot yet.</p>}
        {reviews.map((f) => (
          <article key={f.id} className="card px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium">{f.display_name}</p>
              <span>{f.emoji}</span>
            </div>
            <p className="mt-0.5 text-[13px] text-ink-soft">{f.comment}</p>
            <p className="mt-0.5 text-[11px] text-ink-soft">
              {f.rating}/5 · {f.sentiment} · {new Date(f.created_at).toLocaleString()}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
