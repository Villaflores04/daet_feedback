"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { Analytics, Sentiment } from "@/lib/types";
import { MoodDonut } from "./MoodDonut";

const labels:Record<Sentiment,string>={positive:"Positive",mixed:"Mixed",negative:"Needs care"};
const emoji:Record<Sentiment,string>={positive:"🙂",mixed:"😐",negative:"😞"};

export function HomeMood({ data }: { data: Analytics }) {
  const [selected,setSelected]=useState<Sentiment|null>(null);
  const total=data.totalReviews||1;
  const percentages={
    positive:Math.round(data.sentiment.positive/total*100),
    mixed:Math.round(data.sentiment.mixed/total*100),
    negative:Math.max(0,100-Math.round(data.sentiment.positive/total*100)-Math.round(data.sentiment.mixed/total*100))
  };
  const places=useMemo(()=>data.bySpot.filter(s=>!selected||s.pulse[selected]>0).sort((a,b)=>selected?b.pulse[selected]-a.pulse[selected]:b.count-a.count).slice(0,3),[data.bySpot,selected]);
  return <div className="home-mood-panel">
    <div className="home-mood-top"><span><i className="live-dot"/> LIVE MOOD</span><span>{data.totalReviews} pulses</span></div>
    <div className="home-mood-chart"><MoodDonut positive={data.sentiment.positive} mixed={data.sentiment.mixed} negative={data.sentiment.negative} size={250} active={selected} onSelect={setSelected}/><div className="hero-mood-overlay"><strong>{selected?percentages[selected]:percentages.positive}%</strong><span>{selected?labels[selected].toLowerCase():"positive"}</span></div></div>
    <div className="home-mood-stats">{(["positive","mixed","negative"] as Sentiment[]).map(k=><button type="button" key={k} onClick={()=>setSelected(selected===k?null:k)} className={selected===k?"mood-stat active":"mood-stat"}><b>{emoji[k]}</b><strong>{data.sentiment[k]}</strong><span>{labels[k]}</span></button>)}</div>
    <div className="hero-mood-track"><span style={{width:percentages.positive+"%"}}/><span style={{width:percentages.mixed+"%"}}/><span style={{width:percentages.negative+"%"}}/></div>
    <div className="home-mood-result"><div><small>{selected?emoji[selected]+" "+labels[selected]:"Click a mood"}</small><b>{selected?"Places with this pulse":"Explore the mood of Daet"}</b></div><div className="home-mood-places">{places.map((s,i)=><Link href={`/spots/${s.slug}`} key={s.id}><span>0{i+1}</span><b>{s.name}</b><small>{selected?s.pulse[selected]+" "+labels[selected].toLowerCase()+" pulses":s.count+" total pulses"}</small></Link>)}</div></div>
  </div>;
}
