import { unstable_noStore as noStore } from "next/cache";
import { polarityFromComment } from "./polarity";
import { supabaseAdmin, supabasePublic } from "./supabase";
import type { Analytics, AnalyticsTimelinePoint, Feedback, Sentiment, Spot, SpotPulseStats } from "./types";

type ReadOpts = { privileged?: boolean };

function reader(opts?: ReadOpts) {
  noStore();
  if (opts?.privileged && process.env.SUPABASE_SERVICE_ROLE_KEY) return supabaseAdmin();
  return supabasePublic();
}

function blankPulse(): SpotPulseStats {
  return { positive: 0, mixed: 0, negative: 0, wordPositive: 0, wordMixed: 0, wordNegative: 0, consensus: 0, agrees: 0, disagrees: 0, replies: 0, discussion: 0 };
}

function dayKey(date: Date) { return date.toISOString().slice(0, 10); }

export async function fetchSpots(opts?: ReadOpts): Promise<Spot[]> {
  const { data, error } = await reader(opts).from("spots").select("*").order("featured", { ascending: false }).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchSpot(slug: string, opts?: ReadOpts): Promise<Spot | null> {
  const { data, error } = await reader(opts).from("spots").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchFeedback(spotId?: string, opts?: ReadOpts): Promise<Feedback[]> {
  const db = reader(opts);
  let q = db.from("feedback").select("*, spots(name, slug)").order("created_at", { ascending: false }).limit(200);
  if (spotId) q = q.eq("spot_id", spotId);
  const { data, error } = await q;
  if (error) {
    let plain = db.from("feedback").select("*").order("created_at", { ascending: false }).limit(200);
    if (spotId) plain = plain.eq("spot_id", spotId);
    const second = await plain;
    if (second.error) throw second.error;
    return (second.data ?? []) as Feedback[];
  }
  return (data ?? []) as Feedback[];
}

export async function fetchAnalytics(opts?: ReadOpts): Promise<Analytics> {
  const [spots, feedback] = await Promise.all([fetchSpots(opts), fetchFeedback(undefined, opts)]);
  const sentiment: Record<Sentiment, number> = { negative: 0, mixed: 0, positive: 0 };
  const wording: Record<Sentiment, number> = { negative: 0, mixed: 0, positive: 0 };
  const grouped = new Map<string, { id: string; name: string; slug: string; sum: number; count: number; pulse: SpotPulseStats }>();
  for (const s of spots) grouped.set(s.id, { id: s.id, name: s.name, slug: s.slug, sum: 0, count: 0, pulse: blankPulse() });

  const start = new Date(); start.setUTCHours(0,0,0,0); start.setUTCDate(start.getUTCDate() - 6);
  const timelineMap = new Map<string, { total: number; positive: number; mixed: number; negative: number }>();
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setUTCDate(d.getUTCDate() + i);
    timelineMap.set(dayKey(d), { total: 0, positive: 0, mixed: 0, negative: 0 });
  }

  for (const f of feedback) {
    sentiment[f.sentiment] += 1;
    const ws = f.comment_sentiment || polarityFromComment(f.comment);
    wording[ws] += 1;
    const g = grouped.get(f.spot_id);
    if (g) {
      g.sum += f.rating; g.count += 1; g.pulse[f.sentiment] += 1;
      if (ws === "positive") g.pulse.wordPositive += 1;
      if (ws === "mixed") g.pulse.wordMixed += 1;
      if (ws === "negative") g.pulse.wordNegative += 1;
    }
    const bucket = timelineMap.get(dayKey(new Date(f.created_at)));
    if (bucket) { bucket.total += 1; bucket[f.sentiment] += 1; }
  }

  const communityByFeedback = new Map<string, { agrees: number; disagrees: number; replies: number }>();
  try {
    const db = supabaseAdmin(); const ids = feedback.map(f => f.id);
    if (ids.length) {
      const [{ data: reactions }, { data: replies }] = await Promise.all([
        db.from("feedback_reactions").select("feedback_id, reaction").in("feedback_id", ids),
        db.from("feedback_replies").select("feedback_id").in("feedback_id", ids)
      ]);
      for (const r of reactions ?? []) {
        const v = communityByFeedback.get(r.feedback_id) ?? { agrees: 0, disagrees: 0, replies: 0 };
        if (r.reaction === "agree") v.agrees += 1;
        if (r.reaction === "disagree") v.disagrees += 1;
        communityByFeedback.set(r.feedback_id, v);
      }
      for (const r of replies ?? []) {
        const v = communityByFeedback.get(r.feedback_id) ?? { agrees: 0, disagrees: 0, replies: 0 };
        v.replies += 1; communityByFeedback.set(r.feedback_id, v);
      }
    }
  } catch {}

  for (const f of feedback) {
    const g = grouped.get(f.spot_id); const c = communityByFeedback.get(f.id);
    if (g && c) { g.pulse.agrees += c.agrees; g.pulse.disagrees += c.disagrees; g.pulse.replies += c.replies; g.pulse.discussion += c.agrees + c.disagrees + c.replies; }
  }
  for (const g of grouped.values()) {
    const votes = g.pulse.agrees + g.pulse.disagrees;
    g.pulse.consensus = votes ? Math.round(Math.max(g.pulse.agrees, g.pulse.disagrees) / votes * 100) : 0;
  }

  const totalReviews = feedback.length;
  const avgRating = totalReviews ? feedback.reduce((a,b) => a + b.rating, 0) / totalReviews : 0;
  const timeline: AnalyticsTimelinePoint[] = [...timelineMap.entries()].map(([key,v]) => ({
    label: new Date(key + "T00:00:00Z").toLocaleDateString("en-PH", { weekday: "short" }),
    total: v.total, positive: v.positive, mixed: v.mixed, negative: v.negative
  }));

  const spotList = [...grouped.values()].map(g => ({
    id:g.id, name:g.name, slug:g.slug, count:g.count, avg:g.count ? g.sum/g.count : 0, pulse:g.pulse
  })).sort((a,b) => b.count-a.count || b.avg-a.avg);

  const mostDiscussed = spotList.map(s => ({
    id:s.id, name:s.name, slug:s.slug, discussion:s.count + s.pulse.discussion,
    replies:s.pulse.replies, reactions:s.pulse.agrees + s.pulse.disagrees
  })).filter(s => s.discussion > 0).sort((a,b) => b.discussion-a.discussion).slice(0,5);

  const recentWindow = new Date(Date.now() - 24*60*60*1000);
  const emergingConcerns = spotList.map(s => {
    const recent = feedback.filter(f => f.spot_id === s.id && new Date(f.created_at) >= recentWindow);
    const recentNegative = recent.filter(f => f.sentiment === "negative").length;
    return { id:s.id, name:s.name, slug:s.slug, recentNegative, recentTotal:recent.length, share:recent.length ? Math.round(recentNegative/recent.length*100) : 0 };
  }).filter(s => s.recentTotal >= 2 && s.recentNegative > 0).sort((a,b) => b.share-a.share || b.recentNegative-a.recentNegative).slice(0,3);

  let agree=0, disagree=0;
  for (const c of communityByFeedback.values()) { agree += c.agrees; disagree += c.disagrees; }
  const voteTotal = agree + disagree;
  const consensus = { agree, disagree, score: voteTotal ? Math.round(Math.max(agree,disagree)/voteTotal*100) : 0 };

  return { totalReviews, avgRating, spotsCount:spots.length, sentiment, wording, bySpot:spotList, recent:feedback.slice(0,8), timeline, mostDiscussed, emergingConcerns, consensus };
}
