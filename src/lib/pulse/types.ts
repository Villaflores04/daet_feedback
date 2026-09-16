export type Category = "Coast" | "Heritage" | "Island" | "Civic" | "Park";

export type FaceId = "wow" | "happy" | "medium" | "sad";

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
  "Island",
  "Civic",
  "Park",
];
