import { FACES, tallyFaces } from "./faces";
import { scanPulses, tallyScans } from "./words";
import { OVERALL_ID } from "./scope";
import type { Channel, Pulse } from "./types";

const topics = [
  { label: "Cleanliness", pattern: /\b(clean|dirty|trash|garbage|litter|malinis|marumi|madumi|basura|toilet|cr)\b/i },
  { label: "Safety", pattern: /\b(safe|unsafe|dangerous|security|danger|ligtas|delikado|guard)\b/i },
  { label: "Facilities and access", pattern: /\b(facilities|parking|road|transport|toilet|restroom|accessible|amenities|daan|kalsada)\b/i },
  { label: "Service", pattern: /\b(service|staff|friendly|rude|helpful|mabait|masungit|serbisyo)\b/i },
  { label: "Prices", pattern: /\b(price|expensive|cheap|affordable|mahal|mura|fee|cost)\b/i },
  { label: "Crowding and noise", pattern: /\b(crowded|crowd|noisy|noise|maingay|siksikan|matao)\b/i },
];
export function buildInsights(pulses: Pulse[], channels: Channel[], now = Date.now()) {
  const originals = pulses.filter(p => !p.parentId);
  const scanned = scanPulses(pulses);
  const words = tallyScans(scanned);
  const mentions = topics.map(topic => {
    const matches = scanned.filter(n => topic.pattern.test(n.pulse.body));
    return { label: topic.label, mentions: matches.length, review: matches.filter(n => n.mood === "NEG" || n.mood === "MIX").length };
  }).filter(t => t.mentions > 0).sort((a, b) => b.review - a.review || b.mentions - a.mentions);
  const places = channels.filter(c => c.id !== OVERALL_ID).map(c => {
    const rows = pulses.filter(p => p.channelId === c.id);
    return { id: c.id, name: c.name, slug: c.slug, faces: tallyFaces(rows), words: tallyScans(scanPulses(rows)) };
  }).sort((a, b) => b.faces.neg - a.faces.neg || b.faces.total - a.faces.total);
  const day = 86400000;
  // UTC days ensure the browser and server summarize identical date buckets.
  const today = Math.floor(now / day) * day;
  const trend = Array.from({ length: 7 }, (_, i) => {
    const start = today - (6 - i) * day;
    return { date: new Date(start).toISOString().slice(0, 10), count: originals.filter(p => p.createdAt >= start && p.createdAt < start + day).length };
  });
  const faces = tallyFaces(originals);
  const lines = [originals.length ? `${originals.length} original ratings are available: ${faces.pos} positive, ${faces.mix} okay, and ${faces.neg} negative. Replies are excluded from these ratings.` : "No original ratings are available yet. Collect visitor feedback before drawing conclusions.",
    `${words.total} written comments and replies were classified: ${words.pos} positive, ${words.mix} mixed or neutral, and ${words.neg} negative. ${pulses.filter(p => p.body.trim()).length - words.total} notes could not be classified.`];
  const reviewTopic = mentions.find(t => t.review > 0);
  if (reviewTopic) lines.push(`${reviewTopic.label} appears in ${reviewTopic.review} mixed/negative comments or replies. Review the full comments before deciding whether this topic is the cause of dissatisfaction; a comment can discuss several topics.`);
  const priority = places.find(p => p.faces.neg > 0);
  if (priority) lines.push(`${priority.name} has ${priority.faces.neg} negative ratings out of ${priority.faces.total}. Review its comments and confirm concerns on site before planning a response.`);
  const faceCounts = FACES.map(f => ({ id: f.id, glyph: f.glyph, label: f.label, mood: f.mood, count: originals.filter(p => p.face === f.id).length }));
  return { faces, words, places, mentions, trend, lines, faceCounts, originalCount: originals.length, replyCount: pulses.length - originals.length,
    placeFaces: tallyFaces(originals.filter(p => p.channelId !== OVERALL_ID)), tripFaces: tallyFaces(originals.filter(p => p.channelId === OVERALL_ID)),
    reactions: pulses.reduce((n, p) => ({ up: n.up + p.reacts.up, down: n.down + p.reacts.down }), { up: 0, down: 0 }),
    loaded: pulses.length, cutoff: pulses.length ? Math.min(...pulses.map(p => p.createdAt)) : null };
}
