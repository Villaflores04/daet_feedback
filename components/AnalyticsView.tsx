import Link from "next/link";
import type { Analytics, Sentiment } from "@/lib/types";
import { sentimentLabel } from "@/lib/sentiment";

function Bars({ title, hint, counts, official }: { title: string; hint: string; counts: Record<Sentiment, number>; official?: boolean }) {
  const n = counts.negative + counts.mixed + counts.positive;
  const den = n || 1;
  return (
    <div className="glass rounded-3xl p-6">
      <p className="text-[10px] uppercase tracking-[0.2em] text-gold">{official ? "Official" : "Secondary"}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-sand/80">{title}</p>
      <p className="mt-2 text-sm text-sand/60">{hint}</p>
      <p className="mt-3 text-sm text-sand/50">{n} total pulses in this chart</p>
      <div className="mt-5 space-y-4">
        {([["positive", counts.positive, "bg-foam"], ["mixed", counts.mixed, "bg-gold"], ["negative", counts.negative, "bg-coral"]] as const).map(([key, count, bar]) => (
          <div key={title + key}>
            <div className="mb-1 flex justify-between text-sm">
              <span>{sentimentLabel(key)}</span>
              <span className="text-sand/70">{Math.round((count / den) * 100)}% ({count})</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-white/10"><div className={`h-full ${bar}`} style={{ width: `${(count / den) * 100}%` }} /></div>
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
        <Stat k="Pulses" v={String(data.totalReviews)} d="Visitors who sent a face + note" />
        <Stat k="Optional average" v={data.avgRating ? data.avgRating.toFixed(2) : "—"} d="Numeric score only if stars were used or inferred" />
        <Stat k="Places" v={String(data.spotsCount)} d="Daet spots on the desk" />
      </div>
      <Bars official title="Emoji Mood" hint="Official visitor sentiment based on the selected emoji." counts={data.sentiment} />
      <Bars title="Comment Wording Mood" hint="Secondary keyword indicator based on the submitted comment." counts={wording} />
      <p className="text-xs leading-relaxed text-sand/45">Emoji Mood is based on the visitor's selected emoji. Comment Wording Mood is based on matches from a fixed English and Filipino keyword list. The two indicators are calculated separately.</p>
      <div className="glass overflow-hidden rounded-3xl">
        <div className="border-b border-white/5 px-6 py-4"><p className="text-xs uppercase tracking-[0.22em] text-gold">Places</p></div>
        <div className="divide-y divide-white/5">
          {data.bySpot.map((s, i) => (
            <Link key={s.id} href={`/spots/${s.slug}`} className="flex items-center justify-between px-6 py-4 hover:bg-white/5">
              <div className="flex items-center gap-4">
                <span className="w-6 font-display text-xl text-gold/80">{String(i + 1).padStart(2, "0")}</span>
                <div><p className="font-medium">{s.name}</p><p className="text-xs text-sand/45">{s.count ? `${s.count} pulses` : "No pulses yet. Be the first visitor to share how this place felt."}</p></div>
              </div>
              <p className="font-display text-2xl">{s.count ? s.avg.toFixed(1) : "—"}</p>
            </Link>
          ))}
        </div>
      </div>
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Latest pulses</p>
        {data.recent.length === 0 && <p className="text-sand/50">No pulses yet. Be the first visitor to share how this place felt.</p>}
        {data.recent.map((f) => (
          <article key={f.id} className="glass rounded-2xl p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm"><span className="text-gold">{f.display_name}</span><span className="text-sand/40"> on </span><Link href={`/spots/${f.spots?.slug || ""}`} className="hover:text-gold">{f.spots?.name || "a spot"}</Link></p>
              <span className="text-xl">{f.emoji}</span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sand/80">{f.comment}</p>
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
