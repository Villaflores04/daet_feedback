"use client";

import type { Sentiment } from "@/lib/types";

export function MoodDonut({ positive, mixed, negative, size = 160, className = "" }: { positive: number; mixed: number; negative: number; size?: number; className?: string }) {
  const total = positive + mixed + negative || 1;
  const r = 46;
  const c = 2 * Math.PI * r;
  const gap = 2.8;
  const segs: { key: Sentiment; value: number; color: string }[] = [
    { key: "positive", value: positive, color: "var(--teal)" },
    { key: "mixed", value: mixed, color: "var(--gold)" },
    { key: "negative", value: negative, color: "var(--coral)" }
  ];
  let offset = 0;
  const totalPulses = positive + mixed + negative;
  return <div className={`mood-donut ${className}`} style={{ width: size, height: size }}>
    <svg viewBox="0 0 120 120" role="img" aria-label={`${totalPulses} pulses: ${positive} positive, ${mixed} mixed, ${negative} negative`}>
      <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(220,229,225,.85)" strokeWidth="12" />
      {segs.map(s => {
        const fraction = s.value / total;
        const dash = Math.max(0, fraction * c - gap);
        const circle = <circle key={s.key} className="mood-donut-seg" cx="60" cy="60" r={r} fill="none" stroke={s.color} strokeWidth="12" strokeLinecap="round" strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset} pathLength={c} transform="rotate(-90 60 60)" />;
        offset += fraction * c;
        return circle;
      })}
    </svg>
    <div className="mood-donut-center"><strong>{totalPulses}</strong><span>pulses</span></div>
  </div>;
}
