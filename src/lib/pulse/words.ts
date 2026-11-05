import type { Mood, Pulse } from "./types";

const POS = [
  "nice", "pleasant", "enjoyable", "good", "excellent", "enjoy", "enjoyed", "helpful", "recommend", "recommended", "comfortable", "affordable", "accommodating", "ganda", "magagandang", "mabait", "maayos", "presko", "panalo", "napakaganda", "nakakarelax",
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

// Common complaint words and phrases that were missing, so "good but so much garbage" is no longer read as purely positive.
const NEG_MORE = [
  "garbage", "waste", "wastes", "littered", "littering", "stink", "stinks", "stinky", "stinking", "reek", "reeks", "foul", "unclean", "mess", "messy", "dusty", "flooded", "flood",
  "slow", "rough", "pothole", "potholes", "pushy", "hate", "hated", "overrated", "boring", "dull", "unfriendly", "scam", "scammed", "ripoff", "rip off", "hassle",
  "problem", "problems", "problema", "issue", "issues", "complaint", "complaints", "complain", "complained", "lacking", "lack", "lacks", "overflowing", "sadly", "unfortunately",
  "needs improvement", "need improvement", "needs improving", "needs work", "could be better", "can be better", "could be improved", "should be improved", "not enough",
  "too many", "too much", "too long", "too small", "too far", "too hot", "too loud", "too dark",
  "difficult", "kalat", "makalat", "kulang", "hassle", "nakakapagod", "bulok", "maalikabok", "mabagal", "gulo", "magulo",
];

const POS_MORE = [
  "clear", "calm", "fresh", "pristine", "charming", "majestic", "vibrant", "picturesque", "pretty", "gorgeous", "awesome", "fantastic", "superb", "perfect", "impressive", "refreshing", "cozy", "spacious", "delicious", "tasty", "yummy", "welcoming", "convenient", "organized", "organised",
  "happy", "satisfied", "accessible", "instagrammable", "must visit", "must see", "worth it", "well maintained", "well maintained", "astig", "ayos", "solid", "swabe",
];

// Neutral mentions of facilities: "trash bins are available" is not a complaint about trash.
const FACILITY_NEUTRAL = ["trash bin", "trash bins", "trash can", "trash cans", "garbage bin", "garbage bins", "garbage can", "garbage cans"];

// "No parking", "walang CR": something that should be there is missing, which is a complaint.
const ABSENT = new Set(["no", "walang", "wala", "without"]);
const FILLERS = new Set(["a", "an", "any", "enough", "proper", "decent", "clean", "good", "working", "available", "public", "ng", "na", "mga", "sapat", "malinis"]);
const FACILITIES = [
  "parking", "parking space", "parking spaces", "toilet", "toilets", "restroom", "restrooms", "rest room", "rest rooms", "comfort room", "comfort rooms", "cr", "water", "drinking water", "signage", "sign", "signs",
  "sign board", "light", "lights", "street lights", "shade", "shades", "seats", "bench", "benches", "tables", "wifi", "signal", "guard", "guards", "security", "lifeguard", "lifeguards",
  "trash bin", "trash bins", "trash can", "trash cans", "garbage bin", "garbage bins", "bins", "bin", "ramp", "ramps", "shower", "showers", "changing room", "changing rooms", "shop", "shops", "store", "stores",
  "tindahan", "tubig", "ilaw", "upuan", "paradahan",
].map(f => f.split(" "));

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
];

export type ScannedNote = {
  pulse: Pulse;
  mood: Mood;
};

const negators = new Set(["not", "no", "never", "hardly", "without", "hindi", "di", "walang", "wala", "dili"]);
const boundaries = new Set(["but", "however", "although", "pero", "kaso", "yet", "and", "at"]);
const entries = [...[...POS, ...POS_MORE].map(word => ({ word, score: 1 })), ...[...NEG, ...NEG_MORE].map(word => ({ word, score: -1 })), ...[...MIX, ...FACILITY_NEUTRAL].map(word => ({ word, score: 0 }))]
  .map(entry => ({ ...entry, tokens: entry.word.replace(/-/g, " ").split(" ") }))
  .sort((a, b) => b.tokens.length - a.tokens.length);

export function scanBody(body: string): Mood | null {
  const text = body.trim().toLowerCase().replace(/[’']/g, "'").replace(/\b(can't|cannot|won't|\w+n't)\b/g, "not").replace(/-/g, " ");
  if (!text) return null;
  const tokens = text.match(/[\p{L}\p{N}]+|[.!?,;:]/gu) ?? [];
  let pos = 0, neg = 0, mix = 0;
  for (let i = 0; i < tokens.length; i++) {
    if (ABSENT.has(tokens[i])) {
      let start = i + 1;
      while (start < tokens.length && start < i + 4 && FILLERS.has(tokens[start])) start++;
      const facility = FACILITIES.find(f => f.every((token, offset) => tokens[start + offset] === token));
      if (facility) { neg++; i = start + facility.length - 1; continue; }
    }
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
  // Neutral cues and the number of repeated cues must not override polarity.
  // Any positive and negative expressions together make the comment mixed.
  if (pos > 0) return "POS";
  if (neg > 0) return "NEG";
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
