import type { Pulse } from "@/lib/pulse/types";

export type Who = { code: string; author: boolean };

/**
 * Numbers the people in one conversation by who spoke first: the story's author is #0001, the next different person #0002, and so on.
 * Entries without an author id (older or imported feedback) get no number, because we cannot tell who wrote them.
 */
export function participants(root: Pulse, replies: Pulse[]) {
  const order = new Map<string, number>();
  for (const p of [root, ...[...replies].sort((a, b) => a.createdAt - b.createdAt)]) {
    if (p.authorKey && !order.has(p.authorKey)) order.set(p.authorKey, Math.min(order.size + 1, 9999));
  }
  return (p: Pulse): Who | undefined => {
    if (!p.authorKey) return undefined;
    const n = order.get(p.authorKey);
    if (!n) return undefined;
    return { code: `#${String(n).padStart(4, "0")}`, author: !!root.authorKey && p.authorKey === root.authorKey };
  };
}
