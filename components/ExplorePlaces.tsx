"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Analytics, Sentiment, Spot } from "@/lib/types";

type Filter = "all" | Sentiment;

const labels: Record<Filter, string> = { all: "All places", positive: "🙂 Positive", mixed: "😐 Mixed", negative: "😞 Needs care" };

function MoodMini({ pulse }: { pulse: Analytics["bySpot"][number]["pulse"] }) {
  const total = pulse.positive + pulse.mixed + pulse.negative || 1;
  return <div className="place-mood-block">
    <div className="place-mood-bar"><span style={{width:(pulse.positive/total*100)+"%"}}/><span style={{width:(pulse.mixed/total*100)+"%"}}/><span style={{width:(pulse.negative/total*100)+"%"}}/></div>
    <div className="place-mood-legend"><span>🙂 {pulse.positive}</span><span>😐 {pulse.mixed}</span><span>😞 {pulse.negative}</span></div>
  </div>;
}

function words(pulse: Analytics["bySpot"][number]["pulse"]) {
  if (pulse.wordPositive >= pulse.wordNegative && pulse.wordPositive >= pulse.wordMixed) return "Words lean positive";
  if (pulse.wordNegative > pulse.wordPositive && pulse.wordNegative >= pulse.wordMixed) return "Words flag concerns";
  return "Words sound mixed";
}

export function ExplorePlaces({ spots, analytics }: { spots: Spot[]; analytics: Analytics }) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");

  const list = useMemo(() => spots.map(s => {
    const stat = analytics.bySpot.find(x => x.id === s.id);
    return { spot:s, stat };
  }).filter(({spot,stat}) => {
    const pulse = stat?.pulse;
    const matchesFilter = filter === "all" || !!pulse && pulse[filter] > 0;
    const matchesSearch = !query.trim() || spot.name.toLowerCase().includes(query.trim().toLowerCase()) || (spot.category + " " + (spot.barangay || "")).toLowerCase().includes(query.trim().toLowerCase());
    return matchesFilter && matchesSearch;
  }).sort((a,b) => {
    const ap=a.stat?.pulse || {positive:0,mixed:0,negative:0}; const bp=b.stat?.pulse || {positive:0,mixed:0,negative:0};
    if (filter === "positive") return bp.positive - ap.positive;
    if (filter === "mixed") return bp.mixed - ap.mixed;
    if (filter === "negative") return bp.negative - ap.negative;
    return (b.stat?.count||0) - (a.stat?.count||0);
  }), [spots,analytics,filter,query]);

  return <div className="page-shell pb-12">
    <section className="explore-head">
      <div><p className="eyebrow">Explore Daet</p><h1 className="mt-3">Find the mood of each place.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">Every destination carries its own pulse fingerprint. Choose a mood, compare places, and open a place to hear the visitor voices behind the numbers.</p></div>
      <Link href="/dashboard" className="btn-secondary compact-cta">Open town pulse →</Link>
    </section>

    <section className="explore-controls">
      <div className="mood-filters" role="tablist" aria-label="Filter places by sentiment">
        {(["all","positive","mixed","negative"] as Filter[]).map(key => <button key={key} role="tab" aria-selected={filter===key} className={filter===key?"mood-filter active":"mood-filter"} onClick={()=>setFilter(key)}>{labels[key]}</button>)}
      </div>
      <input className="place-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search places, category, or barangay…" aria-label="Search places" />
    </section>

    <div className="place-grid">
      {list.map(({spot,stat}) => {
        const p=stat?.pulse; const total=(p?.positive||0)+(p?.mixed||0)+(p?.negative||0);
        const dominant = !total ? "Be the first pulse" : (p!.positive>=p!.mixed && p!.positive>=p!.negative) ? "🙂 Positive" : p!.mixed>=p!.negative ? "😐 Mixed" : "😞 Needs care";
        const wordTotal=(p?.wordPositive||0)+(p?.wordMixed||0)+(p?.wordNegative||0);
        return <Link key={spot.id} href={`/spots/${spot.slug}`} className="place-card">
          <div className="place-photo" style={{backgroundImage:spot.cover_url?`url(${spot.cover_url})`:undefined}}><span className="place-category">{spot.category}</span><span className="place-dominant">{dominant}</span></div>
          <div className="place-body">
            <div className="place-title-row"><div><h2>{spot.name}</h2><span>{spot.barangay || "Daet"}</span></div><strong>{total}</strong></div>
            <small className="place-pulse-count">visitor pulses</small>
            <MoodMini pulse={p || {positive:0,mixed:0,negative:0,wordPositive:0,wordMixed:0,wordNegative:0,consensus:0,agrees:0,disagrees:0,replies:0,discussion:0}} />
            <div className="place-insights"><span>{wordTotal ? words(p!) : "No wording signal yet"}</span>{p && p.agrees+p.disagrees ? <span>{p.consensus}% pulse consensus</span> : <span>Community votes appear here</span>}</div>
            <div className="place-open">Open place pulse <span>→</span></div>
          </div>
        </Link>
      })}
      {list.length===0 && <div className="place-empty"><span>🔎</span><strong>No places match that mood.</strong><small>Try another mood or clear the search.</small></div>}
    </div>
  </div>;
}
