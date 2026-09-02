import type { Sentiment } from "./types";

export const EMOJIS = ["😞", "😐", "🙂", "🤩"] as const;

export function sentimentFromRating(rating: number): Sentiment {
  if (rating <= 2) return "negative";
  if (rating === 3) return "mixed";
  return "positive";
}

export function sentimentLabel(s: Sentiment) {
  if (s === "negative") return "Needs care";
  if (s === "mixed") return "Mixed";
  return "Thriving";
}

export function sentimentTone(s: Sentiment) {
  if (s === "negative") return "text-coral";
  if (s === "mixed") return "text-gold";
  return "text-foam";
}
