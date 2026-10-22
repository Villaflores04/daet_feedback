import type { ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

/** Dependency-free SVG/HTML charts for the officer desk. Colors match the --color-pos/mix/neg tokens. */
export const MOOD_COLORS = { pos: "#22c55e", mix: "#eab308", neg: "#dc2626", brand: "#2563eb", track: "#edf5fa" } as const;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function shortDate(iso: string) {
  const [, m, d] = iso.split("-");
  return `${MONTHS[Number(m) - 1] ?? m} ${Number(d)}`;
}
const pct = (value: number, total: number) => (total > 0 ? Math.round((value / total) * 100) : 0);

export function ChartCard({ title, hint, children, className, action }: { title: string; hint?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={cn("desk-card rounded-2xl bg-white p-5 shadow-plate", className)}>
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">{title}</h2>
          {hint ? <p className="mt-1 text-xs leading-5 text-muted">{hint}</p> : null}
        </div>
        {action}
      </header>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function EmptyChart({ children = "No data yet." }: { children?: ReactNode }) {
  return <p className="grid min-h-28 place-items-center rounded-xl border border-dashed border-line bg-page px-4 text-center text-sm text-muted">{children}</p>;
}

export type Segment = { label: string; value: number; color: string };

export function Legend({ segments, total }: { segments: Segment[]; total: number }) {
  return (
    <ul className="grid w-full min-w-0 gap-2 text-sm">
      {segments.map(s => (
        <li key={s.label} className="flex items-center gap-2">
          <span className="size-3 shrink-0 rounded-full" style={{ background: s.color }} aria-hidden />
          <span className="min-w-0 flex-1 truncate text-muted">{s.label}</span>
          <span className="tabular-nums font-semibold">{s.value}</span>
          <span className="w-10 text-right text-xs tabular-nums text-muted">{pct(s.value, total)}%</span>
        </li>
      ))}
    </ul>
  );
}

export function DonutChart({ segments, centerValue, centerLabel, ariaLabel, empty = "No data yet." }: { segments: Segment[]; centerValue: ReactNode; centerLabel: string; ariaLabel: string; empty?: string }) {
  const total = segments.reduce((n, s) => n + s.value, 0);
  const r = 40;
  const C = 2 * Math.PI * r;
  const visible = segments.filter(s => s.value > 0);
  const gap = visible.length > 1 ? 2.5 : 0;
  let offset = 0;
  return (
    <div className="flex flex-col items-center gap-5 sm:flex-row sm:gap-6 xl:flex-col xl:items-stretch 2xl:flex-row 2xl:items-center">
      <div className="relative mx-auto aspect-square w-full max-w-[168px] shrink-0">
        <svg viewBox="0 0 100 100" role="img" aria-label={ariaLabel} className="size-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke={MOOD_COLORS.track} strokeWidth="13" />
          {total > 0 && visible.map(s => {
            const len = (s.value / total) * C;
            const node = (
              <circle key={s.label} cx="50" cy="50" r={r} fill="none" stroke={s.color} strokeWidth="13" strokeDasharray={`${Math.max(len - gap, 0.01)} ${C}`} strokeDashoffset={-offset}>
                <title>{`${s.label}: ${s.value} (${pct(s.value, total)}%)`}</title>
              </circle>
            );
            offset += len;
            return node;
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
          <div>
            <p className="font-display text-3xl font-semibold leading-none tabular-nums">{total > 0 ? centerValue : "–"}</p>
            <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">{centerLabel}</p>
          </div>
        </div>
      </div>
      {total > 0 ? <Legend segments={segments} total={total} /> : <p className="text-sm text-muted">{empty}</p>}
    </div>
  );
}

export function Sparkline({ values, color = MOOD_COLORS.brand, className }: { values: number[]; color?: string; className?: string }) {
  const max = Math.max(1, ...values);
  const W = 100, H = 32, pad = 3;
  const pts = values.map((v, i) => [pad + (i * (W - pad * 2)) / Math.max(1, values.length - 1), H - pad - (v / max) * (H - pad * 2)] as const);
  const line = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className={cn("h-8 w-full", className)} aria-hidden>
      <path d={`${line} L${last[0]},${H} L${pts[0][0]},${H} Z`} fill={color} opacity="0.12" />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2.4" fill={color} />
    </svg>
  );
}

export function TrendChart({ data }: { data: { date: string; count: number }[] }) {
  const W = 600, H = 240, L = 34, R = 16, T = 26, B = 34;
  const peak = Math.max(0, ...data.map(d => d.count));
  const yMax = Math.max(4, Math.ceil(peak / 2) * 2);
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, data.length - 1);
  const y = (v: number) => T + (1 - v / yMax) * (H - T - B);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(d.count).toFixed(1)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - B} L${x(0)},${H - B} Z`;
  const ticks = [0, yMax / 2, yMax];
  const sum = data.reduce((n, d) => n + d.count, 0);
  const best = data.reduce((a, d) => (d.count > a.count ? d : a), data[0]);
  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Daily original feedback for the last 7 days: ${data.map(d => `${shortDate(d.date)} ${d.count}`).join(", ")}`} className="h-auto w-full">
        <defs>
          <linearGradient id="desk-trend-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor={MOOD_COLORS.brand} stopOpacity="0.28" />
            <stop offset="100%" stopColor={MOOD_COLORS.brand} stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map(t => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#dce7ed" strokeDasharray={t === 0 ? undefined : "4 5"} />
            <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#526b79" className="tabular-nums">{t}</text>
          </g>
        ))}
        {sum > 0 && <path d={area} fill="url(#desk-trend-fill)" />}
        <path d={line} fill="none" stroke={MOOD_COLORS.brand} strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
        {data.map((d, i) => (
          <g key={d.date}>
            <circle cx={x(i)} cy={y(d.count)} r={i === data.length - 1 ? 6 : 4.5} fill="#fff" stroke={MOOD_COLORS.brand} strokeWidth="2.5">
              <title>{`${shortDate(d.date)}: ${d.count} original ratings`}</title>
            </circle>
            {d.count > 0 && <text x={x(i)} y={y(d.count) - 11} textAnchor="middle" fontSize="12" fontWeight="600" fill="#123449" className="tabular-nums">{d.count}</text>}
            <text x={x(i)} y={H - 10} textAnchor="middle" fontSize="11" fill="#526b79">{shortDate(d.date)}</text>
          </g>
        ))}
      </svg>
      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
        <span><b className="tabular-nums text-ink">{sum}</b> in 7 days</span>
        <span>Avg <b className="tabular-nums text-ink">{(sum / Math.max(1, data.length)).toFixed(1)}</b>/day</span>
        {sum > 0 && <span>Busiest <b className="text-ink">{shortDate(best.date)}</b> ({best.count})</span>}
      </p>
    </div>
  );
}

export function HBarChart({ rows, unit = "" }: { rows: { label: string; value: number; sub?: string; color?: string }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map(r => r.value));
  return (
    <ul className="space-y-4">
      {rows.map(r => (
        <li key={r.label}>
          <div className="flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate font-medium">{r.label}</span>
            <span className="shrink-0 tabular-nums text-muted"><b className="text-ink">{r.value}</b>{unit}</span>
          </div>
          <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-cool">
            <span className="chart-hbar block h-full rounded-full" style={{ width: `${(r.value / max) * 100}%`, background: r.color ?? MOOD_COLORS.brand }} />
          </div>
          {r.sub ? <p className="mt-1 text-xs text-muted">{r.sub}</p> : null}
        </li>
      ))}
    </ul>
  );
}

export function FaceBars({ items }: { items: { id: string; glyph: string; label: string; count: number; color: string }[] }) {
  const max = Math.max(1, ...items.map(i => i.count));
  const total = items.reduce((n, i) => n + i.count, 0);
  return (
    <div role="img" aria-label={`Emoji ratings: ${items.map(i => `${i.label} ${i.count}`).join(", ")}`}>
      <div className="grid grid-cols-4 items-end gap-3 sm:gap-4">
        {items.map(i => (
          <div key={i.id} className="flex flex-col items-center">
            <span className="mb-1 text-sm font-semibold tabular-nums">{i.count}</span>
            <div className="flex h-32 w-full items-end rounded-xl bg-cool/70 px-1.5 pt-1.5 sm:px-2">
              <span className="chart-bar block w-full rounded-t-lg" title={`${i.label}: ${i.count} (${pct(i.count, total)}%)`} style={{ height: `${(i.count / max) * 100}%`, minHeight: i.count ? 6 : 0, background: i.color }} />
            </div>
            <span className="mt-2 text-2xl leading-none" aria-hidden>{i.glyph}</span>
            <span className="mt-1 text-[11px] text-muted">{i.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export type PlaceRow = { id: string; name: string; slug: string; pos: number; mix: number; neg: number; total: number; notes: number };

export function PlaceBars({ rows }: { rows: PlaceRow[] }) {
  const max = Math.max(1, ...rows.map(r => r.total));
  return (
    <div>
      <ul className="divide-y divide-line">
        {rows.map(r => (
          <li key={r.id}>
            <Link href={`/desk/board?open=${encodeURIComponent(r.slug)}&tab=words`} className="group block py-3">
              <div className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate font-medium text-blue-700 group-hover:underline">{r.name} →</span>
                <span className="shrink-0 text-xs tabular-nums text-muted">{r.total} ratings</span>
              </div>
              <div className="mt-2 h-3 rounded-full bg-cool" aria-hidden>
                <div className="flex h-full overflow-hidden rounded-full" style={{ width: `${Math.max(r.total ? 4 : 0, (r.total / max) * 100)}%` }}>
                  {r.pos > 0 && <span className="h-full" style={{ width: `${pct(r.pos, r.total)}%`, background: MOOD_COLORS.pos }} />}
                  {r.mix > 0 && <span className="h-full" style={{ width: `${pct(r.mix, r.total)}%`, background: MOOD_COLORS.mix }} />}
                  {r.neg > 0 && <span className="h-full" style={{ width: `${pct(r.neg, r.total)}%`, background: MOOD_COLORS.neg }} />}
                </div>
              </div>
              <p className="mt-1.5 text-xs text-muted">{r.pos} positive · {r.mix} okay · <span className={r.neg ? "font-semibold text-neg" : undefined}>{r.neg} negative</span> · {r.notes} mixed/neutral notes</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted" aria-hidden>
        {([["Positive", MOOD_COLORS.pos], ["Okay", MOOD_COLORS.mix], ["Negative", MOOD_COLORS.neg]] as const).map(([l, c]) => <span key={l} className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-full" style={{ background: c }} />{l}</span>)}
      </p>
    </div>
  );
}
