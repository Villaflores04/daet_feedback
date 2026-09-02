import { supabasePublic } from "./supabase";
import type { Analytics, Feedback, Sentiment, Spot } from "./types";

export async function fetchSpots(): Promise<Spot[]> {
  const { data, error } = await supabasePublic().from("spots").select("*").order("featured", { ascending: false }).order("name");
  if (error) throw error;
  return data ?? [];
}

export async function fetchSpot(slug: string): Promise<Spot | null> {
  const { data, error } = await supabasePublic().from("spots").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data;
}

export async function fetchFeedback(spotId?: string): Promise<Feedback[]> {
  let q = supabasePublic().from("feedback").select("*, spots(name, slug)").order("created_at", { ascending: false }).limit(80);
  if (spotId) q = q.eq("spot_id", spotId);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []) as Feedback[];
}

export async function fetchAnalytics(): Promise<Analytics> {
  const [spots, feedback] = await Promise.all([fetchSpots(), fetchFeedback()]);
  const sentiment: Record<Sentiment, number> = { negative: 0, mixed: 0, positive: 0 };
  const grouped = new Map<string, { id: string; name: string; slug: string; sum: number; count: number }>();
  for (const s of spots) grouped.set(s.id, { id: s.id, name: s.name, slug: s.slug, sum: 0, count: 0 });
  for (const f of feedback) {
    sentiment[f.sentiment] += 1;
    const g = grouped.get(f.spot_id);
    if (g) { g.sum += f.rating; g.count += 1; }
  }
  const totalReviews = feedback.length;
  const avgRating = totalReviews === 0 ? 0 : feedback.reduce((a, b) => a + b.rating, 0) / totalReviews;
  return {
    totalReviews,
    avgRating,
    spotsCount: spots.length,
    sentiment,
    bySpot: [...grouped.values()].map((g) => ({ id: g.id, name: g.name, slug: g.slug, count: g.count, avg: g.count ? g.sum / g.count : 0 })).sort((a, b) => b.avg - a.avg || b.count - a.count),
    recent: feedback.slice(0, 8)
  };
}
