export type Category = "Coast" | "Heritage" | "Market" | "Resort" | "Civic" | "Park";

export type FaceId = "wow" | "happy" | "medium" | "sad";

export type Source = "visitor" | "facebook" | "google" | "tripadvisor" | "survey" | "walkin" | "qr" | "other";

export const SOURCES: { id: Source; label: string }[] = [
  { id: "visitor", label: "Site feedback" },
  { id: "facebook", label: "Facebook" },
  { id: "google", label: "Google reviews" },
  { id: "tripadvisor", label: "TripAdvisor" },
  { id: "survey", label: "Survey" },
  { id: "walkin", label: "Walk-in / office" },
  { id: "qr", label: "QR code" },
  { id: "other", label: "Other" },
];

/** Details kept for feedback collected outside the site (for example scraped from Facebook). */
export type OutsideExt = {
  kind?: "post" | "comment";
  /** Which import this entry came from (file name and time), so a whole import can be removed at once. */
  batch?: string;
  url?: string;
  /** Facebook-style reaction counts on the original post or comment. */
  reactions?: { like: number; love: number; care: number; haha: number; wow: number; sad: number; angry: number };
  /** The collector's own rule-based text label, kept for comparison. */
  text?: { label: string; score: number };
};

/** Entries from the site itself (feedback form, QR scans) are "inside"; everything staff import is "outside". */
export function isOutside(p: { source?: Source }) {
  return !!p.source && p.source !== "visitor" && p.source !== "qr";
}

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
  /** Reaction counts and collector sentiment for outside feedback. */
  ext?: OutsideExt;
  /** Anonymous, stable per-device id (a one-way hash). Used only to tell who is who inside one conversation. */
  authorKey?: string;
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
