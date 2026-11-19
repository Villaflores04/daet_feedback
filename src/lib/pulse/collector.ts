import type { FaceId, OutsideExt } from "./types";

/** Column names written by the FB Feedback Collector. */
export const COLLECTOR_COLUMNS = ["type", "post_id", "post_url", "time_text", "author", "comment", "reactions", "like", "love", "care", "haha", "wow", "sad", "angry", "sentiment", "score", "scraped_at"];

export type Reactions = NonNullable<OutsideExt["reactions"]>;

/** True when the first CSV row looks like the collector's export. */
export function isCollectorCsv(header: string[]) {
  const h = header.map((x) => x.trim().toLowerCase());
  return ["type", "post_url", "comment", "scraped_at"].every((c) => h.includes(c));
}

const num = (v: string | undefined) => {
  const n = parseInt(String(v ?? "").replace(/[^\d]/g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : 0;
};

/** Reads the seven reaction counts from one collector row. */
export function reactionsOf(row: string[], header: string[]): Reactions {
  const h = header.map((x) => x.trim().toLowerCase());
  const get = (name: string) => num(row[h.indexOf(name)]);
  return { like: get("like"), love: get("love"), care: get("care"), haha: get("haha"), wow: get("wow"), sad: get("sad"), angry: get("angry") };
}

/**
 * The emoji side of outside feedback. Facebook reactions fold onto the four faces:
 * Love and Wow count as Wow, Like and Care as Happy, Haha as Okay, Sad and Angry as Sad.
 * The face with the most reactions wins. No reactions (or a tie) returns null so the text decides.
 */
export function faceFromReactions(r: Reactions): FaceId | null {
  const score: Record<FaceId, number> = { wow: r.love + r.wow, happy: r.like + r.care, medium: r.haha, sad: r.sad + r.angry };
  const ranked = (Object.entries(score) as [FaceId, number][]).sort((a, b) => b[1] - a[1]);
  if (!ranked[0][1] || ranked[0][1] === ranked[1][1]) return null;
  return ranked[0][0];
}

/** Keeps only safe, numeric / short string values from an untrusted ext object. */
export function cleanExt(raw: unknown): OutsideExt | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const e = raw as Record<string, unknown>;
  const out: OutsideExt = {};
  if (e.kind === "post" || e.kind === "comment") out.kind = e.kind;
  if (typeof e.url === "string" && /^https?:\/\//.test(e.url)) out.url = e.url.slice(0, 500);
  if (e.reactions && typeof e.reactions === "object") {
    const r = e.reactions as Record<string, unknown>;
    const n = (k: string) => Math.min(10_000_000, Math.max(0, Math.round(Number(r[k]) || 0)));
    out.reactions = { like: n("like"), love: n("love"), care: n("care"), haha: n("haha"), wow: n("wow"), sad: n("sad"), angry: n("angry") };
  }
  if (e.text && typeof e.text === "object") {
    const t = e.text as Record<string, unknown>;
    if (typeof t.label === "string") out.text = { label: t.label.slice(0, 20), score: Math.round(Number(t.score) || 0) };
  }
  return Object.keys(out).length ? out : undefined;
}
