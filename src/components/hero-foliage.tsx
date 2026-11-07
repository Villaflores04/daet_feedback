/**
 * Procedural foliage for the landing hero. Everything is generated from a fixed seed so server and client
 * render identical markup (no hydration mismatch) and no image assets are needed. Colors are sampled from the
 * monument painting: teal-greens, leaf greens and a few warm yellow-greens.
 */
const GREENS = ["#1f4d46", "#2b6a57", "#3b7d4c", "#4f8f46", "#6aa046", "#8db04a"];

function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const f = (n: number) => Math.round(n * 10) / 10;

/** A pointed leaf drawn upward from (0,0); scaled and rotated per instance. */
const LEAF = "M0 0C13-14 15-46 0-82C-15-46-13-14 0 0Z";
const RIB = "M0-4V-66";
// Painted-style leaf: a curved midrib splits it into a sunlit half and a shaded half, with a few faint side veins.
const HALF_R = "M0 0Q-2-42 2-86C21-50 17-12 0 0Z";
const HALF_L = "M0 0Q-2-42 2-86C-13-54-17-14 0 0Z";
const MIDRIB = "M0-3Q-2-42 2-84";
const VEINS_R = "M-.5-16L10-28M-1-32L12-46M-.5-50L9-62M0-66L5-74";
const VEINS_L = "M-.5-16L-9-27M-1-32L-11-44M-.5-50L-8-60M0-66L-4-73";
// [lit base, lit tip, shade base, shade tip]
const LEAF_PAINT: [string, string, string, string][] = [
  ["#3f7d4e", "#b9d05c", "#1b4a45", "#5f9a48"],
  ["#2b6a5c", "#86b95e", "#133f40", "#3f8450"],
  ["#6a9a3c", "#dcd86c", "#3f7a3d", "#8fb34a"],
  ["#173f3c", "#4d8a55", "#0c2c2f", "#2f6a4c"], // deep back leaves for depth
];
type Leaf = { x: number; y: number; r: number; s: number; v: number; o: number };

function branchLeaves(rand: () => number, x0: number, y0: number, x1: number, y1: number, bend: number, count: number): { d: string; leaves: Leaf[] } {
  const cx = (x0 + x1) / 2 + bend;
  const cy = (y0 + y1) / 2 - bend * 0.4;
  const leaves: Leaf[] = [];
  for (let i = 0; i < count; i++) {
    const t = 0.18 + (i / (count - 1)) * 0.82;
    const x = (1 - t) * (1 - t) * x0 + 2 * (1 - t) * t * cx + t * t * x1;
    const y = (1 - t) * (1 - t) * y0 + 2 * (1 - t) * t * cy + t * t * y1;
    const dx = 2 * (1 - t) * (cx - x0) + 2 * t * (x1 - cx);
    const dy = 2 * (1 - t) * (cy - y0) + 2 * t * (y1 - cy);
    const tangent = (Math.atan2(dy, dx) * 180) / Math.PI + 90; // leaf points along the branch
    const side = i % 2 ? 1 : -1;
    const spread = 38 + rand() * 26;
    const size = (1.25 - t * 0.55) * (0.85 + rand() * 0.45);
    leaves.push({ x, y, r: tangent + side * spread, s: size, v: rand() < 0.22 ? 3 : Math.floor(rand() * 3), o: 0.94 + rand() * 0.06 });
  }
  // Terminal leaf continues the branch direction.
  leaves.push({ x: x1, y: y1, r: (Math.atan2(y1 - cy, x1 - cx) * 180) / Math.PI + 90, s: 0.7, v: 0, o: 1 });
  return { d: `M${f(x0)} ${f(y0)}Q${f(cx)} ${f(cy)} ${f(x1)} ${f(y1)}`, leaves };
}

/**
 * Overhanging branches that enter from the top corner. Used mirrored for the right side.
 * Every branch is its own stacked <svg>, so each one can sway on its own period, phase and angle with a plain CSS
 * rotation. That keeps the motion on the compositor (no SVG repaint per frame) and stops the whole cluster moving as
 * one stiff block.
 */
const STEM_MOTION = [
  { d: 3.1, delay: -0.4, a: 3.4 },
  { d: 3.7, delay: -1.9, a: 4.6 },
  { d: 2.7, delay: -1.1, a: 5.6 },
  { d: 3.4, delay: -2.6, a: 6.4 },
  { d: 4.1, delay: -0.9, a: 3.0 },
];
export function LeafCluster({ seed }: { seed: number; className?: string }) {
  const rand = rng(seed);
  const stems = [
    { x1: 560, y1: 130, bend: 70, n: 15 },
    { x1: 470, y1: 300, bend: 40, n: 13 },
    { x1: 330, y1: 430, bend: 10, n: 12 },
    { x1: 175, y1: 500, bend: -20, n: 10 },
    { x1: 610, y1: 30, bend: 40, n: 11 },
  ].map(s => branchLeaves(rand, -20 + rand() * 20, -20 + rand() * 20, s.x1 + rand() * 30, s.y1 + rand() * 30, s.bend, s.n));
  return (
    <div className="mh-cluster" aria-hidden="true">
      {stems.map((stem, i) => {
        const m = STEM_MOTION[(i + seed) % STEM_MOTION.length];
        return (
          <svg
            key={i}
            className="mh-stem"
            viewBox="0 0 640 540"
            focusable="false"
            style={{ animationDuration: `${m.d}s`, animationDelay: `${m.delay}s`, ["--a" as string]: `${m.a}deg` }}
          >
            {i === 0 && (
              <defs>
                {LEAF_PAINT.flatMap((c, v) => [
                  <linearGradient key={`l${v}`} id={`lf-${seed}-${v}l`} x1="0" x2="0" y1="1" y2="0"><stop offset="0" stopColor={c[0]} /><stop offset="1" stopColor={c[1]} /></linearGradient>,
                  <linearGradient key={`d${v}`} id={`lf-${seed}-${v}d`} x1="0" x2="0" y1="1" y2="0"><stop offset="0" stopColor={c[2]} /><stop offset="1" stopColor={c[3]} /></linearGradient>,
                ])}
              </defs>
            )}
            <path d={stem.d} fill="none" stroke="#25412f" strokeWidth={5 - i * 0.4} strokeLinecap="round" />
            {stem.leaves.map((l, j) => (
              <g key={j} transform={`translate(${f(l.x)} ${f(l.y)}) rotate(${f(l.r)}) scale(${f(l.s)})`} opacity={l.o}>
                <path d={HALF_R} fill={`url(#lf-${seed}-${l.v}l)`} stroke="#0f3330" strokeOpacity=".3" strokeWidth=".9" strokeLinejoin="round" />
                <path d={HALF_L} fill={`url(#lf-${seed}-${l.v}d)`} stroke="#0f3330" strokeOpacity=".3" strokeWidth=".9" strokeLinejoin="round" />
                <path d={VEINS_R} stroke="#f1f8cf" strokeOpacity=".26" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d={VEINS_L} stroke="#0c2a2a" strokeOpacity=".22" strokeWidth="1" fill="none" strokeLinecap="round" />
                <path d={MIDRIB} stroke="#eef7c8" strokeOpacity=".6" strokeWidth="1.5" fill="none" strokeLinecap="round" />
              </g>
            ))}
          </svg>
        );
      })}
    </div>
  );
}

/** A row of tapering grass blades. `slice` keeps blade proportions on any screen width. */
export function GrassRow({ seed, count, minH, maxH, palette, className, flowers = 0 }: { seed: number; count: number; minH: number; maxH: number; palette: [string, string]; className?: string; flowers?: number }) {
  const rand = rng(seed);
  const W = 1600, H = 240;
  const gid = `grass-${seed}`;
  const blades = Array.from({ length: count }, (_, i) => {
    const x = (i / (count - 1)) * (W + 80) - 40 + (rand() - 0.5) * 18;
    // Taller toward the edges so the middle of the photo stays visible.
    const edge = Math.abs(x - W / 2) / (W / 2);
    const h = (minH + (maxH - minH) * (0.25 + 0.75 * Math.min(1, edge * 1.1))) * (0.6 + rand() * 0.55);
    const bend = (rand() - 0.5) * 70;
    const w = 11 + rand() * 12;
    return { x, h, bend, w, o: 0.85 + rand() * 0.15 };
  });
  const tall = [...blades].sort((a, b) => b.h - a.h).slice(0, flowers);
  return (
    <svg className={className} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id={gid} x1="0" x2="0" y1="1" y2="0">
          <stop offset="0" stopColor={palette[0]} />
          <stop offset="1" stopColor={palette[1]} />
        </linearGradient>
      </defs>
      <rect x="0" y={H - 14} width={W} height="14" fill={palette[0]} />
      {blades.map((b, i) => (
        <path
          key={i}
          d={`M${f(b.x - b.w / 2)} ${H}Q${f(b.x + b.bend * 0.25)} ${f(H - b.h * 0.55)} ${f(b.x + b.bend)} ${f(H - b.h)}Q${f(b.x + b.bend * 0.3 + b.w * 0.45)} ${f(H - b.h * 0.5)} ${f(b.x + b.w / 2)} ${H}Z`}
          fill={`url(#${gid})`}
          opacity={b.o}
        />
      ))}
      {tall.map((b, i) => (
        <g key={`f${i}`} transform={`translate(${f(b.x + b.bend)} ${f(H - b.h - 2)})`}>
          {[0, 72, 144, 216, 288].map(a => <ellipse key={a} cx="0" cy="-5" rx="3.4" ry="5.2" transform={`rotate(${a})`} fill={i % 2 ? "#f08aa0" : "#ee6c63"} />)}
          <circle r="2.6" fill="#ffd978" />
        </g>
      ))}
    </svg>
  );
}

/** A few small leaves that drift down the scene. Positions and timings are fixed for SSR stability. */
export function DriftingLeaves() {
  const rand = rng(77);
  const leaves = Array.from({ length: 9 }, (_, i) => ({
    left: 6 + ((i * 11 + rand() * 6) % 88),
    size: 14 + rand() * 16,
    dur: 14 + rand() * 10,
    delay: -rand() * 20,
    sway: 20 + rand() * 40,
    color: GREENS[(i + 2) % GREENS.length],
    rot: rand() * 360,
  }));
  return (
    <div className="mh-drift" aria-hidden="true">
      {leaves.map((l, i) => (
        <span key={i} style={{ left: `${f(l.left)}%`, width: f(l.size), height: f(l.size * 1.7), animationDuration: `${f(l.dur)}s`, animationDelay: `${f(l.delay)}s`, ["--sway" as string]: `${f(l.sway)}px`, ["--rot" as string]: `${f(l.rot)}deg` }}>
          <svg viewBox="-20 -88 40 92" width="100%" height="100%" focusable="false"><path d={HALF_R} fill={LEAF_PAINT[i % 3][1]} /><path d={HALF_L} fill={LEAF_PAINT[i % 3][3]} /><path d={MIDRIB} stroke="#eef7c8" strokeOpacity=".6" strokeWidth="2" fill="none" /></svg>
        </span>
      ))}
    </div>
  );
}
