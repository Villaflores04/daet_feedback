import type { Sentiment } from "./types";

export const EMOJIS = ["😞", "😐", "🙂", "🤩"] as const;
export type PulseEmoji = (typeof EMOJIS)[number];

export const EMOJI_META: Record<PulseEmoji, { sentiment: Sentiment; rating: number; label: string; fil: string }> = {
  "😞": { sentiment: "negative", rating: 2, label: "Negative", fil: "Hindi maganda" },
  "😐": { sentiment: "mixed", rating: 3, label: "Mixed", fil: "Okay lang" },
  "🙂": { sentiment: "positive", rating: 4, label: "Positive", fil: "Maganda" },
  "🤩": { sentiment: "positive", rating: 5, label: "Very positive", fil: "Natuwa" }
};

export function sentimentFromEmoji(emoji: string): Sentiment {
  if (emoji === "😞") return "negative";
  if (emoji === "😐") return "mixed";
  return "positive";
}

export function ratingFromEmoji(emoji: string): number {
  return EMOJI_META[emoji as PulseEmoji]?.rating ?? 3;
}

export function sentimentFromRating(rating: number): Sentiment {
  if (rating <= 2) return "negative";
  if (rating === 3) return "mixed";
  return "positive";
}

export function sentimentLabel(s: Sentiment) {
  if (s === "negative") return "Needs care";
  if (s === "mixed") return "Okay lang";
  return "Thriving";
}

export function sentimentTone(s: Sentiment) {
  if (s === "negative") return "text-coral";
  if (s === "mixed") return "text-gold";
  return "text-foam";
}
