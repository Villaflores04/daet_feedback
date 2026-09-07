"use client";

import type { Sentiment } from "@/lib/types";

export function MoodDonut({
  positive,
  mixed,
  negative
}: {
  positive: number;
  mixed: number;
  negative: number;
}) {
  const total = positive + mixed + negative || 1;
  const r = 46;
  const c = 2 * Math.PI * r;
  const segs: { key: Sentiment; value: number; color: string }[] = [
    { key: "positive", value: positive, color: "var(--tide)" },
    { key: "mixed", value: mixed, color: "var(--gold)" },
    { key: "negative", value: negative, color: "var(--coral)" }
  ];
  let offset = 0;
  return (
    <svg viewBox="0 0 120 120" className="h-[112px] w-[112px] shrink-0">
      <circle cx="60" cy="60" r={r} fill="none" stroke="var(--line)" strokeWidth="14" />
      {segs.map((s) => {
        const dash = (s.value / total) * c;
        const circle = (
          <circle
            key={s.key}
            cx="60"
            cy="60"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="14"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 60 60)"
          />
        );
        offset += dash;
        return circle;
      })}
      <text x="60" y="57" textAnchor="middle" fontSize="16" fontFamily="Fraunces, Georgia, serif" fill="var(--ink)">
        {positive + mixed + negative}
      </text>
      <text x="60" y="72" textAnchor="middle" fontSize="9" fill="var(--ink-soft)">
        pulses
      </text>
    </svg>
  );
}
