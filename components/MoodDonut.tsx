"use client";

import type { Sentiment } from "@/lib/types";

export function MoodDonut({ positive, mixed, negative }: { positive: number; mixed: number; negative: number }) {
  const total = positive + mixed + negative || 1;
  const r = 70;
  const c = 2 * Math.PI * r;
  const segs: { key: Sentiment; value: number; color: string }[] = [
    { key: "positive", value: positive, color: "var(--tide)" },
    { key: "mixed", value: mixed, color: "var(--gold)" },
    { key: "negative", value: negative, color: "var(--coral)" }
  ];
  let offset = 0;
  return (
    <svg viewBox="0 0 180 180" className="h-44 w-44">
      <circle cx="90" cy="90" r={r} fill="none" stroke="var(--line)" strokeWidth="22" />
      {segs.map((s) => {
        const dash = (s.value / total) * c;
        const circle = (
          <circle key={s.key} cx="90" cy="90" r={r} fill="none" stroke={s.color} strokeWidth="22"
            strokeDasharray={`${dash} ${c - dash}`} strokeDashoffset={-offset} transform="rotate(-90 90 90)" className="donut-seg" />
        );
        offset += dash;
        return circle;
      })}
      <text x="90" y="86" textAnchor="middle" fontSize="22" fontFamily="Fraunces, Georgia, serif" fill="var(--ink)">{positive + mixed + negative}</text>
      <text x="90" y="106" textAnchor="middle" fontSize="11" fill="var(--ink-soft)">pulses</text>
    </svg>
  );
}
