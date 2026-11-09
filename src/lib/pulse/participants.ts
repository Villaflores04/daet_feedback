import type { Pulse } from "@/lib/pulse/types";

export type Who = { code: string; author: boolean };

type Entry = { n: number; key?: string; name?: string };

/** "Visitor" (the default) is shared by everyone, so it cannot tell two people apart. */
function realName(p: Pulse) {
  const name = (p.callsign || "").trim().toLowerCase();
  return name && name !== "visitor" ? name : undefined;
}

/**
 * Numbers the people in one conversation by who spoke first: the story's author is #0001, the next different person #0002, and so on.
 * New feedback carries an anonymous device id. Older feedback has none, so there the nickname is used instead; a reply that
 * only says "Visitor" cannot be matched to anyone and gets no number.
 */
export function participants(root: Pulse, replies: Pulse[]) {
  const entries: Entry[] = [];
  const byPulse = new Map<string, Entry | null>();
  const find = (p: Pulse) => {
    const name = realName(p);
    const byKey = p.authorKey ? entries.find((e) => e.key === p.authorKey) : undefined;
    if (byKey) return byKey;
    if (!name) return undefined;
    // Same nickname counts as the same person unless both sides carry different device ids.
    return entries.find((e) => e.name === name && !(e.key && p.authorKey && e.key !== p.authorKey));
  };
  const place = (p: Pulse, force: boolean) => {
    let e = find(p);
    if (!e && (force || p.authorKey || realName(p))) {
      e = { n: Math.min(entries.length + 1, 9999) };
      entries.push(e);
    }
    if (e) { e.key ??= p.authorKey; e.name ??= realName(p); }
    byPulse.set(p.id, e ?? null);
  };
  place(root, true);
  for (const r of [...replies].sort((a, b) => a.createdAt - b.createdAt)) place(r, false);
  return (p: Pulse): Who | undefined => {
    const e = byPulse.get(p.id);
    return e ? { code: `#${String(e.n).padStart(4, "0")}`, author: e.n === 1 } : undefined;
  };
}
