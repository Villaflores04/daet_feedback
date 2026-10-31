import type { buildInsights } from "./insights";

type Insights = ReturnType<typeof buildInsights>;

export type AttentionItem = {
  id: string;
  level: "high" | "medium" | "low" | "good";
  title: string;
  detail: string;
  place?: string;
  href?: string;
};
export type Attention = {
  status: { level: "empty" | "act" | "watch" | "ok"; text: string };
  items: AttentionItem[];
};

const ORDER = { high: 0, medium: 1, low: 2, good: 3 } as const;
const pct = (n: number, total: number) => (total ? Math.round((n / total) * 100) : 0);

/**
 * Decides what needs attention using plain rules on the counts, so the result is instant, free, and always matches
 * the numbers. The AI only phrases and expands on these; it never decides what is urgent.
 */
export function buildAttention(d: Insights): Attention {
  if (!d.originalCount) {
    return { status: { level: "empty", text: "No ratings yet. Share the feedback link to start collecting visitor opinions." }, items: [] };
  }
  const items: AttentionItem[] = [];
  for (const place of d.places) {
    const { neg, total, pos } = place.faces;
    const href = `/live?place=${place.slug}`;
    if (total >= 3 && neg >= 2 && neg / total >= 0.3) {
      items.push({ id: `neg-${place.id}`, level: "high", place: place.name, href, title: `${place.name}: ${neg} of ${total} ratings are negative`, detail: "Read the latest comments and confirm on site before responding." });
    } else if (total >= 2 && neg >= 1 && neg / total >= 0.2) {
      items.push({ id: `neg-${place.id}`, level: "medium", place: place.name, href, title: `${place.name}: ${neg} negative of ${total} ratings`, detail: "Worth a look. Check the comments for what went wrong." });
    } else if (place.recentNeg >= 2) {
      items.push({ id: `recent-${place.id}`, level: "medium", place: place.name, href, title: `${place.name}: ${place.recentNeg} negative ratings this week`, detail: "A cluster in the last 7 days. See whether something changed." });
    }
    if (total >= 3 && pos / total >= 0.8) {
      items.push({ id: `good-${place.id}`, level: "good", place: place.name, href, title: `${place.name}: ${pct(pos, total)}% positive`, detail: "Visitors are happy here. Worth keeping as is." });
    }
  }
  for (const topic of d.mentions) {
    if (topic.review >= 2) {
      items.push({ id: `topic-${topic.label}`, level: "medium", title: `${topic.label} comes up in ${topic.review} mixed or negative comments`, detail: "Read the comments to see which place and what exactly. Keyword matches are not proof of cause.", href: "/live" });
    }
  }
  if (d.originalCount < 5) {
    items.push({ id: "small-sample", level: "low", title: `Small sample: ${d.originalCount} rating${d.originalCount === 1 ? "" : "s"} so far`, detail: "Treat everything here as an early sign, not a conclusion." });
  }
  items.sort((a, b) => ORDER[a.level] - ORDER[b.level]);
  const concerns = items.filter(i => i.level !== "good").slice(0, 3);
  const good = items.find(i => i.level === "good");
  const shown = good ? [...concerns, good] : concerns;
  const high = concerns.filter(i => i.level === "high");
  const medium = concerns.filter(i => i.level === "medium");
  const share = pct(d.faces.pos, d.faces.total);
  const status: Attention["status"] = high.length
    ? { level: "act", text: `${high.length === 1 ? "One item needs" : `${high.length} items need`} attention first: ${high[0].place ?? high[0].title}.` }
    : medium.length
      ? { level: "watch", text: `${share}% positive overall, with ${medium.length === 1 ? "one thing" : `${medium.length} things`} to keep an eye on.` }
      : { level: "ok", text: `Going well: ${share}% of ${d.faces.total} ratings are positive and nothing is flagged.` };
  return { status, items: shown };
}
