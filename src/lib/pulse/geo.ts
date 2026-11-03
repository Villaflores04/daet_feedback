import type { Channel } from "./types";

/**
 * Approximate map positions, kept in code (not the database) so a deployment without a migration keeps working.
 * Sources: Wikipedia (First Rizal Monument, Mercedes, Daet town centre) and PhilAtlas (Bagasbas barangay).
 * Pins mark the general area. Places not listed here show in a "not on the map yet" list with a Maps link.
 */
const TOWN = { lat: 14.1142, lng: 122.9564 };
const COORDS: Record<string, { lat: number; lng: number }> = {
  "bagasbas-beach": { lat: 14.1369, lng: 122.9813 },
  "cathedral-st-john": TOWN,
  "first-rizal-monument": { lat: 14.1131, lng: 122.9545 },
  "mercedes-island-views": { lat: 14.1093, lng: 123.0109 },
  "provincial-capitol": TOWN,
};

export function coordsOf(channel: Pick<Channel, "slug">) {
  return COORDS[channel.slug] ?? null;
}

export function mapsUrl(channel: Pick<Channel, "name">) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${channel.name}, Daet, Camarines Norte`)}`;
}
