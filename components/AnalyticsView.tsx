"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { Analytics, Sentiment } from "@/lib/types";
import { MoodDonut } from "./MoodDonut";

const COLORS:Record<Sentiment,string>={positive:"var(--teal)",mixed:"var(--gold)",negative:"var(--coral)"};
const EMOJI:Record<Sentiment,string>={positive:"🙂",mixed:"😐",negative:"😞"};
const LABELS:Record<Sentiment,string>={positive:"Positive",mixed:"Mixed",negative:"Needs care"};

function SignalRows({values,total,titlePrefix=""}:{values:Record<Sentiment,number>;total:number;titlePrefix?:string}){
  return <div className="signal-list">{(["positive","mixed","negative"] as const).map(key=>{
    const pct=Math.round(values[key]/(total||1)*100);
    return <div className="signal-row" key={key}>
      <div className="signal-label"><span className="signal-emoji">{EMOJI[key]}</span><span><b>{LABELS[key]}</b><small>{titlePrefix || (key==="negative"?"What needs care":"Official pulse")}</small></span><strong>{pct}%</strong></div>
      <div className="signal-track"><span style={{width:pct+"%",background:COLORS[key]}}/></div>
      <small className="signal-count">{values[key]} responses</small>
    </div>;
  })}</div>;
}

function TrendChart({data}:{data:Analytics["timeline"]}) {
  const width=720,height=190,pad=24,max=Math.max(1,...data.map(d=>d.total));
  const points=data.map((d,i)=>{
    const x=pad+(i*Math.max(1,(width-pad*2)/(Math.max(1,data.length-1))));
    const y=height-pad-(d.total/max)*(height-pad*2);
    return x+","+y;
  }).join(" ");
  return <div className="trend-chart-wrap">
    <svg viewBox={`0 0 ${width} ${height}`} className="trend-chart" role="img" aria-label="Visitor pulse activity over the last seven days">
      <line x1={pad} y1={height-pad} x2={width-pad} y2={height-pad} className="trend-axis"/>
      <polyline points={points} fill="none" className="trend-line"/>
      {data.map((d,i)=>{const x=pad+(i*Math.max(1,(width-pad*2)/(Math.max(1,data.length-1))));const y=height-pad-(d.total/max)*(height-pad*2);return <g key={d.label}><circle cx={x} cy={y} r="4" className="trend-dot"/><text x={x} y={height-5} textAnchor="middle" className="trend-label">{d.label}</text></g>})}
    </svg>
    <div className="trend-summary">{data.map(d=><span key={d.label}>{d.total} pulse{d.total===1?"":"s"}</span>)}</div>
  </div>;
}

export function AnalyticsView({data}:{data:Analytics}) {
  const total=data.totalReviews||1;
  const positive=Math.round(data.sentiment.positive/total*100);
  const mixed=Math.round(data.sentiment.mixed/total*100);
  const negative=Math.max(0,100-positive-mixed);
  const wordTotal=data.wording.positive+data.wording.mixed+data.wording.negative;
  const [selected,setSelected]=useState<Sentiment|null>(null);
  const selectedPlaces=useMemo(()=>{
    if(!selected)return data.bySpot;
    return data.bySpot.filter(s=>s.pulse[selected]>0).sort((a,b)=>b.pulse[selected]-a.pulse[selected]);
  },[data.bySpot,selected]);

  return <div className="space-y-8">
    <section className="analytics-hero surface p-5 sm:p-8">
      <div className="analytics-core">
        <div className="analytics-live"><span className="live-dot"/> LIVE · click a mood</div>
        <MoodDonut positive={data.sentiment.positive} mixed={data.sentiment.mixed} negative={data.sentiment.negative} size={300} active={selected} onSelect={setSelected}/>
        <div className="analytics-center"><strong>{selected ? Math.round(data.sentiment[selected]/total*100)+"%" : positive+"%"}</strong><span>{selected ? LABELS[selected].toLowerCase()+" pulse" : "positive pulse"}</span><small>{data.totalReviews} official responses</small></div>
        {selected && <button className="chart-reset" onClick={()=>setSelected(null)}>Show all</button>}
      </div>
      <div className="analytics-summary">
        <div><p className="eyebrow">Official sentiment</p><h1 className="mt-2">Explore Daet by mood.</h1><p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--muted)]">Click a chart segment to filter the places below. The emoji chosen by visitors is the official pulse.</p></div>
        <SignalRows values={data.sentiment} total={total}/>
        <div className="analytics-stat-grid"><div><strong>{data.totalReviews}</strong><span>official pulses</span></div><div><strong>{data.consensus.score || "—"}{data.consensus.score?"%":""}</strong><span>community consensus</span></div></div>
      </div>
    </section>

    <section className="surface trend-card">
      <div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Living activity</p><h2 className="mt-2">Pulse activity over 7 days</h2></div><span className="trend-total">{data.timeline.reduce((a,b)=>a+b.total,0)} recent pulses</span></div>
      <TrendChart data={data.timeline}/>
    </section>

    <section className="surface filtered-places">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="eyebrow">{selected ? EMOJI[selected]+" "+LABELS[selected] : "Destination signal"}</p><h2 className="mt-2">{selected ? "Places with this pulse" : "Explore places by pulse"}</h2><p className="mt-2 text-sm text-[var(--muted)]">{selected ? "The list updates from the mood you selected above." : "Choose a mood in the chart to turn this ranking into an interactive explorer."}</p></div><Link href="/spots" className="btn-secondary">Open all places →</Link></div>
      <div className="dashboard-place-list mt-4">{selectedPlaces.map((s,i)=>{
        const p=s.pulse; const t=p.positive+p.mixed+p.negative||1; const wp=p.wordPositive+p.wordMixed+p.wordNegative||0;
        return <Link key={s.id} href={`/spots/${s.slug}`} className="dashboard-place-row">
          <span className="rank-no">{String(i+1).padStart(2,"0")}</span><span><b>{s.name}</b><small>{selected ? (p[selected]+" "+LABELS[selected].toLowerCase()+" pulses") : s.count+" total pulses"} · {p.consensus ? p.consensus+"% consensus" : "No community votes"}</small><em>{wp ? "Words: "+Math.max(p.wordPositive,p.wordMixed,p.wordNegative)+" signals" : "No word signal yet"}</em></span>
          <span className="place-fingerprint"><i style={{width:p.positive/t*100+"%"}}/><i style={{width:p.mixed/t*100+"%"}}/><i style={{width:p.negative/t*100+"%"}}/></span>
        </Link>;
      })}{selectedPlaces.length===0&&<p className="text-sm text-[var(--muted)]">No places have that mood yet.</p>}</div>
    </section>

    <section className="signal-compare">
      <div className="surface signal-card official-card"><div className="signal-card-head"><div><p className="eyebrow">Signal 01 · Official</p><h2 className="mt-2">Emoji sentiment</h2></div><span className="signal-badge">What visitors chose</span></div><p className="signal-card-copy">The primary measurement. Emoji is what defines the public mood.</p><SignalRows values={data.sentiment} total={total} titlePrefix="Visitor-selected pulse"/></div>
      <div className="surface signal-card wording-card"><div className="signal-card-head"><div><p className="eyebrow">Signal 02 · Secondary</p><h2 className="mt-2">Comment wording</h2></div><span className="signal-badge secondary">What words suggest</span></div><p className="signal-card-copy">Written comments are analyzed separately to explain the emoji signal. They never override the official pulse.</p><SignalRows values={data.wording} total={wordTotal||1} titlePrefix="Keyword / wording signal"/></div>
    </section>

    <section className="insight-grid">
      <div className="surface insight-card"><p className="eyebrow">Pulse consensus</p><h2 className="mt-2">{data.consensus.score ? data.consensus.score+"% aligned" : "No community votes yet"}</h2><p className="mt-2 text-sm text-[var(--muted)]">Agreement around visitor experiences. This is separate from the author's official emoji.</p><div className="consensus-split"><span style={{width:(data.consensus.agree/(data.consensus.agree+data.consensus.disagree||1)*100)+"%"}}/><span style={{width:(data.consensus.disagree/(data.consensus.agree+data.consensus.disagree||1)*100)+"%"}}/></div><div className="consensus-label"><span>👍 {data.consensus.agree} agree</span><span>👎 {data.consensus.disagree} disagree</span></div></div>
      <div className="surface insight-card"><p className="eyebrow">Most discussed places</p><h2 className="mt-2">Where conversation is happening</h2><div className="insight-list">{data.mostDiscussed.length ? data.mostDiscussed.map((s,i)=><Link href={`/spots/${s.slug}`} key={s.id}><span>0{i+1}</span><b>{s.name}</b><small>{s.reactions} reactions · {s.replies} replies</small></Link>) : <p className="text-sm text-[var(--muted)]">Community conversation will appear here.</p>}</div></div>
      <div className="surface insight-card"><p className="eyebrow">Emerging concerns</p><h2 className="mt-2">Places to watch</h2><div className="insight-list concern-list">{data.emergingConcerns.length ? data.emergingConcerns.map(s=><Link href={`/spots/${s.slug}`} key={s.id}><span>!</span><b>{s.name}</b><small>{s.share}% negative in the last 24h · {s.recentTotal} recent pulses</small></Link>) : <p className="text-sm text-[var(--muted)]">No emerging concern detected.</p>}</div></div>
    </section>

    <section id="voices" className="surface p-5 sm:p-7"><div className="flex items-end justify-between gap-4"><div><p className="eyebrow">Live voices</p><h2 className="mt-2">What visitors are saying</h2></div><span className="trend-total">Community context</span></div><div className="voice-grid mt-4">{data.recent.length===0&&<p className="py-5 text-sm text-[var(--muted)]">No pulses yet.</p>}{data.recent.map(f=><article key={f.id} className="dashboard-voice"><div className="dashboard-voice-top"><div><b>{f.display_name}</b><small>{f.spots?.name||"A place in Daet"}</small></div><span>{f.emoji}</span></div><p>{f.comment}</p></article>)}</div></section>
  </div>;
}
