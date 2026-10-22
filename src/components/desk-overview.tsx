"use client";
import { useState } from "react";
import { MessageCircle, FileText, Star, ThumbsUp, RefreshCw } from "lucide-react";
import { usePulse } from "@/lib/pulse/store";
import { buildInsights } from "@/lib/pulse/insights";
import { MoodBar } from "./mood-bar";
import { AiBriefing } from "./ai-briefing";
import { ChartCard, DonutChart, EmptyChart, FaceBars, HBarChart, MOOD_COLORS, PlaceBars, Sparkline, TrendChart } from "./desk-charts";

const FACE_COLOR = { POS: MOOD_COLORS.pos, MIX: MOOD_COLORS.mix, NEG: MOOD_COLORS.neg } as const;

export function DeskOverview() {
  const pulses = usePulse(s => s.pulses);
  const channels = usePulse(s => s.channels);
  const status = usePulse(s => s.syncStatus);
  const sync = usePulse(s => s.syncShared);
  const data = buildInsights(pulses, channels);
  const [refreshing, setRefreshing] = useState(false);
  const [resetSignal, setResetSignal] = useState(0);
  const fingerprint = JSON.stringify(pulses.map(p => [p.id, p.reacts]));
  const f = data.faces;
  const positiveShare = f.total ? Math.round((f.pos / f.total) * 100) : 0;
  const weekTotal = data.trend.reduce((n, d) => n + d.count, 0);
  const trendValues = data.trend.map(d => d.count);
  const kpis = [
    { label: "Original ratings", value: data.originalCount, icon: Star, tone: "bg-blue-50 text-blue-600", extra: <div><Sparkline values={trendValues} /><p className="mt-1 text-[11px] text-muted">{weekTotal} in the last 7 days</p></div> },
    { label: "Replies", value: data.replyCount, icon: MessageCircle, tone: "bg-sky-50 text-sky-600" },
    { label: "Classified notes", value: data.words.total, icon: FileText, tone: "bg-violet-50 text-violet-600" },
    { label: "Agree / disagree", value: `${data.reactions.up} / ${data.reactions.down}`, icon: ThumbsUp, tone: "bg-emerald-50 text-emerald-600" },
  ];
  const places = data.places.map(p => ({ id: p.id, name: p.name, slug: p.slug, pos: p.faces.pos, mix: p.faces.mix, neg: p.faces.neg, total: p.faces.total, notes: p.words.mix }));
  return <div className="desk-overview mt-6 space-y-5">
    <div className="desk-data-status flex items-center justify-between gap-3 text-sm"><p className="text-muted">{status === "connected" ? "Connected" : "Data may be incomplete or cached — refresh before reporting."} · {data.loaded} recent entries</p><button type="button" disabled={refreshing} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4" onClick={async () => { setRefreshing(true); setResetSignal(n => n + 1); try { await sync(); } finally { setRefreshing(false); } }}><RefreshCw size={15} className={refreshing ? "animate-spin" : undefined} aria-hidden />{refreshing ? "Refreshing…" : "Refresh"}</button></div>
    <div className="desk-stat-grid grid grid-cols-2 gap-3 xl:grid-cols-4">{kpis.map(k => { const Icon = k.icon; return <div key={k.label} className="desk-kpi flex flex-col rounded-2xl border border-line bg-white p-4"><div className="flex items-center justify-between gap-2"><p className="text-sm text-muted">{k.label}</p><span className={`grid size-8 shrink-0 place-items-center rounded-full ${k.tone}`} aria-hidden><Icon size={16} /></span></div><p className="mt-2 text-3xl font-semibold tabular-nums">{k.value}</p>{k.extra ? <div className="desk-kpi-extra mt-2">{k.extra}</div> : null}</div>; })}</div>
    <AiBriefing data={data} status={status} fingerprint={fingerprint} resetSignal={resetSignal} />
    <div className="desk-chart-grid grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-12 xl:gap-5">
      <ChartCard title="Emoji rating mix" hint="Original ratings only; replies are excluded." className="xl:col-span-4">
        <DonutChart ariaLabel={`Emoji rating mix: ${f.pos} positive, ${f.mix} okay, ${f.neg} negative`} centerValue={`${positiveShare}%`} centerLabel="Positive" empty="No original ratings yet." segments={[{ label: "Positive", value: f.pos, color: MOOD_COLORS.pos }, { label: "Okay", value: f.mix, color: MOOD_COLORS.mix }, { label: "Negative", value: f.neg, color: MOOD_COLORS.neg }]} />
        <div className="mt-5 space-y-4 border-t border-line pt-4">{[["Individual places", data.placeFaces], ["Overall Daet visit", data.tripFaces]].map(([label, tally]) => { const t = tally as typeof data.faces; return <div key={String(label)}><div className="mb-1.5 flex justify-between text-xs"><span className="font-medium">{String(label)}</span><span className="tabular-nums text-muted">{t.total} ratings</span></div><MoodBar tally={t} /></div>; })}</div>
      </ChartCard>
      <ChartCard title="Written comment sentiment" hint="Estimated from words and negation in notes and replies. Local expressions and sarcasm may be misunderstood." className="xl:col-span-4">
        <DonutChart ariaLabel={`Comment sentiment: ${data.words.pos} positive, ${data.words.mix} mixed, ${data.words.neg} negative`} centerValue={data.words.total} centerLabel="Classified" empty="No classified comments yet." segments={[{ label: "Positive", value: data.words.pos, color: MOOD_COLORS.pos }, { label: "Mixed / OK", value: data.words.mix, color: MOOD_COLORS.mix }, { label: "Negative", value: data.words.neg, color: MOOD_COLORS.neg }]} />
      </ChartCard>
      <ChartCard title="Ratings by emoji" hint="How visitors picked each face." className="md:col-span-2 xl:col-span-4">
        {data.originalCount ? <FaceBars items={data.faceCounts.map(i => ({ id: i.id, glyph: i.glyph, label: i.label, count: i.count, color: FACE_COLOR[i.mood] }))} /> : <EmptyChart>No original ratings yet.</EmptyChart>}
      </ChartCard>
      <ChartCard title="Original feedback · Last 7 days" hint="UTC dates · Counts within the latest loaded entries" className="md:col-span-2 xl:col-span-8">
        <TrendChart data={data.trend} />
      </ChartCard>
      <ChartCard title="Topics mentioned" hint="Keyword matches in classified notes; not aspect-specific sentiment." className="md:col-span-2 xl:col-span-4">
        {data.mentions.length ? <HBarChart rows={data.mentions.map(t => ({ label: t.label, value: t.mentions, sub: `${t.review} in mixed/negative notes — review context`, color: t.review ? MOOD_COLORS.mix : MOOD_COLORS.brand }))} unit=" mentions" /> : <EmptyChart>No recognizable topic mentions yet.</EmptyChart>}
      </ChartCard>
    </div>
    <ChartCard title="Place review queue" hint="Sorted by negative emoji rating count, then total ratings. Bar length shows relative rating volume. This is a review aid, not a ranking of place quality.">
      {places.length ? <PlaceBars rows={places} /> : <EmptyChart>No place ratings yet.</EmptyChart>}
    </ChartCard>
  </div>;
}
