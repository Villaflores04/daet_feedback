export type Sentiment = "negative" | "mixed" | "positive";

export type Spot = {
  id: string;
  name: string;
  slug: string;
  category: string;
  barangay: string | null;
  description: string;
  cover_url: string | null;
  featured: boolean;
  created_at: string;
};

export type Feedback = {
  id: string;
  spot_id: string;
  display_name: string;
  rating: number;
  emoji: string;
  sentiment: Sentiment;
  comment: string;
  created_at: string;
  spots?: { name: string; slug: string } | null;
};

export type Analytics = {
  totalReviews: number;
  avgRating: number;
  spotsCount: number;
  sentiment: Record<Sentiment, number>;
  bySpot: { id: string; name: string; slug: string; count: number; avg: number }[];
  recent: Feedback[];
};
