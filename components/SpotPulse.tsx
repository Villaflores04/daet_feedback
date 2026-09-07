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
    <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
      <div>
        <div className="flex gap-6">
          <div>
            <p className="text-xs text-sand/45">Average</p>
            <p className="font-display text-4xl">{avg ? avg.toFixed(2) : "—"}</p>
          </div>
          <div>
            <p className="text-xs text-sand/45">Pulses</p>
            <p className="font-display text-4xl">{reviews.length}</p>
          </div>
        </div>
        <div className="mt-10 space-y-3">
          {reviews.length === 0 && <p className="text-sand/50">No pulses yet. Be the first on the right.</p>}
          {reviews.map((f) => (
            <article key={f.id} className="glass rounded-2xl p-5">
              <div className="flex items-center justify-between">
                <p className="text-gold">{f.display_name}</p>
                <span>{f.emoji}</span>
              </div>
              <p className="mt-2 text-sand/80">{f.comment}</p>
              <p className="mt-2 text-xs text-sand/40">
                {f.rating}/5 · {f.created_at ? new Date(f.created_at).toLocaleString() : "just now"}
              </p>
            </article>
          ))}
        </div>
      </div>
      <FeedbackForm
        spotId={spotId}
        spotName={spotName}
        onPosted={(row) => setReviews((cur) => [row, ...cur.filter((x) => x.id !== row.id)])}
      />
    </div>
  );
}
