import Link from "next/link";
import { ArrowUpRight, MapPin, ThumbsDown, ThumbsUp } from "lucide-react";
import { FACES } from "@/lib/pulse/faces";
import { FEEDBACK_PREVIEW_POINTS } from "@/lib/rewards";

export type TrailData = {
  places: string[];
  moods: { pos: number; mix: number; neg: number; total: number };
  story?: string;
};

const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

function Palm({ x, s = 1 }: { x: number; s?: number }) {
  const fronds = [-70, -35, 0, 35, 70, -105, 105];
  return <g transform={`translate(${x} 300) scale(${s})`}>
    <path d="M0 0 Q14 -70 -4 -150" stroke="currentColor" strokeWidth="7" fill="none" strokeLinecap="round" />
    <g transform="translate(-4 -150)">
      {fronds.map(a => <path key={a} d="M0 0 Q36 -30 78 -2 Q38 -14 0 0Z" transform={`rotate(${a - 90})`} fill="currentColor" />)}
    </g>
  </g>;
}

/** Simple, generic skyline shapes (not copies of any real artwork): twin-tower church, columned hall, memorial column, palms. */
// Fixed star field (seeded, so server and client agree): [x%, y%, radius].
const STARS: [number, number, number][] = (() => {
  const out: [number, number, number][] = [];
  let a = 17;
  const r = () => { a = (a * 1103515245 + 12345) & 0x7fffffff; return a / 0x7fffffff; };
  for (let i = 0; i < 70; i++) out.push([Math.round(r() * 1000) / 10, Math.round(r() * 520) / 10, r() < 0.14 ? 1.7 : r() < 0.5 ? 1.1 : 0.75]);
  return out;
})();

export function TrailScenery() {
  return <>
    <div className="mt-sky" aria-hidden="true" />
    <div className="mt-dusk" aria-hidden="true" />
    <div className="mt-night" aria-hidden="true" />
    <svg className="mt-stars" viewBox="0 0 100 60" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      {STARS.map(([x, y, rad], i) => <ellipse key={i} cx={x} cy={y * 0.6} rx={rad * 0.12} ry={rad * 0.2} fill="#fff" opacity={rad > 1 ? 0.95 : 0.7} />)}
    </svg>
    <div className="mt-sun" aria-hidden="true" />
    <div className="mt-moon" aria-hidden="true" />
    <svg className="mt-layer mt-far" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <ellipse cx="300" cy="70" rx="120" ry="16" fill="#fff" opacity=".5" /><ellipse cx="380" cy="58" rx="80" ry="14" fill="#fff" opacity=".5" />
      <ellipse cx="1180" cy="100" rx="130" ry="15" fill="#fff" opacity=".42" />
      <path d="M0 300V232C120 202 220 216 330 206S520 172 640 202 860 216 980 192 1220 162 1340 196 1520 206 1600 192V300Z" fill="currentColor" />
      <path d="M1040 222Q1110 150 1180 222Z" fill="currentColor" />
    </svg>
    <svg className="mt-layer mt-mid" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path d="M0 300V262C200 242 360 256 520 246S900 266 1100 252 1450 246 1600 260V300Z" fill="currentColor" />
      <path d="M250 270V206H270V160L282 138 294 160V206H330V184Q350 148 370 184V206H406V160L418 138 430 160V206H450V270Z" fill="currentColor" />
      <path d="M800 270V236H832V224L940 196 1048 224V236H1080V270Z" fill="currentColor" />
    </svg>
    <svg className="mt-layer mt-near" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path d="M0 300V272C220 256 420 270 640 262S1040 274 1260 260 1500 266 1600 270V300Z" fill="currentColor" />
      <path d="M1290 275V262H1330V250H1346V150L1356 118 1366 150V250H1382V262H1422V275Z" fill="currentColor" />
      <Palm x={130} s={0.85} /><Palm x={560} s={0.7} /><Palm x={1000} s={0.9} /><Palm x={1520} s={0.8} />
    </svg>
    <div className="mt-dim" aria-hidden="true" />
    <div className="mt-warm" aria-hidden="true" />
  </>;
}

export function TrailSteps({ data }: { data: TrailData }) {
  const { places, moods, story } = data;
  return <ol className="mt-steps">
    <li className="mt-card mt-s1">
      <span className="mt-node" aria-hidden="true">1</span>
      <h3>Pick a place</h3>
      <p>Browse Daet by list or map, or choose “Overall visit” for your whole trip.</p>
      <ul className="mt-mini-places" aria-label="Some places in Daet">
        {places.slice(0, 3).map(n => <li key={n}><MapPin size={14} aria-hidden="true" />{n}</li>)}
      </ul>
      <Link href="/spots" className="mt-more">Browse places <ArrowUpRight size={15} /></Link>
    </li>
    <li className="mt-card mt-s2">
      <span className="mt-node" aria-hidden="true">2</span>
      <h3>Share how it felt</h3>
      <p>Tap an emoji. A note or photo is optional. About 10 seconds, no account.</p>
      <div className="mt-faces">
        {FACES.map(f => <Link key={f.id} href={`/feedback?feeling=${f.id}`} aria-label={`Give ${f.label.toLowerCase()} feedback`}><span aria-hidden="true">{f.glyph}</span><small>{f.label}</small></Link>)}
      </div>
      <span className="mt-points">+{FEEDBACK_PREVIEW_POINTS} demo points · preview only</span>
    </li>
    <li className="mt-card mt-s3">
      <span className="mt-node" aria-hidden="true">3</span>
      <h3>See what others said</h3>
      <p>{story ? `“${story}”` : "Read visitor stories, reply, and agree or disagree. Sentiment shows how each place feels."}</p>
      <div className="mt-bar" role="img" aria-label={moods.total ? `${pct(moods.pos, moods.total)}% positive, ${pct(moods.mix, moods.total)}% okay, ${pct(moods.neg, moods.total)}% negative` : "No ratings yet"}>
        {moods.total ? <><i style={{ width: `${pct(moods.pos, moods.total)}%`, background: "#22c55e" }} /><i style={{ width: `${pct(moods.mix, moods.total)}%`, background: "#eab308" }} /><i style={{ width: `${pct(moods.neg, moods.total)}%`, background: "#dc2626" }} /></> : <i style={{ width: "100%", background: "#dbe7ee" }} />}
      </div>
      <div className="mt-react" aria-hidden="true"><span><ThumbsUp size={14} /> Agree</span><span><ThumbsDown size={14} /> Disagree</span></div>
      <Link href="/live" className="mt-more">Read stories <ArrowUpRight size={15} /></Link>
    </li>
  </ol>;
}

export function TrailHead() {
  return <div className="mt-head">
    <div className="mt-title">
      <div><p className="mh-eyebrow"><span aria-hidden="true" /> How it works</p><h2>From a feeling to a story</h2></div>
      <div className="mt-title-night" aria-hidden="true"><p className="mh-eyebrow"><span /> How it works</p><p className="mt-night-h">From a feeling to a story</p></div>
    </div>
    <div className="mt-cta"><Link href="/feedback" className="primary-link">Share how it felt <ArrowUpRight size={18} /></Link></div>
  </div>;
}
