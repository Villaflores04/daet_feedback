import type { Mood, Pulse } from "./types";

const POS = [
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

function hits(body: string, words: string[]) {
  let n = 0;
  for (const word of words) {
    if (body.includes(word)) n += 1;
  }
  return n;
}

export function scanBody(body: string): Mood | null {
  const text = body.trim().toLowerCase();
  if (!text) return null;
  const pos = hits(text, POS);
  const neg = hits(text, NEG);
  const mix = hits(text, MIX);
  if (pos === 0 && neg === 0 && mix === 0) return null;
  if (pos > 0 && neg > 0) return "MIX";
  if (pos > neg && pos >= mix) return "POS";
  if (neg > pos && neg >= mix) return "NEG";
  return "MIX";
}

export function scanPulses(pulses: Pulse[]): ScannedNote[] {
  const notes: ScannedNote[] = [];
  for (const pulse of pulses) {
    if (pulse.parentId) continue;
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
