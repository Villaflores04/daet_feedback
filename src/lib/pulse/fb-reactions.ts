import type { Channel, Mood, Pulse } from "./types";

export type ReactionId = "like" | "love" | "care" | "haha" | "wow" | "sad" | "angry";

/**
 * Facebook's own reactions, kept as they are (they are not squeezed into the site's four faces).
 * Sentiment of a reaction: Like, Love and Care are positive; Haha and Wow can go either way, so they count as mixed;
 * Sad and Angry are negative.
 */
export const REACTIONS: { id: ReactionId; label: string; glyph: string; mood: Mood }[] = [
  { id: "like", label: "Like", glyph: "👍", mood: "POS" },
  { id: "love", label: "Love", glyph: "❤️", mood: "POS" },
  { id: "care", label: "Care", glyph: "🥰", mood: "POS" },
  { id: "haha", label: "Haha", glyph: "😆", mood: "MIX" },
  { id: "wow", label: "Wow", glyph: "😮", mood: "MIX" },
  { id: "sad", label: "Sad", glyph: "😢", mood: "NEG" },
  { id: "angry", label: "Angry", glyph: "😡", mood: "NEG" },
];

export type ReactionTally = { counts: Record<ReactionId, number>; total: number; pos: number; mix: number; neg: number; items: number };

export function emptyReactionTally(): ReactionTally {
  return { counts: { like: 0, love: 0, care: 0, haha: 0, wow: 0, sad: 0, angry: 0 }, total: 0, pos: 0, mix: 0, neg: 0, items: 0 };
}

/** Adds up the Facebook reactions on imported posts and comments. Entries without reaction counts are skipped. */
export function tallyReactions(pulses: Pulse[]): ReactionTally {
  const t = emptyReactionTally();
  for (const p of pulses) {
    const r = p.ext?.reactions;
    if (!r) continue;
    let any = 0;
    for (const def of REACTIONS) {
      const n = r[def.id] || 0;
      if (!n) continue;
      t.counts[def.id] += n;
      t.total += n;
      any += n;
      if (def.mood === "POS") t.pos += n; else if (def.mood === "MIX") t.mix += n; else t.neg += n;
    }
    if (any) t.items += 1;
  }
  return t;
}

export function reactionsByPlace(pulses: Pulse[], channels: Channel[]) {
  return channels
    .map((c) => ({ channel: c, ...tallyReactions(pulses.filter((p) => p.channelId === c.id)) }))
    .filter((x) => x.total > 0)
    .sort((a, b) => b.pos / b.total - a.pos / a.total || b.total - a.total);
}
