import Link from "next/link";
import type { Analytics, Sentiment } from "@/lib/types";
import { sentimentLabel } from "@/lib/sentiment";
import { MoodDonut } from "./MoodDonut";

const COLORS: Record<Sentiment, string> = {
  positive: "var(--tide)",
  mixed: "var(--gold)",
  negative: "var(--coral)"
};

function Legend({ counts }: { counts: Record<Sentiment, number> }) {
  const n = counts.negative + counts.mixed + counts.positive;
  const den = n || 1;
  return (
    <ul className="space-y-2 text-sm">
      {(["positive", "mixed", "negative"] as const).map((key) => (
        <li key={key} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ background: COLORS[key] }} />
            {sentimentLabel(key)}
          </span>
          <span className="text-ink-soft">{Math.round((counts[key] / den) * 100)}% ({counts[key]})</span>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsView({ data }: { data: Analytics }) {
  const wording = data.wording || { negative: 0, mixed: 0, positive: 0 };
  const wTotal = wording.negative + wording.mixed + wording.positive || 1;
  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat k="Pulses" v={String(data.totalReviews)} />
        <Stat k="Optional average" v={data.avgRating ? data.avgRating.toFixed(2) : "—"} />
        <Stat k="Places" v={String(data.spotsCount)} />
      </div>
      <div className="horizon-rule" />
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-6">
          <h2 className="font-display text-2xl">The official mood</h2>
          <p className="mt-1 text-sm text-ink-soft">Based on the selected emoji only.</p>
          <div className="mt-6 flex flex-col items-center gap-6 sm:flex-row">
            <MoodDonut positive={data.sentiment.positive} mixed={data.sentiment.mixed} negative={data.sentiment.negative} />
            <Legend counts={data.sentiment} />
          </div>
        </section>
        <section className="card p-6">
          <h2 className="font-display text-2xl">What visitors are saying</h2>
          <p className="mt-1 text-sm text-ink-soft">Comment wording, calculated separately.</p>
          <div className="mt-6 space-y-4">
            {(["positive", "mixed", "negative"] as const).map((key) => {
              const pct = Math.round((wording[key] / wTotal) * 100);
              return (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-sm"><span>{sentimentLabel(key)}</span><span className="text-ink-soft">{pct}% ({wording[key]})</span></div>
                  <div className="h-2 overflow-hidden rounded-full bg-[var(--paper-sunk)]"><div className="h-full" style={{ width: `${pct}%`, background: COLORS[key] }} /></div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <p className="text-xs text-ink-soft">Emoji Mood is the selected emoji. Wording Mood is a fixed keyword list. Calculated separately.</p>
      <div className="horizon-rule" />
      <div className="grid gap-6 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">Place ranking</h2>
          <div className="mt-4 divide-y divide-[var(--line)] overflow-hidden rounded-[20px] border border-[var(--line)] bg-paper">
            {data.bySpot.map((s, i) => (
              <Link key={s.id} href={`/spots/${s.slug}`} className="flex items-center justify-between px-5 py-4 hover:bg-[var(--paper-sunk)]">
                <div>
                  <p className="font-medium">{String(i + 1).padStart(2, "0")} {s.name}</p>
                  <p className="text-xs text-ink-soft">{s.count ? `${s.count} pulses` : "No pulses yet. Be the first visitor to share how this place felt."}</p>
                </div>
                <p className="font-display text-xl">{s.count ? s.avg.toFixed(1) : "—"}</p>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2 className="font-display text-2xl">Latest pulses</h2>
          <div className="mt-4 space-y-3">
            {data.recent.length === 0 && <p className="text-ink-soft">No pulses yet.</p>}
            {data.recent.map((f) => (
              <article key={f.id} className="card p-5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm"><span className="font-medium">{f.display_name}</span><span className="text-ink-soft"> on </span><Link href={`/spots/${f.spots?.slug || ""}`} className="text-tide hover:underline">{f.spots?.name || "a spot"}</Link></p>
                  <span className="text-xl">{f.emoji}</span>
                </div>
                <p className="mt-2 whitespace-pre-wrap text-ink-soft">{f.comment}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <p className="text-sm text-ink-soft">{k}</p>
      <p className="font-display text-4xl text-ink">{v}</p>
    </div>
  );
}
