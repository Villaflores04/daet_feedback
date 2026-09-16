import type { FaceId, Mood, MoodTally, Pulse } from "./types";

export type { FaceId, Mood, MoodTally };

export const FACES = [
  { id: "wow" as const, glyph: "🤩", label: "Wow", mood: "POS" as const },
  { id: "happy" as const, glyph: "😊", label: "Happy", mood: "POS" as const },
  { id: "medium" as const, glyph: "😐", label: "Medium", mood: "MIX" as const },
  { id: "sad" as const, glyph: "😢", label: "Sad", mood: "NEG" as const },
];

export const FACE_COPY = "What did the place feel like? / Ano'ng naramdaman mo?";

export function faceById(id: FaceId) {
  return FACES.find((face) => face.id === id) ?? FACES[2];
}

export function moodOf(id: FaceId): Mood {
  return faceById(id).mood;
}

export function emptyTally(): MoodTally {
  return { pos: 0, mix: 0, neg: 0, total: 0 };
}

export function tallyFaces(pulses: Pulse[]): MoodTally {
  const tally = emptyTally();
  for (const pulse of pulses) {
    if (pulse.parentId) continue;
    const mood = moodOf(pulse.face);
    if (mood === "POS") tally.pos += 1;
    else if (mood === "MIX") tally.mix += 1;
    else tally.neg += 1;
    tally.total += 1;
  }
  return tally;
}

export function majority(tally: MoodTally): Mood | null {
  if (tally.total === 0) return null;
  if (tally.pos >= tally.mix && tally.pos >= tally.neg) return "POS";
  if (tally.neg >= tally.mix && tally.neg >= tally.pos) return "NEG";
  return "MIX";
}

export function moodLabel(mood: Mood | null) {
  if (mood === "POS") return "Up";
  if (mood === "NEG") return "Down";
  if (mood === "MIX") return "Mixed";
  return "Quiet";
}
