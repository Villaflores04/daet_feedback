"use client";

import { useMemo, useState } from "react";
import type { Feedback } from "@/lib/types";
import { FeedbackForm } from "./FeedbackForm";

export function SpotPulse({
  spotId,
  spotName,
  initial
}: {
  spotId: string;
  spotName: string;
  initial: Feedback[];
}) {
  const [reviews, setReviews] = useState(initial);
  const avg = useMemo(
    () => (reviews.length === 0 ? 0 : reviews.reduce((a, b) => a + b.rating, 0) / reviews.length),
    [reviews]
  );

  return (
    <div>
      <FeedbackForm
        spotId={spotId}
        spotName={spotName}
        onPosted={(row) => setReviews((cur) => [row, ...cur.filter((x) => x.id !== row.id)])}
      />
      <div className="mt-3 flex items-end justify-between px-0.5">
        <p className="text-[11px] text-ink-soft">{reviews.length} pulses on this place</p>
        <p className="text-right text-[11px] text-ink-soft">
          <span className="font-display block text-lg leading-none text-ink">{avg ? avg.toFixed(1) : "—"}</span>
          optional avg
        </p>
      </div>
      <div className="mt-2 space-y-1.5">
        {reviews.length === 0 && <p className="text-[13px] text-ink-soft">No pulses yet. Be the first visitor to share how this place felt.</p>}
        {reviews.map((f) => (
          <article key={f.id} className="card px-3 py-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-medium">{f.display_name}</p>
              <span>{f.emoji}</span>
            </div>
            <p className="mt-0.5 text-[13px] text-ink-soft">{f.comment}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
