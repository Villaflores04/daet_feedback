"use client";
import { useEffect, useState } from "react";
import { AlertTriangle, Check, Copy, FileText, RefreshCw, Sparkles } from "lucide-react";
import type { buildInsights } from "@/lib/pulse/insights";
import type { Briefing } from "@/lib/pulse/briefing";
import { cn } from "@/lib/utils";

type Insights = ReturnType<typeof buildInsights>;

const TONE = {
  positive: { emoji: "😊", label: "Positive", card: "border-emerald-200 bg-emerald-50/70", chip: "bg-emerald-100 text-emerald-800" },
  mixed: { emoji: "😐", label: "Mixed", card: "border-amber-200 bg-amber-50/70", chip: "bg-amber-100 text-amber-900" },
  negative: { emoji: "😢", label: "Negative", card: "border-red-200 bg-red-50/70", chip: "bg-red-100 text-red-800" },
} as const;
const LEVEL = { high: "bg-red-100 text-red-800", medium: "bg-amber-100 text-amber-900", low: "bg-slate-100 text-slate-700" } as const;

export function briefingToText(b: Briefing) {
  const lines = [b.headline, ""];
  if (b.themes.length) lines.push("What visitors are saying", ...b.themes.map(t => `- ${t.place}: ${t.theme} (${t.tone}, ${t.mentions} comments) - ${t.detail}`), "");
  if (b.priorities.length) lines.push("Review priorities", ...b.priorities.map((p, i) => `${i + 1}. [${p.level}] ${p.place}: ${p.reason} (${p.evidence})`), "");
  if (b.actions.length) lines.push("Suggested actions (proposals for officer review)", ...b.actions.map(a => `- ${a.action} - ${a.owner}, ${a.effort} effort, ${a.kind}`));
  return lines.join("\n").trim();
}

function Section({ emoji, title, hint, children }: { emoji: string; title: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="flex items-center gap-2 text-base font-semibold"><span aria-hidden className="text-xl leading-none">{emoji}</span>{title}</h3>
      {hint ? <p className="mt-0.5 text-xs text-muted">{hint}</p> : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function BriefingView({ b }: { b: Briefing }) {
  const [done, setDone] = useState<number[]>([]);
  const toggle = (i: number) => setDone(d => (d.includes(i) ? d.filter(x => x !== i) : [...d, i]));
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4">
        <p className="flex items-start gap-3 text-base font-semibold leading-7 sm:text-lg"><span aria-hidden className="text-2xl leading-8">🧭</span><span className="min-w-0">{b.headline}</span></p>
      </div>
      {b.themes.length ? (
        <Section emoji="💬" title="What visitors are saying" hint="Themes read from visitor comments, grouped by place.">
          <ul className="grid gap-3 md:grid-cols-2">
            {b.themes.map((t, i) => {
              const tone = TONE[t.tone];
              return (
                <li key={i} className={cn("rounded-xl border p-4", tone.card)}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold", tone.chip)}><span aria-hidden>{tone.emoji}</span>{tone.label}</span>
                    {t.mentions ? <span className="text-xs tabular-nums text-muted">{t.mentions} comment{t.mentions === 1 ? "" : "s"}</span> : null}
                  </div>
                  <p className="mt-2 text-xs font-medium text-muted">{t.place}</p>
                  <p className="mt-0.5 font-semibold leading-6">{t.theme}</p>
                  <p className="mt-1 text-sm leading-6">{t.detail}</p>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}
      {b.priorities.length ? (
        <Section emoji="⚠️" title="Review priorities" hint="Most important first.">
          <ol className="space-y-3">
            {b.priorities.map((p, i) => (
              <li key={i} className="flex gap-3 rounded-xl border border-line bg-white p-4">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cool text-sm font-semibold tabular-nums" aria-hidden>{i + 1}</span>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2"><p className="font-semibold">{p.place}</p><span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide", LEVEL[p.level])}>{p.level}</span></div>
                  <p className="mt-1 text-sm leading-6">{p.reason}</p>
                  {p.evidence ? <p className="mt-1 text-xs leading-5 text-muted">Evidence: {p.evidence}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </Section>
      ) : null}
      {b.actions.length ? (
        <Section emoji="✅" title="Suggested actions" hint="Proposals for officer review. Tick them off as you go.">
          <ul className="space-y-2.5">
            {b.actions.map((a, i) => {
              const checked = done.includes(i);
              return (
                <li key={i}>
                  <label className={cn("flex min-h-11 cursor-pointer gap-3 rounded-xl border p-3.5 transition-colors", checked ? "border-emerald-200 bg-emerald-50/60" : "border-line bg-white hover:bg-page")}>
                    <input type="checkbox" checked={checked} onChange={() => toggle(i)} className="mt-1 size-5 shrink-0" />
                    <span className="min-w-0">
                      <span className={cn("block text-sm font-medium leading-6", checked && "text-muted line-through")}>{a.action}</span>
                      <span className="mt-1.5 flex flex-wrap gap-1.5 text-[11px]">
                        <span className="rounded-full bg-cool px-2 py-0.5">👤 {a.owner}</span>
                        <span className="rounded-full bg-cool px-2 py-0.5">⏱ {a.effort} effort</span>
                        <span className="rounded-full bg-cool px-2 py-0.5">{a.kind === "site check" ? "📍" : a.kind === "visitor reply" ? "💬" : "🔁"} {a.kind}</span>
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </Section>
      ) : null}
    </div>
  );
}

function CopyButton({ text, label = "Copy", className }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  async function copy() {
    try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* clipboard may be blocked */ }
  }
  return <button type="button" onClick={copy} aria-live="polite" className={cn("inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-line bg-white px-4 text-sm font-medium", className)}>{copied ? <Check size={15} aria-hidden /> : <Copy size={15} aria-hidden />}{copied ? "Copied" : label}</button>;
}

function Skeleton() {
  return (
    <div className="space-y-3" role="status" aria-live="polite" aria-label="Preparing briefing">
      <div className="h-16 animate-pulse rounded-xl border border-blue-200 bg-blue-50/70" />
      <div className="grid gap-3 md:grid-cols-2">{[0, 1].map(i => <div key={i} className="animate-pulse rounded-xl border border-line bg-white p-4"><div className="h-4 w-24 rounded bg-cool" /><div className="mt-3 h-3 w-full rounded bg-cool" /><div className="mt-2 h-3 w-4/5 rounded bg-cool" /></div>)}</div>
      {[0, 1].map(i => <div key={i} className="animate-pulse rounded-xl border border-line bg-white p-4"><div className="h-4 w-40 rounded bg-cool" /><div className="mt-3 h-3 w-5/6 rounded bg-cool" /></div>)}
      <p className="text-center text-xs text-muted">Reading the comments… this can take up to half a minute when the AI service is busy.</p>
    </div>
  );
}

const CACHE_KEY = "daet-ai-briefing-v1";
type Cached = { briefing: Briefing; stamp: string };
function readCache(): Cached | null {
  try { const v = JSON.parse(localStorage.getItem(CACHE_KEY) || "null"); return v && v.briefing && typeof v.stamp === "string" ? v : null; } catch { return null; }
}
function writeCache(value: Cached) { try { localStorage.setItem(CACHE_KEY, JSON.stringify(value)); } catch { /* storage may be blocked */ } }

async function post(payload: object) {
  const response = await fetch("/api/desk/insights", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "AI summary unavailable.");
  return body;
}

function ReportBox({ disabled }: { disabled: boolean }) {
  const [lang, setLang] = useState<"en" | "fil">("en");
  const [report, setReport] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function write() {
    setBusy(true); setError(""); setReport("");
    try { setReport((await post({ mode: "report", lang })).report); }
    catch (e) { setError(e instanceof Error ? e.message : "Could not write the report."); }
    finally { setBusy(false); }
  }
  return (
    <div className="rounded-xl border border-line bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0"><h3 className="flex items-center gap-2 text-base font-semibold"><FileText size={18} aria-hidden />Draft report</h3><p className="mt-0.5 text-xs text-muted">A short memo you can edit and send. Review before sharing.</p></div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <div role="group" aria-label="Report language" className="inline-flex flex-1 overflow-hidden rounded-full border border-line sm:flex-none">
            {([["en", "English"], ["fil", "Filipino"]] as const).map(([id, label]) => <button key={id} type="button" aria-pressed={lang === id} onClick={() => setLang(id)} className={cn("min-h-11 flex-1 px-4 text-sm font-medium sm:flex-none", lang === id ? "bg-ink text-white" : "bg-white")}>{label}</button>)}
          </div>
          <button type="button" disabled={busy || disabled} onClick={write} className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-full bg-action px-5 text-sm font-semibold text-white disabled:opacity-50 sm:flex-none">{busy ? <RefreshCw size={15} className="animate-spin" aria-hidden /> : <FileText size={15} aria-hidden />}{busy ? "Writing…" : report ? "Rewrite" : "Write report"}</button>
        </div>
      </div>
      {error ? <p role="alert" className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">{error}</p> : null}
      {report ? <div className="mt-4"><pre className="max-h-[28rem] overflow-auto whitespace-pre-wrap break-words rounded-xl bg-page p-4 font-sans text-sm leading-6">{report}</pre><div className="mt-3 flex justify-end"><CopyButton text={report} label="Copy report" /></div></div> : null}
    </div>
  );
}

export function AiBriefing({ data, status, fingerprint, resetSignal }: { data: Insights; status: string; fingerprint: string; resetSignal: number }) {
  const [briefing, setBriefing] = useState<Briefing | null>(null);
  const [runId, setRunId] = useState(0);
  const [stamp, setStamp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  // Reuse the last briefing after a reload so revisiting the page costs no AI quota.
  useEffect(() => { const c = readCache(); if (c) { setBriefing(c.briefing); setStamp(c.stamp); } }, []);
  useEffect(() => { setError(""); }, [resetSignal]);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(n => n - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);
  const blocked = status !== "connected" || !data.loaded;
  const stale = Boolean(briefing) && stamp !== fingerprint;
  async function generate() {
    setBusy(true); setError("");
    try {
      const next: Briefing = (await post({ mode: "briefing" })).briefing;
      setBriefing(next); setStamp(fingerprint); setRunId(n => n + 1); writeCache({ briefing: next, stamp: fingerprint });
    } catch (e) {
      // Keep any earlier briefing on screen; pause the button so repeated clicks do not burn more quota.
      setError(e instanceof Error ? e.message : "AI summary unavailable."); setCooldown(20);
    } finally { setBusy(false); }
  }
  return (
    <section className="desk-briefing overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-white p-5 sm:p-6" aria-labelledby="ai-briefing-title">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-blue-700"><Sparkles size={14} aria-hidden />AI-assisted briefing</p>
          <h2 id="ai-briefing-title" className="mt-1 text-xl font-semibold">What are visitors saying, and what should we do?</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Explains the items above using the written comments, then suggests next steps. Comments are sent without names, photos or contact details (automatic redaction, best effort).</p>
        </div>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          {briefing ? <CopyButton text={briefingToText(briefing)} /> : null}
          <button type="button" disabled={busy || blocked || cooldown > 0 || (Boolean(briefing) && !stale)} onClick={generate} className="primary-link !min-h-11 flex-1 !gap-2 !rounded-full !px-5 !py-2.5 disabled:opacity-50 sm:flex-none">{busy ? <RefreshCw size={15} className="animate-spin" aria-hidden /> : <Sparkles size={15} aria-hidden />}{busy ? "Preparing…" : cooldown > 0 ? `Wait ${cooldown}s` : briefing ? (stale ? "Regenerate" : "Up to date") : "Generate AI briefing"}</button>
        </div>
      </header>
      {blocked && !busy ? <p className="mt-3 text-xs text-muted">{data.loaded ? "Waiting for a live connection — refresh the data to enable the briefing." : "No feedback loaded yet — collect or refresh data first."}</p> : null}
      <div className="mt-5">
        <div className="min-w-0 space-y-4">
          {error && !busy ? (
            <div role="alert" className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
              <p className="flex items-center gap-2 font-semibold text-amber-900"><AlertTriangle size={16} aria-hidden />Couldn’t prepare a new briefing</p>
              <p className="mt-2 leading-6 text-amber-900">{error}</p>
              <p className="mt-2 text-xs text-amber-900/80">{briefing ? "Your previous briefing is shown below." : "The data notes remain available."} The button unlocks in a few seconds.</p>
            </div>
          ) : null}
          {busy ? <Skeleton /> : briefing ? (
            <>
              <p className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold", stale ? "bg-amber-100 text-amber-900" : "bg-white text-muted shadow-sm")}>{stale ? "Data changed since this briefing — regenerate when ready" : "AI-generated draft · Officer review required"}</p>
              <BriefingView key={runId} b={briefing} />
              <ReportBox key={`report-${runId}`} disabled={blocked} />
            </>
          ) : !error ? (
            <div className="grid min-h-48 place-items-center rounded-xl border border-dashed border-blue-200 bg-white/70 p-6 text-center">
              <div><p className="text-3xl" aria-hidden>🧭</p><p className="mt-2 font-semibold">Ready when you are</p><p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-muted">Generate a briefing to see what visitors are saying, what to review first, and a checklist of suggested actions.</p></div>
            </div>
          ) : null}
          <details className="desk-summary-details rounded-xl border border-line bg-white px-4" open={Boolean(error) && !briefing}>
            <summary>Data notes and limits</summary>
            <ul className="mb-3 list-disc space-y-2 pl-5 text-sm leading-6">{data.lines.map(line => <li key={line}>{line}</li>)}</ul>
            <p className="mb-3 text-xs leading-5 text-muted">These are sampled submissions, not unique visitors or a representative tourism survey. Agree/disagree reactions describe responses to comments; they do not prove spam or explain the reason for a rating. Summaries cover the latest 500 entries. AI text is a draft that can misread local expressions or sarcasm — check it against the comments before making decisions.</p>
          </details>
        </div>
      </div>
    </section>
  );
}
