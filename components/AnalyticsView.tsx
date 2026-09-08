import Link from "next/link";
import type { Analytics, Sentiment } from "@/lib/types";
import { sentimentLabel } from "@/lib/sentiment";
const COLORS: Record<Sentiment, string> = { positive: "var(--teal)", mixed: "var(--gold)", negative: "var(--coral)" };
const EMOJI: Record<Sentiment, string> = { positive: "🙂", mixed: "😐", negative: "😞" };

export function AnalyticsView({ data }: { data: Analytics }) {
  const total = data.totalReviews || 1;
  const positive = Math.round(data.sentiment.positive / total * 100);
  const mixed = Math.round(data.sentiment.mixed / total * 100);
  const negative = Math.max(0, 100 - positive - mixed);
  const mixedEnd = positive + mixed;
  return <div className="space-y-8">
    <section className="analytics-hero surface p-5 sm:p-8">
      <div className="analytics-core">
        <div className="analytics-live"><span className="live-dot"/> LIVE · updates automatically</div>
        <div className="analytics-ring" style={{ ["--positive" as string]: `${positive}%`, ["--mixed" as string]: `${mixedEnd}%` }} />
        <div className="analytics-center"><strong>{positive}%</strong><span>positive pulse</span><small>{data.totalReviews} visitor voices</small></div>
      </div>
      <div className="analytics-summary"><div><p className="eyebrow">The living mood</p><h1 className="mt-2">How Daet feels right now</h1><p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">Every selected emoji is an official pulse. The chart, counts and latest voices respond as new feedback arrives.</p></div>
        {(["positive", "mixed", "negative"] as const).map(key => { const pct = key === "negative" ? negative : key === "positive" ? positive : mixed; return <div className="sentiment-line" key={key}><div className="top"><span>{EMOJI[key]} {sentimentLabel(key)}</span><span>{pct}% · {data.sentiment[key]}</span></div><div className="bar"><span style={{ width: `${pct}%`, background: COLORS[key] }} /></div></div>; })}
        <div className="analytics-stat-grid"><div><strong>{data.avgRating ? data.avgRating.toFixed(1) : "—"}</strong><span>optional score</span></div><div><strong>{data.spotsCount}</strong><span>places tracked</span></div></div>
      </div>
    </section>
    <section className="surface trend-card"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Live distribution</p><h2 className="mt-2">The pulse at a glance</h2></div><span className="trend-total">{data.totalReviews} total pulses</span></div><div className="mood-track mt-6"><span style={{ width: `${positive}%` }} /><span style={{ width: `${mixed}%` }} /><span style={{ width: `${negative}%` }} /></div><div className="mood-legend"><span>🙂 Positive <b>{positive}%</b></span><span>😐 Mixed <b>{mixed}%</b></span><span>😞 Needs care <b>{negative}%</b></span></div></section>
    <section><p className="eyebrow">Destination signal</p><h2 className="mt-2">Where the pulse is strongest</h2><div className="rank-list mt-4">{data.bySpot.map((s, i) => <Link key={s.id} href={`/spots/${s.slug}`} className="rank-row"><span className="rank-no">{String(i + 1).padStart(2, "0")}</span><span><span className="rank-name block">{s.name}</span><span className="rank-meta block">{s.count ? `${s.count} visitor pulses` : "No pulses yet"}</span></span><span className="rank-score">{s.count ? s.avg.toFixed(1) : "—"}</span></Link>)}</div></section>
    <section className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]"><div className="surface p-5 sm:p-7"><p className="eyebrow">Written signal</p><h2 className="mt-2">What the words add</h2><p className="mt-3 text-sm leading-relaxed text-[var(--muted)]">Comment wording is a secondary signal; the emoji remains the official sentiment.</p>{(["positive", "mixed", "negative"] as const).map(key => { const t = data.wording.positive + data.wording.mixed + data.wording.negative || 1; const pct = Math.round(data.wording[key] / t * 100); return <div className="sentiment-line" key={key}><div className="top"><span>{EMOJI[key]} {sentimentLabel(key)}</span><span>{pct}%</span></div><div className="bar"><span style={{ width: `${pct}%`, background: COLORS[key] }} /></div></div>; })}</div><div className="surface p-5 sm:p-7"><p className="eyebrow">Live voices</p><h2 className="mt-2">What visitors are saying</h2><div className="mt-3 divide-y divide-[var(--line)]">{data.recent.length === 0 && <p className="py-5 text-sm text-[var(--muted)]">No pulses yet.</p>}{data.recent.map(f => <article key={f.id} className="py-4 recent-voice"><div className="flex items-center justify-between gap-4"><p className="text-sm font-extrabold">{f.display_name}<span className="font-normal text-[var(--muted)]"> · {f.spots?.name || "a place"}</span></p><span className="text-2xl">{f.emoji}</span></div><p className="mt-1 text-sm leading-relaxed text-[var(--muted)]">{f.comment}</p></article>)}</div></div></section>
  </div>;
}
