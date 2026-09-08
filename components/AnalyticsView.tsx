import Link from "next/link";
import type { Analytics, Sentiment } from "@/lib/types";
import { sentimentLabel } from "@/lib/sentiment";
import { MoodDonut } from "./MoodDonut";

const COLORS: Record<Sentiment, string> = { positive: "var(--teal)", mixed: "var(--gold)", negative: "var(--coral)" };
const EMOJI: Record<Sentiment, string> = { positive: "🙂", mixed: "😐", negative: "😞" };
const LABELS: Record<Sentiment, string> = { positive: "Positive", mixed: "Mixed", negative: "Needs care" };

function SignalRows({ values, total }: { values: Record<Sentiment, number>; total: number }) {
  return <div className="signal-list">{(["positive", "mixed", "negative"] as const).map(key => {
    const pct = Math.round((values[key] / (total || 1)) * 100);
    return <div className="signal-row" key={key}>
      <div className="signal-label"><span className="signal-emoji">{EMOJI[key]}</span><span><b>{LABELS[key]}</b><small>{sentimentLabel(key)}</small></span><strong>{pct}%</strong></div>
      <div className="signal-track"><span style={{ width: `${pct}%`, background: COLORS[key] }} /></div>
      <small className="signal-count">{values[key]} responses</small>
    </div>;
  })}</div>;
}

export function AnalyticsView({ data }: { data: Analytics }) {
  const total = data.totalReviews || 1;
  const positive = Math.round((data.sentiment.positive / total) * 100);
  const mixed = Math.round((data.sentiment.mixed / total) * 100);
  const negative = Math.max(0, 100 - positive - mixed);
  const wordTotal = data.wording.positive + data.wording.mixed + data.wording.negative;

  return <div className="space-y-8">
    <section className="analytics-hero surface p-5 sm:p-8">
      <div className="analytics-core"><div className="analytics-live"><span className="live-dot" /> LIVE · updates automatically</div><MoodDonut positive={data.sentiment.positive} mixed={data.sentiment.mixed} negative={data.sentiment.negative} size={310} /><div className="analytics-center"><strong>{positive}%</strong><span>positive pulse</span><small>{data.totalReviews} official responses</small></div></div>
      <div className="analytics-summary"><div className="analytics-heading"><p className="eyebrow">Official sentiment</p><h1 className="mt-2">How Daet feels right now</h1><p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">The emoji selected by each visitor is the official pulse. This is the signal used for the town mood.</p></div><SignalRows values={data.sentiment} total={total} /><div className="analytics-stat-grid"><div><strong>{data.avgRating ? data.avgRating.toFixed(1) : "—"}</strong><span>optional score</span></div><div><strong>{data.spotsCount}</strong><span>places tracked</span></div></div></div>
    </section>

    <section className="surface trend-card"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">At a glance</p><h2 className="mt-2">The pulse distribution</h2></div><span className="trend-total">{data.totalReviews} official pulses</span></div><div className="mood-track mt-6"><span style={{ width: `${positive}%` }} /><span style={{ width: `${mixed}%` }} /><span style={{ width: `${negative}%` }} /></div><div className="mood-legend"><span>🙂 Positive <b>{positive}%</b></span><span>😐 Mixed <b>{mixed}%</b></span><span>😞 Needs care <b>{negative}%</b></span></div></section>

    <section><p className="eyebrow">Destination signal</p><h2 className="mt-2">Where the pulse is strongest</h2><div className="rank-list mt-4">{data.bySpot.map((s, i) => <Link key={s.id} href={`/spots/${s.slug}`} className="rank-row"><span className="rank-no">{String(i + 1).padStart(2, "0")}</span><span><span className="rank-name block">{s.name}</span><span className="rank-meta block">{s.count ? `${s.count} visitor pulses` : "No pulses yet"}</span></span><span className="rank-score">{s.count ? s.avg.toFixed(1) : "—"}</span></Link>)}</div></section>

    <section className="signal-compare">
      <div className="surface signal-card official-card"><div className="signal-card-head"><div><p className="eyebrow">Signal 01 · Official</p><h2 className="mt-2">Emoji sentiment</h2></div><span className="signal-badge">What visitors chose</span></div><p className="signal-card-copy">The primary measurement. Every selected emoji becomes one official pulse.</p><SignalRows values={data.sentiment} total={total} /></div>
      <div className="surface signal-card wording-card"><div className="signal-card-head"><div><p className="eyebrow">Signal 02 · Secondary</p><h2 className="mt-2">Comment wording</h2></div><span className="signal-badge secondary">What words suggest</span></div><p className="signal-card-copy">Written comments are analyzed separately. They explain the pulse but do not replace it.</p><SignalRows values={data.wording} total={wordTotal || 1} /></div>
    </section>

    <section className="surface p-5 sm:p-7"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Live voices</p><h2 className="mt-2">What visitors are saying</h2></div><span className="trend-total">Community context</span></div><div className="voice-grid mt-4">{data.recent.length === 0 && <p className="py-5 text-sm text-[var(--muted)]">No pulses yet.</p>}{data.recent.map(f => <article key={f.id} className="dashboard-voice"><div className="dashboard-voice-top"><div><b>{f.display_name}</b><small>{f.spots?.name || "A place in Daet"}</small></div><span>{f.emoji}</span></div><p>{f.comment}</p></article>)}</div></section>
  </div>;
}
