"use client";
import { useState } from "react";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CheckCircle2, Eye, Info, RefreshCw, Sparkles, Star, MessageCircle, Lightbulb, ThumbsUp } from "lucide-react";
import { usePulse } from "@/lib/pulse/store";
import { buildInsights } from "@/lib/pulse/insights";
import { buildAttention } from "@/lib/pulse/attention";
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
  const wishes = usePulse(s => s.wishes);
  const openWishes = wishes.filter(w => w.status === "open").length;
  const attention = buildAttention(data);
  const { weekly } = data;
  const delta = weekly.current - weekly.previous;
  const tiles = [
    { label: "Ratings this week", value: weekly.current, icon: Star, tone: "bg-blue-50 text-blue-600", sub: weekly.previous ? `${delta >= 0 ? "▲" : "▼"} ${Math.abs(delta)} vs last week (${weekly.previous})` : "No ratings the week before" },
    { label: "Positive", value: data.faces.total ? `${positiveShare}%` : "–", icon: ThumbsUp, tone: "bg-emerald-50 text-emerald-600", sub: `${f.pos} of ${f.total} original ratings` },
    { label: "Comments to read", value: weekly.notes, icon: MessageCircle, tone: "bg-violet-50 text-violet-600", sub: "written in the last 7 days" },
    { label: "Open suggestions", value: openWishes, icon: Lightbulb, tone: "bg-amber-50 text-amber-600", sub: openWishes ? "from visitors, awaiting review" : "nothing waiting", href: "/desk/wishes" },
  ];
  const LEVEL = {
    high: { label: "Urgent", icon: AlertTriangle, card: "border-red-200 bg-red-50/70", pill: "bg-red-100 text-red-800" },
    medium: { label: "Review", icon: Eye, card: "border-amber-200 bg-amber-50/70", pill: "bg-amber-100 text-amber-900" },
    low: { label: "Note", icon: Info, card: "border-line bg-white", pill: "bg-slate-100 text-slate-700" },
    good: { label: "Going well", icon: CheckCircle2, card: "border-emerald-200 bg-emerald-50/70", pill: "bg-emerald-100 text-emerald-800" },
  } as const;
  const BANNER = {
    act: "border-red-200 bg-red-50 text-red-900", watch: "border-amber-200 bg-amber-50 text-amber-900",
    ok: "border-emerald-200 bg-emerald-50 text-emerald-900", empty: "border-line bg-white text-ink",
  } as const;
  const places = data.places.map(p => ({ id: p.id, name: p.name, slug: p.slug, pos: p.faces.pos, mix: p.faces.mix, neg: p.faces.neg, total: p.faces.total, notes: p.words.mix }));
  return <div className="desk-overview mt-6 space-y-5">
    <div className="desk-data-status flex items-center justify-between gap-3 text-sm"><p className="text-muted">{status === "connected" ? "Connected" : "Data may be incomplete or cached — refresh before reporting."} · {data.loaded} recent entries</p><button type="button" disabled={refreshing} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-white px-4" onClick={async () => { setRefreshing(true); setResetSignal(n => n + 1); try { await sync(); } finally { setRefreshing(false); } }}><RefreshCw size={15} className={refreshing ? "animate-spin" : undefined} aria-hidden />{refreshing ? "Refreshing…" : "Refresh"}</button></div>
    <div role="status" className={`desk-status-banner flex items-start gap-3 rounded-2xl border p-4 sm:p-5 ${BANNER[attention.status.level]}`}>
      <span className="mt-0.5 shrink-0" aria-hidden>{attention.status.level === "act" ? <AlertTriangle size={22} /> : attention.status.level === "ok" ? <CheckCircle2 size={22} /> : attention.status.level === "watch" ? <Eye size={22} /> : <Info size={22} />}</span>
      <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider opacity-70">Today at a glance</p><p className="mt-0.5 text-lg font-semibold leading-snug sm:text-xl">{attention.status.text}</p></div>
    </div>
    {attention.items.length ? <section aria-labelledby="attention-title" className="desk-attention">
      <h2 id="attention-title" className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Needs your attention</h2>
      <ul className="desk-attention-grid grid gap-3">{attention.items.map(item => { const l = LEVEL[item.level]; const Icon = l.icon; return <li key={item.id} className={`flex flex-col rounded-2xl border p-4 ${l.card}`}>
        <span className={`inline-flex w-fit items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${l.pill}`}><Icon size={13} aria-hidden />{l.label}</span>
        <p className="mt-3 font-semibold leading-snug">{item.title}</p>
        <p className="mt-1.5 text-sm leading-6 text-muted">{item.detail}</p>
        {item.href ? <Link href={item.href} className="mt-auto inline-flex min-h-11 items-center gap-1.5 pt-2 text-sm font-semibold text-blue-700">Open comments <ArrowRight size={15} aria-hidden /></Link> : null}
      </li>; })}</ul>
    </section> : null}
    <div className="desk-stat-grid grid grid-cols-2 gap-3 xl:grid-cols-4">{tiles.map(k => { const Icon = k.icon; const body = <><div className="flex items-center justify-between gap-2"><p className="text-sm text-muted">{k.label}</p><span className={`grid size-8 shrink-0 place-items-center rounded-full ${k.tone}`} aria-hidden><Icon size={16} /></span></div><p className="mt-2 text-3xl font-semibold tabular-nums">{k.value}</p><p className="desk-kpi-sub mt-1 text-xs leading-5 text-muted">{k.sub}</p></>; return k.href ? <Link key={k.label} href={k.href} className="desk-kpi flex flex-col rounded-2xl border border-line bg-white p-4 transition hover:border-blue-300">{body}</Link> : <div key={k.label} className="desk-kpi flex flex-col rounded-2xl border border-line bg-white p-4">{body}</div>; })}</div>
    <AiBriefing data={data} status={status} fingerprint={fingerprint} resetSignal={resetSignal} />
    <details className="desk-details rounded-2xl border border-line bg-white">
      <summary className="flex min-h-14 cursor-pointer items-center justify-between gap-3 px-4 py-3 text-sm font-semibold sm:px-5"><span className="inline-flex items-center gap-2"><Sparkles size={15} aria-hidden className="text-blue-600" />Charts and details</span><span className="text-xs font-normal text-muted">Rating mix · comments · trend · topics · place queue</span></summary>
      <div className="space-y-5 border-t border-line p-4 sm:p-5">
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
      </div>
    </details>
  </div>;
}
