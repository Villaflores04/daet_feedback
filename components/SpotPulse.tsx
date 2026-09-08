"use client";

import { useMemo, useState } from "react";
import type { Feedback } from "@/lib/types";
import { FeedbackForm } from "./FeedbackForm";
import { CommunityFeed } from "./CommunityFeed";

export function SpotPulse({ spotId, spotName, initial }: { spotId: string; spotName: string; initial: Feedback[] }) {
  const [reviews, setReviews] = useState(initial);
  const avg = useMemo(() => reviews.length === 0 ? 0 : reviews.reduce((a, b) => a + b.rating, 0) / reviews.length, [reviews]);
  const positive = reviews.filter((r) => r.sentiment === "positive").length;
  const mixed = reviews.filter((r) => r.sentiment === "mixed").length;
  const negative = reviews.filter((r) => r.sentiment === "negative").length;
  const total = reviews.length || 1;
  return <div>
    <FeedbackForm spotId={spotId} spotName={spotName} onPosted={(row) => setReviews((cur) => [row, ...cur.filter((x) => x.id !== row.id)])} />
    <section className="spot-pulse-strip">
      <div><span>LIVE PULSE</span><strong>{reviews.length}</strong><small>visitor voices</small></div>
      <div><span>MOOD</span><strong>{Math.round((positive / total) * 100)}%</strong><small>positive</small></div>
      <div><span>OPTIONAL SCORE</span><strong>{avg ? avg.toFixed(1) : "—"}</strong><small>out of 5</small></div>
      <div className="spot-mood-mini"><span style={{ width: `${(positive / total) * 100}%` }} /><span style={{ width: `${(mixed / total) * 100}%` }} /><span style={{ width: `${(negative / total) * 100}%` }} /></div>
    </section>
    <CommunityFeed spotId={spotId} reviews={reviews} />
  </div>;
}
