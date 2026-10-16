export type Reaction = "up" | "down" | null;
export function reactionCounts(counts: { up: number; down: number }, previous: Reaction, next: Reaction) {
  const result = { ...counts };
  if (previous === next) return result;
  if (previous) result[previous] = Math.max(0, result[previous] - 1);
  if (next) result[next] += 1;
  return result;
}
