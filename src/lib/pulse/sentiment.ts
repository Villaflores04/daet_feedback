import { FACES, moodOf, tallyFaces } from "./faces";
import { TOPICS } from "./insights";
import { OVERALL_ID } from "./scope";
import { scanPulses } from "./words";
import type { Channel, Mood, Pulse } from "./types";

export type Range = 7 | 30 | 90 | 0;
export const DAY = 86400000;
export const MIN_RATINGS = 3;

export type PlaceRank = { id: string; name: string; slug: string; total: number; pos: number; mix: number; neg: number; posShare: number };

/** Everything the Sentiment tab charts, computed once from the loaded entries. Dates use the viewer's local days. */
export function buildSentiment(all: Pulse[], channels: Channel[], scope: "places" | "trip", range: Range, now = Date.now()) {
  const since = range ? now - range * DAY : 0;
  const inScope = all.filter(p => (scope === "trip" ? p.channelId === OVERALL_ID : p.channelId !== OVERALL_ID) && p.createdAt >= since);
  const originals = inScope.filter(p => !p.parentId);
  const faces = tallyFaces(originals);
  const names = new Map(channels.map(c => [c.id, c]));

  const places: PlaceRank[] = channels.filter(c => (scope === "trip" ? c.id === OVERALL_ID : c.id !== OVERALL_ID)).map(c => {
    const t = tallyFaces(originals.filter(p => p.channelId === c.id));
    return { id: c.id, name: c.name, slug: c.slug, total: t.total, pos: t.pos, mix: t.mix, neg: t.neg, posShare: t.total ? t.pos / t.total : 0 };
  });
  const ranked = places.filter(p => p.total >= MIN_RATINGS).sort((a, b) => b.posShare - a.posShare || b.total - a.total);
  const unranked = places.filter(p => p.total < MIN_RATINGS);

  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const days = range || 30;
  const trend = Array.from({ length: days }, (_, i) => {
    const from = start.getTime() - (days - 1 - i) * DAY;
    const rows = originals.filter(p => p.createdAt >= from && p.createdAt < from + DAY);
    const t = tallyFaces(rows);
    return { date: new Date(from).toISOString().slice(0, 10), label: new Date(from).toLocaleDateString("en", { month: "short", day: "numeric" }), pos: t.pos, mix: t.mix, neg: t.neg, total: t.total };
  });

  const scanned = scanPulses(inScope);
  const topics = TOPICS.map(topic => {
    const hits = scanned.filter(n => topic.pattern.test(n.pulse.body));
    return { label: topic.label, pos: hits.filter(n => n.mood === "POS").length, mix: hits.filter(n => n.mood === "MIX").length, neg: hits.filter(n => n.mood === "NEG").length, total: hits.length };
  }).filter(t => t.total > 0).sort((a, b) => b.total - a.total);

  const heat = places.map(p => ({ id: p.id, name: p.name, counts: FACES.map(f => originals.filter(r => r.channelId === p.id && r.face === f.id).length), total: p.total }));
  const heatMax = Math.max(1, ...heat.flatMap(h => h.counts));

  const matrixPlaces = places.filter(p => scanned.some(n => n.pulse.channelId === p.id && (n.mood === "NEG" || n.mood === "MIX")));
  const matrix = topics.map(t => {
    const topic = TOPICS.find(x => x.label === t.label)!;
    return { label: t.label, cells: matrixPlaces.map(p => scanned.filter(n => n.pulse.channelId === p.id && (n.mood === "NEG" || n.mood === "MIX") && topic.pattern.test(n.pulse.body)).length) };
  }).filter(r => r.cells.some(Boolean));

  const weekday = Array.from({ length: 7 }, (_, d) => {
    const rows = originals.filter(p => new Date(p.createdAt).getDay() === d);
    const t = tallyFaces(rows);
    return { day: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][d], total: t.total, neg: t.neg, pos: t.pos };
  });

  const mismatch = scanned.filter(n => !n.pulse.parentId).flatMap(n => {
    const emoji: Mood = moodOf(n.pulse.face);
    const clash = (emoji === "POS" && n.mood === "NEG") || (emoji === "NEG" && n.mood === "POS");
    return clash ? [{ id: n.pulse.id, place: names.get(n.pulse.channelId)?.name ?? "Unknown place", glyph: FACES.find(f => f.id === n.pulse.face)?.glyph ?? "", emojiMood: emoji, textMood: n.mood, body: n.pulse.body }] : [];
  }).slice(0, 6);

  // Agree / disagree reactions. Totals cover every entry in scope (replies too); lists and mood splits use original ratings.
  const sum = (rows: Pulse[]) => rows.reduce((n, p) => ({ up: n.up + p.reacts.up, down: n.down + p.reacts.down }), { up: 0, down: 0 });
  const rt = sum(inScope);
  const byMood = (["POS", "MIX", "NEG"] as Mood[]).map(m => {
    const rows = originals.filter(p => moodOf(p.face) === m);
    return { mood: m, stories: rows.length, ...sum(rows) };
  });
  const reactions = {
    up: rt.up, down: rt.down, total: rt.up + rt.down,
    agreeShare: rt.up + rt.down ? rt.up / (rt.up + rt.down) : 0,
    byMood,
    byPlace: places.map(p => ({ id: p.id, name: p.name, ...sum(originals.filter(r => r.channelId === p.id)) })).filter(p => p.up + p.down > 0).sort((a, b) => b.up + b.down - (a.up + a.down)).slice(0, 5),
    top: originals.filter(p => p.reacts.up + p.reacts.down > 0).sort((a, b) => b.reacts.up + b.reacts.down - (a.reacts.up + a.reacts.down) || b.createdAt - a.createdAt).slice(0, 5)
      .map(p => ({ id: p.id, place: names.get(p.channelId)?.name ?? "Unknown place", glyph: FACES.find(f => f.id === p.face)?.glyph ?? "", mood: moodOf(p.face), body: p.body, up: p.reacts.up, down: p.reacts.down })),
  };

  return { inScope, originals, faces, reactions, places, ranked, unranked, trend, topics, heat, heatMax, matrixPlaces, matrix, weekday, mismatch, days };
}
export type SentimentData = ReturnType<typeof buildSentiment>;

export function csvOf(rows: Pulse[], channels: Channel[]) {
  const names = new Map(channels.map(c => [c.id, c.name]));
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""').replace(/^[=+\-@]/, "'$&")}"`;
  const lines = [["date", "place", "type", "emoji", "mood", "comment", "agree", "disagree"].join(",")];
  for (const p of rows) lines.push([new Date(p.createdAt).toISOString(), names.get(p.channelId) ?? "", p.parentId ? "reply" : "rating", p.face, moodOf(p.face), p.body, p.reacts.up, p.reacts.down].map(esc).join(","));
  return lines.join("\n");
}
