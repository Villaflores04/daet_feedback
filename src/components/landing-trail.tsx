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

/** Palm with a tapered, leaning trunk and drooping feathery fronds. */
export function Palm({ x, s = 1, lean = 1 }: { x: number; s?: number; lean?: number }) {
  const fronds: [number, number][] = [[-165, 1], [-135, 1.1], [-105, 1.15], [-75, 1.15], [-45, 1.1], [-15, 1], [-195, .8], [15, .8], [-90, .7]];
  return <g transform={`translate(${x} 300) scale(${s * lean} ${s})`}>
    <path d="M-5 0 C-2 -60 6 -110 16 -158 L24 -158 C16 -108 10 -58 7 0Z" fill="currentColor" />
    <g transform="translate(20 -158)">
      {fronds.map(([a, k], i) => <path key={i} d="M0 0 C22 -30 58 -34 96 -8 C60 -22 26 -18 0 0Z" transform={`rotate(${a}) scale(${k})`} fill="currentColor" />)}
      <circle cx="-3" cy="6" r="4.5" fill="currentColor" /><circle cx="5" cy="8" r="4" fill="currentColor" />
    </g>
  </g>;
}

/** Round-crowned shade tree (generic mango/acacia silhouette). */
export function Tree({ x, y, s = 1 }: { x: number; y: number; s?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`}>
    <path d="M-3 0 L-2 -34 L2 -34 L3 0Z" fill="currentColor" />
    <circle cx="0" cy="-46" r="19" fill="currentColor" /><circle cx="-16" cy="-38" r="14" fill="currentColor" /><circle cx="16" cy="-39" r="15" fill="currentColor" /><circle cx="3" cy="-60" r="13" fill="currentColor" />
  </g>;
}

/** Soft cumulus built from overlapping puffs on a flat base. */
function Cloud({ x, y, s = 1, o = 1 }: { x: number; y: number; s?: number; o?: number }) {
  return <g transform={`translate(${x} ${y}) scale(${s})`} opacity={o}>
    <g fill="url(#mtg-cloud)">
      <ellipse cx="0" cy="0" rx="90" ry="14" /><circle cx="-34" cy="-10" r="22" /><circle cx="2" cy="-22" r="30" /><circle cx="40" cy="-12" r="22" /><circle cx="68" cy="-3" r="14" />
    </g>
    <ellipse cx="-4" cy="-30" rx="16" ry="8" fill="#fff" opacity=".55" />
  </g>;
}

// Fixed star field (seeded, so server and client agree): [x%, y%, radius].
export const STARS: [number, number, number][] = (() => {
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
    <svg className="mt-clouds" viewBox="0 0 1600 400" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      <defs><linearGradient id="mtg-cloud" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset=".7" stopColor="#f3f7fb" /><stop offset="1" stopColor="#d6e4f0" /></linearGradient></defs>
      <Cloud x={760} y={120} s={1} o={.95} /><Cloud x={1180} y={215} s={1.2} o={.9} /><Cloud x={1480} y={120} s={.75} o={.8} /><Cloud x={540} y={270} s={.85} o={.8} />
    </svg>
    <svg className="mt-birds" viewBox="0 0 1600 400" preserveAspectRatio="xMidYMin slice" aria-hidden="true" focusable="false">
      <g fill="none" stroke="#35566b" strokeWidth="2.4" strokeLinecap="round">
        <path d="M930 70q9-9 18 0q9-9 18 0" /><path d="M978 48q7-7 14 0q7-7 14 0" /><path d="M904 100q6-6 12 0q6-6 12 0" /><path d="M1330 60q8-8 16 0q8-8 16 0" /><path d="M1370 86q6-6 12 0q6-6 12 0" />
      </g>
    </svg>
    <svg className="mt-layer mt-far" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs><linearGradient id="mtg-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".55" /><stop offset="1" stopColor="currentColor" stopOpacity=".95" /></linearGradient></defs>
      <path d="M0 300V168C90 150 150 110 230 132S360 100 430 128 560 70 650 118 790 96 860 124C930 78 990 40 1052 30 1112 42 1176 92 1232 130 1330 110 1420 136 1500 120S1560 132 1600 128V300Z" fill="url(#mtg-far)" />
      <path d="M0 300V222C110 196 210 170 320 196S500 168 610 200 790 176 890 206 1060 160 1170 196 1380 176 1600 208V300Z" fill="currentColor" opacity=".92" />
    </svg>
    <svg className="mt-layer mt-mid" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path d="M0 300V258C200 236 360 252 520 242S900 262 1100 246 1450 240 1600 256V300Z" fill="currentColor" />
      <g fill="currentColor">
        <Tree x={90} y={252} s={1.1} /><Tree x={150} y={250} s={.85} /><Tree x={540} y={244} s={1.05} /><Tree x={600} y={246} s={.8} />
        <Tree x={1120} y={248} s={1.1} /><Tree x={1180} y={250} s={.8} /><Tree x={1500} y={246} s={1} />
      </g>
      <path fill="currentColor" fillRule="evenodd" d="M250 270V210H266V164L280 132 294 164V210H326V190Q348 150 370 190V210H402V164L416 132 430 164V210H446V270ZM330 270V232Q348 214 366 232V270ZM268 196v14h8V196ZM284 196v14h8V196ZM424 196v14h-8V196Z" />
      <path fill="currentColor" fillRule="evenodd" d="M790 270V238H822V226L940 192 1058 226V238H1090V270ZM830 270V246H840V270ZM856 270V246H866V270ZM882 270V246H892V270ZM908 270V246H918V270ZM934 270V246H944V270ZM960 270V246H970V270ZM986 270V246H996V270ZM1012 270V246H1022V270ZM1038 270V246H1048V270ZM920 214h40v8h-40Z" />
    </svg>
    <svg className="mt-layer mt-near" viewBox="0 0 1600 300" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <path d="M0 300V270C220 252 420 268 640 260S1040 272 1260 258 1500 264 1600 268V300Z" fill="currentColor" />
      <path d="M1290 275V262H1330V250H1346V150L1356 112 1366 150V250H1382V262H1422V275Z" fill="currentColor" />
      <Palm x={110} s={.9} /><Palm x={380} s={.62} lean={-1} /><Palm x={760} s={.74} /><Palm x={1010} s={.95} lean={-1} /><Palm x={1530} s={.82} />
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
