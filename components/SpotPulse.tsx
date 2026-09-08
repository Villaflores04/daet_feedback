"use client";
import { useState } from "react";
import type { Feedback } from "@/lib/types";
import { FeedbackForm } from "./FeedbackForm";
import { CommunityFeed } from "./CommunityFeed";

export function SpotPulse({ spotId, spotName, initial }: { spotId: string; spotName: string; initial: Feedback[] }) {
  const [reviews, setReviews] = useState(initial);
  const positive = reviews.filter(r => r.sentiment === "positive").length;
  const mixed = reviews.filter(r => r.sentiment === "mixed").length;
  const negative = reviews.filter(r => r.sentiment === "negative").length;
  const total = reviews.length || 1;

  return <div>
    <FeedbackForm spotId={spotId} spotName={spotName} onPosted={row => setReviews(cur => [row, ...cur.filter(x => x.id !== row.id)])} />
    <section className="spot-pulse-strip">
      <div><span>LIVE PULSES</span><strong>{reviews.length}</strong><small>visitor voices</small></div>
      <div><span>🙂 POSITIVE</span><strong>{Math.round(positive / total * 100)}%</strong><small>{positive} pulses</small></div>
      <div><span>😐 MIXED</span><strong>{Math.round(mixed / total * 100)}%</strong><small>{mixed} pulses</small></div>
      <div className="spot-mood-mini" aria-label="Mood fingerprint">
        <span style={{ width: (positive / total * 100) + "%" }} />
        <span style={{ width: (mixed / total * 100) + "%" }} />
        <span style={{ width: (negative / total * 100) + "%" }} />
      </div>
      <div><span>😞 NEEDS CARE</span><strong>{Math.round(negative / total * 100)}%</strong><small>{negative} pulses</small></div>
    </section>
    <CommunityFeed spotId={spotId} reviews={reviews} />
  </div>;
}
