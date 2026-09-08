"use client";
import type { Sentiment } from "@/lib/types";

export function MoodDonut({ positive, mixed, negative, size=160, className="", showCenter=false, active=null, onSelect }: {
  positive:number; mixed:number; negative:number; size?:number; className?:string; showCenter?:boolean; active?:Sentiment|null; onSelect?:(sentiment:Sentiment)=>void;
}) {
  const total=positive+mixed+negative||1; const r=46; const c=2*Math.PI*r; const gap=2.8;
  const segs:{key:Sentiment;value:number;color:string}[]=[
    {key:"positive",value:positive,color:"var(--teal)"},
    {key:"mixed",value:mixed,color:"var(--gold)"},
    {key:"negative",value:negative,color:"var(--coral)"}
  ];
  let offset=0; const totalPulses=positive+mixed+negative;
  return <div className={`mood-donut ${className}`} style={{width:size,height:size}}>
    <svg viewBox="0 0 120 120" role="img" aria-label={`${totalPulses} pulses: ${positive} positive, ${mixed} mixed, ${negative} needs care`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(220,215,204,.8)" strokeWidth="12"/>
      {segs.map(s=>{
        const fraction=s.value/total; const dash=Math.max(0,fraction*c-gap); const currentOffset=offset; offset += fraction*c;
        const isActive=!active||active===s.key; const select=()=>onSelect?.(s.key);
        return <circle key={s.key} className={`mood-donut-seg ${isActive?"":"dim"}`} cx="60" cy="60" r={r} fill="none" stroke={s.color} strokeWidth={active===s.key?15:12} strokeLinecap="round" strokeDasharray={`${dash} ${c-dash}`} strokeDashoffset={-currentOffset} pathLength={c} transform="rotate(-90 60 60)" tabIndex={onSelect?0:undefined} role={onSelect?"button":undefined} aria-label={onSelect?`Show ${s.key} places`:undefined} onClick={onSelect?select:undefined} onKeyDown={e=>{if(onSelect&&(e.key==="Enter"||e.key===" ")){e.preventDefault();select();}}}/>;
      })}
    </svg>
    {showCenter && <div className="mood-donut-center"><strong>{totalPulses}</strong><span>pulses</span></div>}
  </div>;
}
