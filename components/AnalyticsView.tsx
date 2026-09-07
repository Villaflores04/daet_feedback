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
    <ul className="w-full space-y-1.5 text-[13px]">
      {(["positive", "mixed", "negative"] as const).map((key) => (
        <li key={key} className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full" style={{ background: COLORS[key] }} />
            {sentimentLabel(key)}
          </span>
          <span className="tabular-nums text-ink-soft">
            {Math.round((counts[key] / den) * 100)}% ({counts[key]})
          </span>
        </li>
      ))}
    </ul>
  );
}

export function AnalyticsView({ data }: { data: Analytics }) {
  const wording = data.wording || { negative: 0, mixed: 0, positive: 0 };
  const wTotal = wording.negative + wording.mixed + wording.positive || 1;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-2">
        <div className="kpi">
          <p className="kpi-k">Pulses</p>
          <p className="kpi-v">{data.totalReviews}</p>
        </div>
        <div className="kpi">
          <p className="kpi-k">Optional avg</p>
          <p className="kpi-v">{data.avgRating ? data.avgRating.toFixed(2) : "—"}</p>
        </div>
        <div className="kpi">
          <p className="kpi-k">Places</p>
          <p className="kpi-v">{data.spotsCount}</p>
        </div>
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <section className="card p-3.5">
          <h2>Emoji Mood — Official</h2>
          <p className="mt-0.5 text-[11px] text-ink-soft">From the face the visitor picked.</p>
          <div className="mt-3 flex items-center gap-3">
            <MoodDonut
              positive={data.sentiment.positive}
              mixed={data.sentiment.mixed}
              negative={data.sentiment.negative}
            />
            <Legend counts={data.sentiment} />
          </div>
        </section>
        <section className="card p-3.5">
          <h2>Wording — Secondary</h2>
          <p className="mt-0.5 text-[11px] text-ink-soft">Fixed English + Filipino keywords. Not AI.</p>
          <div className="mt-4 space-y-2.5">
            {(["positive", "mixed", "negative"] as const).map((key) => {
              const pct = Math.round((wording[key] / wTotal) * 100);
              return (
                <div key={key}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span>{sentimentLabel(key)}</span>
                    <span className="tabular-nums text-ink-soft">
                      {pct}% ({wording[key]})
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-[var(--paper-sunk)]">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, background: COLORS[key] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>
      <p className="text-[11px] text-ink-soft">
        Emoji Mood is based on the visitor's selected emoji. Comment Wording Mood uses a fixed English and Filipino
        keyword list. The two indicators are calculated separately.
      </p>
      <div className="grid gap-3 lg:grid-cols-2">
        <section>
          <h2>Place ranking</h2>
          <div className="mt-2 divide-y divide-[var(--line)] overflow-hidden rounded-[14px] border border-[var(--line)] bg-paper">
            {data.bySpot.map((s, i) => (
              <Link key={s.id} href={`/spots/${s.slug}`} className="flex items-center justify-between px-3 py-2 hover:bg-[var(--paper-sunk)]">
                <div>
                  <p className="text-[13px] font-medium">
                    {String(i + 1).padStart(2, "0")} {s.name}
                  </p>
                  <p className="text-[11px] text-ink-soft">{s.count ? `${s.count} pulses` : "No pulses yet"}</p>
                </div>
                <p className="font-display text-base">{s.count ? s.avg.toFixed(1) : "—"}</p>
              </Link>
            ))}
          </div>
        </section>
        <section>
          <h2>Latest pulses</h2>
          <div className="mt-2 space-y-1.5">
            {data.recent.length === 0 && <p className="text-[13px] text-ink-soft">No pulses yet.</p>}
            {data.recent.map((f) => (
              <article key={f.id} className="card px-3 py-2.5">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[13px]">
                    <span className="font-medium">{f.display_name}</span>
                    <span className="text-ink-soft"> on </span>
                    <Link href={`/spots/${f.spots?.slug || ""}`} className="text-tide hover:underline">
                      {f.spots?.name || "a spot"}
                    </Link>
                  </p>
                  <span>{f.emoji}</span>
                </div>
                <p className="mt-0.5 text-[13px] text-ink-soft">{f.comment}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
