import Link from "next/link";
import type { Analytics, Sentiment } from "@/lib/types";
import { sentimentLabel } from "@/lib/sentiment";

function Bars({ title, hint, counts }: { title: string; hint: string; counts: Record<Sentiment, number> }) {
  const total = counts.negative + counts.mixed + counts.positive || 1;
  return (
    <div className="glass rounded-3xl p-6">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">{title}</p>
      <p className="mt-1 text-xs text-sand/45">{hint}</p>
      <div className="mt-5 space-y-4">
        {([["positive", counts.positive, "bg-foam"], ["mixed", counts.mixed, "bg-gold"], ["negative", counts.negative, "bg-coral"]] as const).map(([key, count, bar]) => (
          <div key={title + key}>
            <div className="mb-1 flex justify-between text-sm"><span>{sentimentLabel(key)}</span><span className="text-sand/50">{count}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${bar}`} style={{ width: `${(count / total) * 100}%` }} /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsView({ data }: { data: Analytics }) {
  const wording = data.wording || { negative: 0, mixed: 0, positive: 0 };
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat k="Pulses" v={String(data.totalReviews)} d="Faces + notes from visitors" />
        <Stat k="Optional average" v={data.avgRating ? data.avgRating.toFixed(2) : "—"} d="Stars only, if they picked them" />
        <Stat k="Places" v={String(data.spotsCount)} d="Daet spots on the desk" />
      </div>
      <Bars title="Emoji mood" hint="Official pulse — from the face the visitor picked" counts={data.sentiment} />
      <Bars title="Wording mood" hint="Keyword scan of the note — not a trained model" counts={wording} />
      <div className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-white/5 px-6 py-4"><p className="text-xs uppercase tracking-[0.22em] text-gold">Places</p></div>
        <div className="divide-y divide-white/5">
          {data.bySpot.map((s, i) => (
            <Link key={s.id} href={`/spots/${s.slug}`} className="flex items-center justify-between px-6 py-4 hover:bg-white/5">
              <div className="flex items-center gap-4">
                <span className="w-6 font-display text-xl text-gold/80">{String(i + 1).padStart(2, "0")}</span>
                <div><p className="font-medium">{s.name}</p><p className="text-xs text-sand/45">{s.count ? `${s.count} pulses` : "No pulses yet — be first"}</p></div>
              </div>
              <p className="font-display text-2xl">{s.count ? s.avg.toFixed(1) : "—"}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Latest pulses</p>
        {data.recent.length === 0 && <p className="text-sand/50">No pulses yet. Be the first.</p>}
        {data.recent.map((f) => (
          <article key={f.id} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm"><span className="text-gold">{f.display_name}</span><span className="text-sand/40"> on </span><Link href={`/spots/${f.spots?.slug || ""}`} className="hover:text-gold">{f.spots?.name || "a spot"}</Link></p>
              <span className="text-xl">{f.emoji}</span>
            </div>
            <p className="mt-2 text-sand/80">{f.comment}</p>
            <p className="mt-2 text-xs text-sand/40">{new Date(f.created_at).toLocaleString()}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

function Stat({ k, v, d }: { k: string; v: string; d: string }) {
  return (
    <div className="glass rounded-3xl p-6">
      <p className="text-xs uppercase tracking-[0.2em] text-sand/45">{k}</p>
      <p className="mt-3 font-display text-5xl text-sand">{v}</p>
      <p className="mt-2 text-sm text-sand/50">{d}</p>
    </div>
  );
}
