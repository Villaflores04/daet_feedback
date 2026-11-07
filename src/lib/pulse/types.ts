export type Category = "Coast" | "Heritage" | "Market" | "Resort" | "Civic" | "Park";

export type FaceId = "wow" | "happy" | "medium" | "sad";

export type Source = "visitor" | "facebook" | "google" | "tripadvisor" | "survey" | "walkin" | "other";

export const SOURCES: { id: Source; label: string }[] = [
  { id: "visitor", label: "Site feedback" },
  { id: "facebook", label: "Facebook" },
  { id: "google", label: "Google reviews" },
  { id: "tripadvisor", label: "TripAdvisor" },
  { id: "survey", label: "Survey" },
  { id: "walkin", label: "Walk-in / office" },
  { id: "other", label: "Other" },
];

export type Mood = "POS" | "MIX" | "NEG";

export type Channel = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  featured: boolean;
  cover: string;
  blurb: string;
  about: string;
};

export type Pulse = {
  id: string;
  channelId: string;
  parentId: string | null;
  callsign: string;
  face: FaceId;
  body: string;
  photo?: string;
  /** Where the entry came from. Missing means collected on the site. */
  source?: Source;
  createdAt: number;
  reacts: { up: number; down: number };
};

export type WishStatus = "open" | "kept" | "burned";

export type Wish = {
  id: string;
  name: string;
  where: string;
  why: string;
  category: Category;
  callsign: string;
  photo?: string;
  status: WishStatus;
  channelId?: string;
  createdAt: number;
};

export type MoodTally = {
  pos: number;
  mix: number;
  neg: number;
  total: number;
};

export const CATEGORIES: Category[] = [
  "Coast",
  "Heritage",
  "Market",
  "Resort",
  "Civic",
  "Park",
];
