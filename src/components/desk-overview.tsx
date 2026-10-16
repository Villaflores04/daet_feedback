"use client";
import { useState } from "react";
import Link from "next/link";
import { usePulse } from "@/lib/pulse/store";
import { buildInsights } from "@/lib/pulse/insights";
import { WordMeter } from "./word-meter";
import { MoodBar } from "./mood-bar";

export function DeskOverview() {
  const pulses = usePulse(s => s.pulses);
  const channels = usePulse(s => s.channels);
  const status = usePulse(s => s.syncStatus);
  const sync = usePulse(s => s.syncShared);
  const data = buildInsights(pulses, channels);
  const [refreshing, setRefreshing] = useState(false);
  const [ai, setAi] = useState("");
  const [aiError, setAiError] = useState("");
  const [busy, setBusy] = useState(false);
  const [aiStamp, setAiStamp] = useState("");
  const fingerprint = JSON.stringify(pulses.map(p => [p.id, p.reacts]));
  async function generate() {
    setBusy(true); setAiError(""); setAi("");
    try {
      const response = await fetch("/api/desk/insights", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "AI summary unavailable.");
      setAi(body.summary); setAiStamp(fingerprint);
    } catch (error) { setAiError(error instanceof Error ? error.message : "AI summary unavailable."); }
    finally { setBusy(false); }
  }
  const max = Math.max(1, ...data.trend.map(d => d.count));
  return <div className="desk-overview mt-6 space-y-5">
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm"><p className="text-muted">{status === "connected" ? "Shared database connected" : "Data may be incomplete or cached — refresh before reporting."} · Latest {data.loaded} of up to 500 entries</p><button type="button" disabled={refreshing} className="min-h-11 rounded-full border border-line bg-white px-4" onClick={async () => { setRefreshing(true); setAi(""); try { await sync(); } finally { setRefreshing(false); } }}>{refreshing ? "Refreshing…" : "Refresh data"}</button></div>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">{[["Original ratings", data.originalCount], ["Replies", data.replyCount], ["Classified notes", data.words.total], ["Agree / disagree", `${data.reactions.up} / ${data.reactions.down}`]].map(([label, count]) => <div key={label} className="rounded-2xl border border-line bg-white p-4"><p className="text-sm text-muted">{label}</p><p className="mt-2 text-3xl font-semibold tabular-nums">{count}</p></div>)}</div>
    <section className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-6"><p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Automatic data summary · Rule-based</p><h2 className="mt-1 text-xl font-semibold">What needs attention?</h2><ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6">{data.lines.map(line => <li key={line}>{line}</li>)}</ul><p className="mt-3 text-xs text-muted">These are sampled submissions, not unique visitors or a representative tourism survey. Agree/disagree reactions describe responses to comments; they do not prove spam or explain the reason for a rating.</p></section>
    <div className="grid items-start gap-5 xl:grid-cols-2">
      <section className="rounded-2xl bg-white p-5 shadow-plate"><h2 className="font-semibold text-lg">Emoji ratings by scope</h2><div className="mt-4 space-y-5">{[["Individual places", data.placeFaces], ["Overall Daet visit", data.tripFaces]].map(([label, tally]) => { const t = tally as typeof data.faces; return <div key={String(label)}><div className="mb-2 flex justify-between text-sm"><span>{String(label)}</span><span>{t.total} ratings</span></div><MoodBar tally={t} /><p className="mt-2 text-xs text-muted">{t.pos} positive · {t.mix} okay · {t.neg} negative</p></div>; })}</div></section>
      <WordMeter tally={data.words} title="Written comment sentiment" />
      <section className="rounded-2xl bg-white p-5 shadow-plate"><h2 className="font-semibold text-lg">Original feedback · Last 7 days</h2><p className="mt-1 text-xs text-muted">UTC dates · Counts within the latest loaded entries</p><div className="mt-5 grid grid-cols-7 gap-2" aria-label="Daily original feedback counts">{data.trend.map(day => <div key={day.date} className="text-center"><div className="h-28 flex flex-col justify-end"><span className="text-xs mb-1 tabular-nums">{day.count}</span><div className="rounded-t-md bg-blue-600" style={{ height: `${day.count / max * 80}px`, minHeight: day.count ? 4 : 0 }} /></div><time className="mt-2 block text-[10px] text-muted" dateTime={day.date}>{day.date.slice(5)}</time></div>)}</div></section>
      <section className="rounded-2xl bg-white p-5 shadow-plate"><h2 className="font-semibold text-lg">Topics mentioned</h2><p className="mt-1 text-xs text-muted">Keyword matches in classified notes; not aspect-specific sentiment.</p>{data.mentions.length ? <ul className="mt-4 space-y-3">{data.mentions.map(t => <li key={t.label}><div className="flex justify-between gap-3 text-sm"><span>{t.label}</span><span>{t.mentions} mentions</span></div><p className="text-xs text-muted">{t.review} in mixed/negative notes — review context</p></li>)}</ul> : <p className="mt-4 text-sm text-muted">No recognizable topic mentions yet.</p>}</section>
    </div>
    <section className="rounded-2xl bg-white p-5 shadow-plate"><h2 className="font-semibold text-lg">Place review queue</h2><p className="mt-1 text-sm text-muted">Sorted by negative emoji rating count, then total ratings. This is a review aid, not a ranking of place quality.</p><ul className="mt-3 divide-y divide-line">{data.places.map(p => <li key={p.id}><Link href={`/desk/board?open=${encodeURIComponent(p.slug)}&tab=words`} className="flex min-h-16 flex-wrap items-center justify-between gap-2 py-3"><span className="font-medium text-blue-700">{p.name} →</span><span className="text-xs text-muted">{p.faces.total} ratings · {p.faces.neg} negative · {p.words.mix} mixed/neutral notes</span></Link></li>)}</ul></section>
    <section className="rounded-2xl border border-line bg-white p-5"><h2 className="font-semibold text-lg">AI-assisted briefing</h2><p className="mt-2 text-sm text-muted">Generate a draft interpretation from aggregate counts and topic totals. Names, photos, and raw comments are not sent. Review the draft against the data before making decisions.</p><button type="button" disabled={busy || status !== "connected" || !data.loaded} onClick={generate} className="primary-link mt-4 disabled:opacity-50">{busy ? "Preparing briefing…" : "Generate AI briefing"}</button>{aiError && <p role="status" className="mt-3 text-sm text-muted">{aiError} The automatic data summary above remains available.</p>}{ai && <div className="mt-4 rounded-xl bg-cool p-4"><p className="mb-2 text-xs font-semibold">AI-generated draft · {aiStamp !== fingerprint ? "Data changed — regenerate this briefing" : "Officer review required"}</p><p className="whitespace-pre-wrap text-sm leading-6">{ai}</p></div>}</section>
  </div>;
}
