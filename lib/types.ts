export type Sentiment = "negative" | "mixed" | "positive";

export type Spot = {
  id: string; name: string; slug: string; category: string; barangay: string | null;
  description: string; cover_url: string | null; featured: boolean; created_at: string;
};

export type SpotPulseStats = {
  positive: number; mixed: number; negative: number;
  wordPositive: number; wordMixed: number; wordNegative: number;
  consensus: number; agrees: number; disagrees: number; replies: number; discussion: number;
};

export type Feedback = {
  id: string; spot_id: string; display_name: string; rating: number; emoji: string;
  sentiment: Sentiment; comment_sentiment?: Sentiment | null; comment: string; created_at: string;
  spots?: { name: string; slug: string } | null;
};

export type AnalyticsTimelinePoint = {
  label: string; total: number; positive: number; mixed: number; negative: number;
};

export type Analytics = {
  totalReviews: number; avgRating: number; spotsCount: number;
  sentiment: Record<Sentiment, number>; wording: Record<Sentiment, number>;
  bySpot: { id: string; name: string; slug: string; count: number; avg: number; pulse: SpotPulseStats }[];
  recent: Feedback[]; timeline: AnalyticsTimelinePoint[];
  mostDiscussed: { id: string; name: string; slug: string; discussion: number; replies: number; reactions: number }[];
  emergingConcerns: { id: string; name: string; slug: string; recentNegative: number; recentTotal: number; share: number }[];
  consensus: { agree: number; disagree: number; score: number };
};
