"use client";
import type { ReactNode } from "react";
import { FACES } from "@/lib/pulse/faces";
import { MIN_RATINGS, type Range, type SentimentData } from "@/lib/pulse/sentiment";
import { cn } from "@/lib/utils";
import { ChartCard, DonutChart, EmptyChart, MOOD_COLORS } from "./desk-charts";

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);
const hexA = (hex: string, alpha: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgb(${n >> 16} ${(n >> 8) & 255} ${n & 255} / ${alpha})`;
};
const FACE_HEX = { POS: MOOD_COLORS.pos, MIX: MOOD_COLORS.mix, NEG: MOOD_COLORS.neg } as const;

/** Stacked positive / okay / negative bar. */
function Stack({ pos, mix, neg, className }: { pos: number; mix: number; neg: number; className?: string }) {
  const total = pos + mix + neg;
  return (
    <div className={cn("flex h-2.5 w-full overflow-hidden rounded-full bg-cool", className)} aria-hidden>
      {total ? [[pos, MOOD_COLORS.pos], [mix, MOOD_COLORS.mix], [neg, MOOD_COLORS.neg]].map(([n, color], i) => (Number(n) ? <span key={i} className="h-full" style={{ width: `${(Number(n) / total) * 100}%`, background: String(color) }} /> : null)) : null}
    </div>
  );
}

export function RangeSwitch({ value, onChange }: { value: Range; onChange: (next: Range) => void }) {
  const options: { v: Range; label: string }[] = [{ v: 7, label: "7 days" }, { v: 30, label: "30 days" }, { v: 90, label: "90 days" }, { v: 0, label: "All" }];
  return (
    <div className="sentiment-range" role="group" aria-label="Time range">
      {options.map(o => <button key={o.v} type="button" aria-pressed={value === o.v} onClick={() => onChange(o.v)}>{o.label}</button>)}
    </div>
  );
}

export function MoodDonut({ d }: { d: SentimentData }) {
  const f = d.faces;
  return (
    <ChartCard title="Overall mood" hint="Original emoji ratings only; replies are excluded.">
      <DonutChart ariaLabel={`Overall mood: ${f.pos} positive, ${f.mix} okay, ${f.neg} negative`} centerValue={f.total ? `${pct(f.pos, f.total)}%` : "–"} centerLabel="Positive" empty="No ratings in this period yet."
        segments={[{ label: "Positive", value: f.pos, color: MOOD_COLORS.pos }, { label: "Okay", value: f.mix, color: MOOD_COLORS.mix }, { label: "Negative", value: f.neg, color: MOOD_COLORS.neg }]} />
      <ul className="mt-4 grid grid-cols-4 gap-2 border-t border-line pt-4 text-center">
        {FACES.map(face => { const n = d.originals.filter(p => p.face === face.id).length; return <li key={face.id}><span className="block text-xl" aria-hidden>{face.glyph}</span><span className="text-sm font-semibold tabular-nums">{n}</span><span className="block text-[11px] text-muted">{face.label}</span></li>; })}
      </ul>
    </ChartCard>
  );
}

export function PlaceCompare({ d, onSelect }: { d: SentimentData; onSelect?: (slug: string) => void }) {
  return (
    <ChartCard title="How places compare" hint={`Ranked by share of positive ratings. Places need at least ${MIN_RATINGS} ratings to be ranked.`}>
      {d.ranked.length ? (
        <ol className="space-y-3">
          {d.ranked.map((p, i) => (
            <li key={p.id}>
              <button type="button" onClick={() => onSelect?.(p.slug)} className="block w-full min-h-11 rounded-xl p-1 text-left hover:bg-page" aria-label={`${p.name}: ${pct(p.pos, p.total)}% positive from ${p.total} ratings. Show details.`}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium"><span className="mr-2 text-xs tabular-nums text-muted">{i + 1}</span>{p.name}</span><span className="shrink-0 tabular-nums"><b>{pct(p.pos, p.total)}%</b> <span className="text-xs text-muted">· {p.total}</span></span></div>
                <Stack pos={p.pos} mix={p.mix} neg={p.neg} />
              </button>
            </li>
          ))}
        </ol>
      ) : <EmptyChart>Not enough ratings to rank places yet.</EmptyChart>}
      {d.unranked.length ? <p className="mt-4 border-t border-line pt-3 text-xs leading-5 text-muted">Not enough ratings yet: {d.unranked.map(p => `${p.name} (${p.total})`).join(", ")}.</p> : null}
    </ChartCard>
  );
}

export function MoodTrend({ d, action }: { d: SentimentData; action?: ReactNode }) {
  const W = 640, H = 190, L = 28, B = 26, T = 8;
  const days = d.trend;
  const max = Math.max(3, ...days.map(x => x.total));
  const bw = (W - L) / days.length;
  const y = (n: number) => T + (H - T - B) * (1 - n / max);
  const any = days.some(x => x.total);
  const ticks = [0, Math.ceil(max / 2), max];
  return (
    <ChartCard className="sentiment-wide" title="Mood over time" hint={`Ratings per day, last ${d.days} days. Bars show positive, okay and negative.`} action={action}>
      {any ? (
        <>
          <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Ratings per day over the last ${d.days} days`} className="h-auto w-full">
            {ticks.map(t => <g key={t}><line x1={L} x2={W} y1={y(t)} y2={y(t)} stroke="#e4edf3" strokeDasharray={t ? "3 4" : undefined} /><text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="10" fill="#6b8190">{t}</text></g>)}
            {days.map((day, i) => {
              let top = H - B;
              const x = L + i * bw + bw * 0.14;
              const w = bw * 0.72;
              return <g key={day.date}><title>{`${day.label}: ${day.pos} positive, ${day.mix} okay, ${day.neg} negative`}</title>
                {([["neg", day.neg, MOOD_COLORS.neg], ["mix", day.mix, MOOD_COLORS.mix], ["pos", day.pos, MOOD_COLORS.pos]] as const).map(([k, n, color]) => { if (!n) return null; const h = (H - T - B) * (n / max); top -= h; return <rect key={k} x={x} y={top} width={w} height={h} fill={color} rx={Math.min(3, w / 3)} />; })}</g>;
            })}
            {[0, Math.floor(days.length / 2), days.length - 1].map(i => <text key={i} x={L + i * bw + bw / 2} y={H - 6} textAnchor={i === 0 ? "start" : i === days.length - 1 ? "end" : "middle"} fontSize="10" fill="#6b8190">{days[i].label}</text>)}
          </svg>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">{[["Positive", MOOD_COLORS.pos], ["Okay", MOOD_COLORS.mix], ["Negative", MOOD_COLORS.neg]].map(([l, c]) => <span key={l} className="inline-flex items-center gap-1.5"><i className="size-2.5 rounded-full" style={{ background: c }} />{l}</span>)}</p>
        </>
      ) : <EmptyChart>No ratings in this period yet.</EmptyChart>}
    </ChartCard>
  );
}

export function TopicTone({ d }: { d: SentimentData }) {
  return (
    <ChartCard title="What visitors mention" hint="Topics found in written comments, coloured by the tone of those comments. Keyword matches, not proof of cause.">
      {d.topics.length ? (
        <ul className="space-y-3.5">
          {d.topics.map(t => <li key={t.label}><div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm"><span className="font-medium">{t.label}</span><span className="text-xs tabular-nums text-muted">{t.total} mention{t.total === 1 ? "" : "s"}</span></div><Stack pos={t.pos} mix={t.mix} neg={t.neg} /></li>)}
        </ul>
      ) : <EmptyChart>No recognisable topics in comments yet.</EmptyChart>}
    </ChartCard>
  );
}

/* Officer-only charts */
export function MoodHeatmap({ d }: { d: SentimentData }) {
  const rows = d.heat.filter(h => h.total > 0);
  return (
    <ChartCard title="Mood by place" hint="Darker cells mean more ratings of that emoji. Spot a place with a lot of red at a glance.">
      {rows.length ? (
        <div className="sentiment-heat" role="table" aria-label="Ratings by place and emoji">
          <div role="row" className="sentiment-heat-row sentiment-heat-head"><span role="columnheader">Place</span>{FACES.map(f => <span key={f.id} role="columnheader" title={f.label} aria-label={f.label}>{f.glyph}</span>)}</div>
          {rows.map(h => <div role="row" key={h.id} className="sentiment-heat-row"><span role="rowheader" className="truncate">{h.name}</span>{h.counts.map((n, i) => <span key={i} role="cell" className="sentiment-heat-cell" style={{ background: n ? hexA(FACE_HEX[FACES[i].mood], 0.12 + 0.6 * (n / d.heatMax)) : "#f4f8fa" }}>{n || ""}</span>)}</div>)}
        </div>
      ) : <EmptyChart>No ratings in this period yet.</EmptyChart>}
    </ChartCard>
  );
}

export function WeekdayChart({ d }: { d: SentimentData }) {
  const max = Math.max(1, ...d.weekday.map(x => x.total));
  const any = d.weekday.some(x => x.total);
  return (
    <ChartCard title="Ratings by day of the week" hint="Height is the number of ratings; red bars have 30% or more negative. Needs a few weeks of data to mean much.">
      {any ? (
        <div className="grid grid-cols-7 items-end gap-2" role="img" aria-label="Ratings by day of the week">
          {d.weekday.map(x => <div key={x.day} className="flex flex-col items-center gap-1.5" title={`${x.day}: ${x.total} ratings, ${x.neg} negative`}>
            <span className="text-xs tabular-nums text-muted">{x.total || ""}</span>
            <div className="flex h-28 w-full items-end"><div className="w-full rounded-t-lg" style={{ height: `${Math.max(x.total ? 6 : 0, (x.total / max) * 100)}%`, background: x.total && x.neg / x.total >= 0.3 ? MOOD_COLORS.neg : MOOD_COLORS.brand }} /></div>
            <span className="text-xs font-medium">{x.day}</span>
          </div>)}
        </div>
      ) : <EmptyChart>No ratings in this period yet.</EmptyChart>}
    </ChartCard>
  );
}

export function TopicPlaceMatrix({ d }: { d: SentimentData }) {
  const max = Math.max(1, ...d.matrix.flatMap(r => r.cells));
  return (
    <ChartCard title="Where each topic is a problem" hint="Count of mixed or negative comments that mention a topic, by place. Read the comments before acting.">
      {d.matrix.length ? (
        <div className="sentiment-matrix-scroll"><table className="sentiment-matrix"><thead><tr><th scope="col"><span className="sr-only">Topic</span></th>{d.matrixPlaces.map(p => <th key={p.id} scope="col" title={p.name}>{p.name}</th>)}</tr></thead>
          <tbody>{d.matrix.map(r => <tr key={r.label}><th scope="row">{r.label}</th>{r.cells.map((n, i) => <td key={i} style={{ background: n ? hexA(MOOD_COLORS.neg, 0.1 + 0.55 * (n / max)) : undefined }}>{n || ""}</td>)}</tr>)}</tbody></table></div>
      ) : <EmptyChart>No mixed or negative topic mentions yet.</EmptyChart>}
    </ChartCard>
  );
}

export function MismatchList({ d }: { d: SentimentData }) {
  return (
    <ChartCard title="Worth a second look" hint="The emoji and the written comment disagree (for example a happy emoji with a negative comment). Often the most informative ratings.">
      {d.mismatch.length ? (
        <ul className="space-y-2.5">{d.mismatch.map(m => <li key={m.id} className="rounded-xl bg-page p-3 text-sm"><p className="flex items-center gap-2 text-xs text-muted"><span className="text-base" aria-hidden>{m.glyph}</span>{m.place}<span className={cn("rounded-full px-2 py-0.5 font-semibold", m.textMood === "NEG" ? "bg-red-100 text-red-800" : "bg-emerald-100 text-emerald-800")}>comment reads {m.textMood === "NEG" ? "negative" : "positive"}</span></p><p className="mt-1.5 break-words leading-6">{m.body}</p></li>)}</ul>
      ) : <EmptyChart>No clashing ratings found.</EmptyChart>}
    </ChartCard>
  );
}

const MOOD_LABEL = { POS: "Positive stories", MIX: "Okay stories", NEG: "Negative stories" } as const;

function AgreeBar({ up, down }: { up: number; down: number }) {
  const total = up + down;
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-cool" aria-hidden>
      {total ? <><span className="h-full" style={{ width: `${(up / total) * 100}%`, background: MOOD_COLORS.pos }} /><span className="h-full" style={{ width: `${(down / total) * 100}%`, background: MOOD_COLORS.neg }} /></> : null}
    </div>
  );
}

/** Do other visitors agree? Agree / disagree reactions overall, by the mood of the story they were left on, and (desk) by place. */
export function ReactionsCard({ d, desk = false }: { d: SentimentData; desk?: boolean }) {
  const r = d.reactions;
  return (
    <ChartCard title="Do visitors agree?" hint="Agree and disagree taps on stories and replies. Shows whether a mood is shared by others, not just one visitor.">
      {r.total ? (
        <>
          <div className="flex items-end justify-between gap-3"><p className="text-3xl font-semibold tabular-nums">{pct(r.up, r.total)}%<span className="ml-2 text-sm font-normal text-muted">agree</span></p><p className="text-sm tabular-nums text-muted">👍 {r.up} · 👎 {r.down}</p></div>
          <div className="mt-3"><AgreeBar up={r.up} down={r.down} /></div>
          <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">By type of story</h3>
          <ul className="mt-2 space-y-3">
            {r.byMood.map(m => (
              <li key={m.mood}>
                <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm"><span className="font-medium">{MOOD_LABEL[m.mood]} <span className="text-xs text-muted">· {m.stories}</span></span><span className="tabular-nums text-xs text-muted">{m.up + m.down ? <>👍 {m.up} · 👎 {m.down}</> : "no reactions"}</span></div>
                <AgreeBar up={m.up} down={m.down} />
              </li>
            ))}
          </ul>
          {desk && r.byPlace.length ? (
            <>
              <h3 className="mt-5 text-xs font-semibold uppercase tracking-wide text-muted">Most reacted places</h3>
              <ul className="mt-2 space-y-3">
                {r.byPlace.map(p => <li key={p.id}><div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm"><span className="min-w-0 truncate font-medium">{p.name}</span><span className="shrink-0 tabular-nums text-xs text-muted">👍 {p.up} · 👎 {p.down}</span></div><AgreeBar up={p.up} down={p.down} /></li>)}
              </ul>
            </>
          ) : null}
        </>
      ) : <EmptyChart>No agree or disagree reactions in this period yet.</EmptyChart>}
    </ChartCard>
  );
}

/** Stories other visitors reacted to most. A negative story many agree with is a stronger signal than a single complaint. */
export function TopReacted({ d }: { d: SentimentData }) {
  const top = d.reactions.top;
  return (
    <ChartCard title="Most reacted stories" hint="Original ratings that got the most agree and disagree taps.">
      {top.length ? (
        <ol className="space-y-2.5">
          {top.map(t => {
            const backed = t.mood === "NEG" && t.up > t.down;
            return (
              <li key={t.id} className="rounded-xl bg-page p-3">
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted"><span aria-hidden className="text-base">{t.glyph}</span><span>{t.place}</span>{backed ? <span className="rounded-full bg-neg/10 px-2 py-0.5 font-semibold text-neg">Visitors agree it was negative</span> : null}</div>
                <p className="mt-1.5 text-sm leading-relaxed break-words">{t.body || "Emoji only"}</p>
                <p className="mt-1.5 text-xs tabular-nums text-muted">👍 {t.up} · 👎 {t.down}</p>
              </li>
            );
          })}
        </ol>
      ) : <EmptyChart>No stories have been reacted to in this period yet.</EmptyChart>}
    </ChartCard>
  );
}

export function SourceChart({ d }: { d: SentimentData }) {
  const max = Math.max(1, ...d.sources.map(x => x.total));
  const outside = d.sources.some(x => x.id !== "visitor");
  return (
    <ChartCard title="Feedback by source" hint="Site emoji feedback compared with comments the office added from Facebook, reviews, surveys and walk-ins. Bar length is the number of ratings.">
      {d.sources.length ? (
        <>
          <ul className="grid gap-3">
            {d.sources.map(x => (
              <li key={x.id}>
                <div className="flex items-baseline justify-between gap-3 text-sm"><span className="font-medium">{x.label}</span><span className="text-xs tabular-nums text-muted">{x.total} ratings · {pct(x.pos, x.total)}% positive</span></div>
                <div className="mt-1.5" style={{ width: `${Math.max(6, (x.total / max) * 100)}%` }}><Stack pos={x.pos} mix={x.mix} neg={x.neg} className="h-3" /></div>
              </li>
            ))}
          </ul>
          {!outside ? <p className="mt-3 text-xs text-muted">Only site feedback so far. Use Add feedback to bring in outside comments.</p> : null}
        </>
      ) : <EmptyChart>No ratings in this period yet.</EmptyChart>}
    </ChartCard>
  );
}
