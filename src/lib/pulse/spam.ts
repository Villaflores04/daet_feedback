import type { Pulse } from "./types";

/** Limits for one device (or one network address when the device code is missing). */
export const SPAM = {
  /** One original rating per place per device in this window. */
  placeCooldownMs: 60 * 60 * 1000,
  /** No more than this many submissions (ratings and replies) in the burst window. */
  burstMax: 5,
  burstWindowMs: 10 * 60 * 1000,
  /** The same comment text from one device is refused inside this window. */
  duplicateWindowMs: 24 * 60 * 60 * 1000,
};

export const normalizeText = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

export type PastEntry = { id?: string; channel_id: string; parent_id: string | null; body: string | null; created_at: string };

/** Server check. Returns a message to show the visitor, or null when the submission is fine. */
export function spamVerdict(past: PastEntry[], next: { id: string; channelId: string; parentId?: string | null; body: string }, now = Date.now()): string | null {
  if (past.some((p) => p.id === next.id)) return null; // a retry of an entry that was already saved
  const age = (p: PastEntry) => now - Date.parse(p.created_at);
  const burst = past.filter((p) => age(p) < SPAM.burstWindowMs).length;
  if (burst >= SPAM.burstMax) return "You are sending feedback too quickly. Please wait a few minutes and try again.";
  const text = normalizeText(next.body);
  if (text.length >= 5 && past.some((p) => age(p) < SPAM.duplicateWindowMs && normalizeText(p.body ?? "") === text)) {
    return "You already sent this comment. Please write something new.";
  }
  if (!next.parentId) {
    const last = past.filter((p) => !p.parent_id && p.channel_id === next.channelId && age(p) < SPAM.placeCooldownMs).sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))[0];
    if (last) {
      const left = Math.max(1, Math.ceil((SPAM.placeCooldownMs - age(last)) / 60000));
      return `You already rated this place. You can rate it again in ${left} ${left === 1 ? "minute" : "minutes"}.`;
    }
  }
  return null;
}

export type SpamFlag = { reason: string; authorKey: string };

/** Desk view: marks entries that look like spam. They still count; staff decide. */
export function flagPulses(pulses: Pulse[]): Map<string, SpamFlag> {
  const flags = new Map<string, SpamFlag>();
  const byAuthor = new Map<string, Pulse[]>();
  for (const p of pulses) {
    if (!p.authorKey) continue;
    (byAuthor.get(p.authorKey) ?? byAuthor.set(p.authorKey, []).get(p.authorKey)!).push(p);
  }
  for (const [authorKey, list] of byAuthor) {
    const sorted = [...list].sort((a, b) => a.createdAt - b.createdAt);
    const mark = (p: Pulse, reason: string) => { if (!flags.has(p.id)) flags.set(p.id, { reason, authorKey }); };
    // Many in a short time.
    for (let i = 0; i < sorted.length; i++) {
      const window = sorted.filter((q) => q.createdAt >= sorted[i].createdAt && q.createdAt < sorted[i].createdAt + SPAM.burstWindowMs);
      if (window.length > SPAM.burstMax) window.forEach((q) => mark(q, `${window.length} entries from one device within 10 minutes`));
    }
    // Same text again.
    const texts = new Map<string, Pulse[]>();
    for (const p of sorted) { const t = normalizeText(p.body); if (t.length >= 5) (texts.get(t) ?? texts.set(t, []).get(t)!).push(p); }
    for (const same of texts.values()) if (same.length > 1) same.forEach((q) => mark(q, "Same comment sent more than once by one device"));
    // Several ratings for one place in a day.
    const places = new Map<string, Pulse[]>();
    for (const p of sorted) if (!p.parentId) (places.get(p.channelId) ?? places.set(p.channelId, []).get(p.channelId)!).push(p);
    for (const rows of places.values()) {
      for (let i = 0; i < rows.length; i++) {
        const day = rows.filter((q) => q.createdAt >= rows[i].createdAt && q.createdAt < rows[i].createdAt + 24 * 3600 * 1000);
        if (day.length >= 3) day.forEach((q) => mark(q, `${day.length} ratings for the same place within a day`));
      }
    }
  }
  return flags;
}
