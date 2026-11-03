import { moodOf } from "./faces";
import type { Channel, Pulse } from "./types";

export const MIN_PLACE_RATINGS = 3;
const DAY = 86400000;

export type PlaceStat = {
  total: number; pos: number; mix: number; neg: number;
  posShare: number; lastAt: number; photos: number;
  /** Enough recent ratings and a high negative share to be worth flagging. */
  concern: boolean;
};

/** One pass over the entries: rating tallies, last feedback time, photo count and a recent-concern flag per place. */
export function buildPlaceStats(channels: Channel[], pulses: Pulse[], now = Date.now()) {
  const stats = new Map<string, PlaceStat>();
  const recent = new Map<string, { n: number; neg: number }>();
  for (const c of channels) stats.set(c.id, { total: 0, pos: 0, mix: 0, neg: 0, posShare: 0, lastAt: 0, photos: 0, concern: false });
  for (const p of pulses) {
    const s = stats.get(p.channelId);
    if (!s) continue;
    s.lastAt = Math.max(s.lastAt, p.createdAt);
    if (p.photo) s.photos++;
    if (p.parentId) continue;
    const mood = moodOf(p.face);
    s.total++;
    if (mood === "POS") s.pos++; else if (mood === "MIX") s.mix++; else s.neg++;
    if (now - p.createdAt <= 30 * DAY) {
      const r = recent.get(p.channelId) ?? { n: 0, neg: 0 };
      r.n++; if (mood === "NEG") r.neg++;
      recent.set(p.channelId, r);
    }
  }
  for (const [id, s] of stats) {
    s.posShare = s.total ? s.pos / s.total : 0;
    const r = recent.get(id);
    s.concern = Boolean(r && r.n >= MIN_PLACE_RATINGS && r.neg / r.n >= 0.3);
  }
  return stats;
}

export function moodLabel(s: PlaceStat) {
  if (!s.total) return "No ratings yet";
  return s.pos > s.total / 2 ? "Mostly positive" : s.neg > s.total / 2 ? "Mostly negative" : "Mixed feelings";
}

export function ago(ts: number, now = Date.now()) {
  if (!ts) return "";
  const mins = Math.floor(Math.max(0, now - ts) / 60000);
  if (mins < 60) return mins < 1 ? "just now" : `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(ts).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}
