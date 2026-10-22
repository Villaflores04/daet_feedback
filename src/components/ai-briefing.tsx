"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, RefreshCw, Sparkles } from "lucide-react";
import type { buildInsights } from "@/lib/pulse/insights";
import { cn } from "@/lib/utils";
import { MoodBar } from "./mood-bar";
import { MOOD_COLORS } from "./desk-charts";

type Insights = ReturnType<typeof buildInsights>;
type SectionKey = "obs" | "prio" | "next" | "other";
type Block = { kind: "p"; text: string } | { kind: "li"; text: string; n?: number; proposal: boolean };
type Section = { key: SectionKey; blocks: Block[] };

const META: Record<SectionKey, { emoji: string; title: string; tone: string }> = {
  obs: { emoji: "🔎", title: "Observations", tone: "border-blue-200 bg-blue-50/70" },
  prio: { emoji: "⚠️", title: "Review priorities", tone: "border-amber-200 bg-amber-50/70" },
  next: { emoji: "💡", title: "Suggested next steps", tone: "border-emerald-200 bg-emerald-50/70" },
  other: { emoji: "📋", title: "Briefing", tone: "border-line bg-page" },
};
const HEADING = /^(?:#+\s*)?\*{0,2}(observations?|review priorities|priorities|suggested next steps|next steps|recommendations?)\*{0,2}\s*(?::\s*\*{0,2}\s*(.*))?$/i;
const ITEM = /^\s*(?:[-*•]\s+|(\d+)[.)]\s+)(.*)$/;
const clean = (s: string) => s.replace(/\*\*/g, "").replace(/(^|\s)_([^_]+)_(?=\s|$)/g, "$1$2").trim();
const keyOf = (name: string): SectionKey => (/observ/i.test(name) ? "obs" : /priorit/i.test(name) ? "prio" : "next");

/** Turns the model's plain-text briefing into labelled sections. Falls back to a single section for unexpected text. */
export function parseBriefing(text: string): Section[] {
  const sections: Section[] = [];
  let current: Section | null = null;
  const push = (key: SectionKey) => { current = { key, blocks: [] }; sections.push(current); return current; };
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const heading = HEADING.exec(line);
    if (heading) {
      const section = push(keyOf(heading[1]));
      const rest = clean(heading[2] ?? "");
      if (rest) section.blocks.push({ kind: "p", text: rest });
      continue;
    }
    const target: Section = current ?? push("other");
    const item = ITEM.exec(line);
    if (item) {
      const body = clean(item[2]);
      const proposal = /^proposal(?: for human review)?\s*:\s*/i.test(body);
      target.blocks.push({ kind: "li", text: body.replace(/^proposal(?: for human review)?\s*:\s*/i, ""), n: item[1] ? Number(item[1]) : undefined, proposal });
    } else target.blocks.push({ kind: "p", text: clean(line) });
  }
  return sections.filter(s => s.blocks.length);
}

function Ring({ pos, mix, neg }: { pos: number; mix: number; neg: number }) {
  const total = pos + mix + neg;
  const r = 38, C = 2 * Math.PI * r;
  const parts = [{ v: pos, c: MOOD_COLORS.pos }, { v: mix, c: MOOD_COLORS.mix }, { v: neg, c: MOOD_COLORS.neg }].filter(p => p.v > 0);
  const gap = parts.length > 1 ? 2 : 0;
  let offset = 0;
  return (
    <div className="relative size-24 shrink-0">
      <svg viewBox="0 0 100 100" className="size-full -rotate-90" role="img" aria-label={`${pos} positive, ${mix} okay, ${neg} negative original ratings`}>
        <circle cx="50" cy="50" r={r} fill="none" stroke={MOOD_COLORS.track} strokeWidth="13" />
        {total > 0 && parts.map(p => { const len = (p.v / total) * C; const node = <circle key={p.c} cx="50" cy="50" r={r} fill="none" stroke={p.c} strokeWidth="13" strokeDasharray={`${Math.max(len - gap, 0.01)} ${C}`} strokeDashoffset={-offset} />; offset += len; return node; })}
      </svg>
      <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
        <div><p className="font-display text-2xl font-semibold leading-none tabular-nums">{total ? `${Math.round((pos / total) * 100)}%` : "–"}</p><p className="mt-1 text-[9px] font-semibold uppercase tracking-wider text-muted">Positive</p></div>
      </div>
    </div>
  );
}

function Snapshot({ data }: { data: Insights }) {
  const f = data.faces;
  const maxFace = Math.max(1, ...data.faceCounts.map(i => i.count));
  const tone = { POS: MOOD_COLORS.pos, MIX: MOOD_COLORS.mix, NEG: MOOD_COLORS.neg } as const;
  const topic = data.mentions.find(t => t.review > 0);
  const priority = data.places.find(p => p.faces.neg > 0);
  const chips = [
    { emoji: "😢", text: `${f.neg} negative rating${f.neg === 1 ? "" : "s"}`, hot: f.neg > 0 },
    { emoji: "📝", text: `${data.words.mix} mixed/neutral note${data.words.mix === 1 ? "" : "s"}`, hot: data.words.mix > 0 },
    ...(priority ? [{ emoji: "📍", text: `${priority.name} · ${priority.faces.neg} negative`, hot: true }] : []),
    ...(topic ? [{ emoji: "🏷️", text: `${topic.label} · ${topic.review} to review`, hot: true }] : []),
  ];
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
      <div className="flex items-center gap-4 rounded-xl border border-line bg-white p-4">
        <Ring pos={f.pos} mix={f.mix} neg={f.neg} />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Rating mix</p>
          <p className="mt-1 text-sm tabular-nums"><span className="font-semibold">{f.total}</span> original ratings</p>
          <p className="mt-1 text-xs leading-5 text-muted tabular-nums">{f.pos} positive · {f.mix} okay · {f.neg} negative</p>
        </div>
      </div>
      <div className="rounded-xl border border-line bg-white p-4">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted">By emoji</p>
        <ul className="mt-3 space-y-2" aria-label="Ratings by emoji">
          {data.faceCounts.map(i => (
            <li key={i.id} className="grid grid-cols-[1.75rem_minmax(0,1fr)_1.75rem] items-center gap-2">
              <span className="text-lg leading-none" title={i.label}>{i.glyph}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-cool"><span className="chart-hbar block h-full rounded-full" style={{ width: `${(i.count / maxFace) * 100}%`, background: tone[i.mood] }} /></span>
              <span className="text-right text-sm font-semibold tabular-nums">{i.count}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl border border-line bg-white p-4 sm:col-span-2 lg:col-span-1">
        <div className="flex items-baseline justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wider text-muted">Written comments</p><p className="text-xs tabular-nums text-muted">{data.words.total} classified</p></div>
        <MoodBar tally={data.words} className="mt-3 h-3" />
        <p className="mt-2 text-xs tabular-nums text-muted">{data.words.pos} positive · {data.words.mix} mixed · {data.words.neg} negative</p>
        <ul className="mt-4 flex flex-wrap gap-2" aria-label="Items needing attention">
          {chips.map(c => <li key={c.text} className={cn("inline-flex max-w-full items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs", c.hot ? "border-amber-200 bg-amber-50 text-amber-900" : "border-line bg-page text-muted")}><span aria-hidden>{c.emoji}</span><span className="min-w-0 truncate">{c.text}</span></li>)}
        </ul>
      </div>
    </div>
  );
}

function BriefingText({ text }: { text: string }) {
  const sections = parseBriefing(text);
  return (
    <div className="space-y-3">
      {sections.map((s, i) => {
        const meta = META[s.key];
        const paras = s.blocks.filter((b): b is Extract<Block, { kind: "p" }> => b.kind === "p");
        const items = s.blocks.filter((b): b is Extract<Block, { kind: "li" }> => b.kind === "li");
        return (
          <article key={`${s.key}-${i}`} className={cn("rounded-xl border p-4", meta.tone)}>
            <h3 className="flex items-center gap-2 text-base font-semibold"><span aria-hidden className="text-xl leading-none">{meta.emoji}</span>{meta.title}</h3>
            {paras.map((b, j) => <p key={j} className="mt-2 text-sm leading-6">{b.text}</p>)}
            {items.length ? <ul className="mt-3 space-y-2.5">{items.map((b, j) => (
              <li key={j} className="flex gap-3 text-sm leading-6">
                {b.n !== undefined || s.key === "prio" ? <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-white text-xs font-semibold tabular-nums shadow-sm" aria-hidden>{b.n ?? j + 1}</span> : <span className="mt-2.5 size-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />}
                <span className="min-w-0">{b.proposal ? <span className="mr-2 inline-block rounded-full bg-white px-2 py-0.5 align-middle text-[10px] font-semibold uppercase tracking-wide text-emerald-700 shadow-sm">Proposal</span> : null}{b.text}</span>
              </li>))}</ul> : null}
          </article>
        );
      })}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-label="Preparing briefing">
      {[0, 1, 2].map(i => <div key={i} className="animate-pulse rounded-xl border border-line bg-white p-4"><div className="h-4 w-40 rounded bg-cool" /><div className="mt-3 h-3 w-full rounded bg-cool" /><div className="mt-2 h-3 w-5/6 rounded bg-cool" />{i === 1 ? <div className="mt-2 h-3 w-2/3 rounded bg-cool" /> : null}</div>)}
      <p className="text-center text-xs text-muted">Preparing briefing… this can take up to half a minute when the AI service is busy.</p>
    </div>
  );
}

export function AiBriefing({ data, status, fingerprint, resetSignal }: { data: Insights; status: string; fingerprint: string; resetSignal: number }) {
  const [ai, setAi] = useState("");
  const [stamp, setStamp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setAi(""); setError(""); }, [resetSignal]);
  const blocked = status !== "connected" || !data.loaded;
  const stale = Boolean(ai) && stamp !== fingerprint;
  async function generate() {
    setBusy(true); setError(""); setAi(""); setCopied(false);
    try {
      const response = await fetch("/api/desk/insights", { method: "POST" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "AI summary unavailable.");
      setAi(body.summary); setStamp(fingerprint);
    } catch (e) { setError(e instanceof Error ? e.message : "AI summary unavailable."); }
    finally { setBusy(false); }
  }
  async function copy() {
    try { await navigator.clipboard.writeText(ai); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard may be blocked */ }
  }
  return (
    <section className="desk-briefing overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white p-5 sm:p-6" aria-labelledby="ai-briefing-title">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700"><Sparkles size={14} aria-hidden />AI-assisted briefing</p>
          <h2 id="ai-briefing-title" className="mt-1 text-xl font-semibold">What needs attention?</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">A draft reading of your latest counts, with review priorities and proposed next steps. Names, photos and raw comments are never sent.</p>
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          {ai ? <button type="button" onClick={copy} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium" aria-live="polite">{copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}{copied ? "Copied" : "Copy"}</button> : null}
          <button type="button" disabled={busy || blocked} onClick={generate} className="primary-link !min-h-11 flex-1 !gap-2 !rounded-full !px-5 !py-2.5 disabled:opacity-50 sm:flex-none">{busy ? <RefreshCw size={15} className="animate-spin" aria-hidden /> : <Sparkles size={15} aria-hidden />}{busy ? "Preparing…" : ai ? "Regenerate" : "Generate AI briefing"}</button>
        </div>
      </header>
      {blocked && !busy ? <p className="mt-3 text-xs text-muted">{data.loaded ? "Waiting for a live connection — refresh the data to enable the briefing." : "No feedback loaded yet — collect or refresh data first."}</p> : null}
      <div className="mt-5 grid items-start gap-4 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[21rem_minmax(0,1fr)]">
        <Snapshot data={data} />
        <div className="min-w-0">
          {busy ? <Skeleton /> : ai ? (
            <div>
              <p className={cn("mb-3 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold", stale ? "bg-amber-100 text-amber-900" : "bg-white text-muted shadow-sm")}>{stale ? "Data changed — regenerate this briefing" : "AI-generated draft · Officer review required"}</p>
              <BriefingText text={ai} />
            </div>
          ) : error ? (
            <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-amber-900"><AlertTriangle size={16} aria-hidden />Couldn’t prepare the briefing</p>
              <p className="mt-2 leading-6 text-amber-900">{error}</p>
              <p className="mt-2 text-xs text-amber-900/80">The snapshot and data notes remain available. Try again in a moment.</p>
            </div>
          ) : (
            <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-blue-200 bg-white/70 p-6 text-center">
              <div><p className="text-3xl" aria-hidden>🧭</p><p className="mt-2 font-semibold">Ready when you are</p><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">Generate a briefing to get observations, review priorities and suggested next steps based on the snapshot.</p></div>
            </div>
          )}
          <details className="desk-summary-details mt-4 rounded-xl border border-line bg-white px-4" open={Boolean(error)}>
            <summary>Data notes and limits</summary>
            <ul className="mb-3 list-disc space-y-2 pl-5 text-sm leading-6">{data.lines.map(line => <li key={line}>{line}</li>)}</ul>
            <p className="mb-3 text-xs leading-5 text-muted">These are sampled submissions, not unique visitors or a representative tourism survey. Agree/disagree reactions describe responses to comments; they do not prove spam or explain the reason for a rating. Summaries cover the latest 500 entries. AI text is a draft — check it against the data before making decisions.</p>
          </details>
        </div>
      </div>
    </section>
  );
}
