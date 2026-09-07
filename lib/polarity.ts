import type { Sentiment } from "./types";

const POSITIVE = [
  "good", "great", "love", "clean", "safe", "beautiful", "recommend", "amazing", "nice", "peaceful",
  "ganda", "maganda", "malinis", "masaya", "solid", "worth it", "enjoy", "friendly", "ok dito"
];

const NEGATIVE = [
  "dirty", "unsafe", "scam", "trash", "garbage", "crowded", "smell", "worst", "poor", "broken",
  "basura", "madumi", "pangit", "delikado", "maingay", "mahal", "scammer", "nakaw", "flood", "baha"
];

function hits(text: string, words: string[]) {
  const t = ` ${text.toLowerCase()} `;
  return words.reduce((n, w) => n + (t.includes(w) ? 1 : 0), 0);
}

export function polarityFromComment(comment: string): Sentiment {
  const pos = hits(comment, POSITIVE);
  const neg = hits(comment, NEGATIVE);
  if (pos === 0 && neg === 0) return "mixed";
  if (pos > neg) return "positive";
  if (neg > pos) return "negative";
  return "mixed";
}
