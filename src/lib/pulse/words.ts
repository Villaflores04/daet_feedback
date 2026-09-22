import type { Mood, Pulse } from "./types";

const POS = [
  "good", "excellent", "enjoy", "enjoyed", "helpful", "recommend", "recommended", "comfortable", "affordable", "accommodating", "ganda", "magagandang", "mabait", "maayos", "presko", "panalo", "napakaganda", "nakakarelax",
  "beautiful",
  "stunning",
  "amazing",
  "wonderful",
  "great",
  "love",
  "loved",
  "lovely",
  "scenic",
  "peaceful",
  "serene",
  "relaxing",
  "clean",
  "friendly",
  "worth",
  "glassy",
  "quiet",
  "safe",
  "fun",
  "wow",
  "breathtaking",
  "well-kept",
  "well kept",
  "maganda",
  "masaya",
  "malinis",
  "magayon",
  "nindot",
  "masarap",
  "tahimik",
  "payapa",
  "sulit",
  "linis",
  "marhay",
  "masiram",
];

const NEG = [
  "bad", "terrible", "awful", "disappointed", "disappointing", "disappoint", "worst", "rude", "expensive", "unsafe", "noisy", "uncomfortable", "horrible", "panget", "madumi", "nakakadismaya", "nakakainis", "mainit", "maingay",
  "dirty",
  "filthy",
  "trash",
  "litter",
  "scary",
  "sad",
  "poor",
  "broken",
  "ugly",
  "dangerous",
  "crowded",
  "overcrowded",
  "neglected",
  "overpriced",
  "smelly",
  "chaotic",
  "needs care",
  "marumi",
  "basura",
  "sira",
  "pangit",
  "mabaho",
  "init",
  "ingay",
  "mahal",
  "sayang",
];

const MIX = [
  "okay",
  "ok",
  "fine",
  "alright",
  "average",
  "mixed",
  "so-so",
  "soso",
  "sige",
  "pwede",
  "medyo",
  "bit crowded",
  "a bit",
];

export type ScannedNote = {
  pulse: Pulse;
  mood: Mood;
};

const negators = new Set(["not", "no", "never", "hardly", "without", "hindi", "di", "walang", "wala", "dili"]);
const boundaries = new Set(["but", "however", "although", "pero", "kaso", "yet", "and", "at"]);
const entries = [...POS.map(word => ({ word, score: 1 })), ...NEG.map(word => ({ word, score: -1 })), ...MIX.map(word => ({ word, score: 0 }))]
  .map(entry => ({ ...entry, tokens: entry.word.replace(/-/g, " ").split(" ") }))
  .sort((a, b) => b.tokens.length - a.tokens.length);

export function scanBody(body: string): Mood | null {
  const text = body.trim().toLowerCase().replace(/[’']/g, "'").replace(/\b(can't|cannot|won't|\w+n't)\b/g, "not").replace(/-/g, " ");
  if (!text) return null;
  const tokens = text.match(/[\p{L}\p{N}]+|[.!?,;:]/gu) ?? [];
  let pos = 0, neg = 0, mix = 0;
  for (let i = 0; i < tokens.length; i++) {
    const entry = entries.find(e => e.tokens.every((token, offset) => tokens[i + offset] === token));
    if (!entry) continue;
    let inverted = false;
    for (let j = i - 1; j >= Math.max(0, i - 3); j--) {
      if (/^[.!?,;:]$/.test(tokens[j]) || boundaries.has(tokens[j])) break;
      if (negators.has(tokens[j]) && tokens[j + 1] !== "only") inverted = !inverted;
    }
    const score = entry.score * (inverted ? -1 : 1);
    if (score > 0) pos++; else if (score < 0) neg++; else mix++;
    i += entry.tokens.length - 1;
  }
  if (pos === 0 && neg === 0 && mix === 0) return null;
  if (pos > 0 && neg > 0) return "MIX";
  if (pos > neg && pos >= mix) return "POS";
  if (neg > pos && neg >= mix) return "NEG";
  return "MIX";
}

export function scanPulses(pulses: Pulse[]): ScannedNote[] {
  const notes: ScannedNote[] = [];
  for (const pulse of pulses) {
    const mood = scanBody(pulse.body);
    if (!mood) continue;
    notes.push({ pulse, mood });
  }
  return notes;
}

export function tallyScans(notes: ScannedNote[]) {
  const tally = { pos: 0, mix: 0, neg: 0, total: notes.length };
  for (const note of notes) {
    if (note.mood === "POS") tally.pos += 1;
    else if (note.mood === "MIX") tally.mix += 1;
    else tally.neg += 1;
  }
  return tally;
}
