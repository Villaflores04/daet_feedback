const hits = new Map<string, number[]>();

export function tooManyPulses(key: string, max = 6, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const prev = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (prev.length >= max) {
    hits.set(key, prev);
    return true;
  }
  prev.push(now);
  hits.set(key, prev);
  return false;
}
