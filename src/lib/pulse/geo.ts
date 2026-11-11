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
  // Approximate pins (town centre / Maharlika Highway). Verify on Google Maps
  // and adjust if a pin is a few hundred metres off.
  "friendship-park": { lat: 14.1128, lng: 122.9552 },
  "freedom-park": { lat: 14.1124, lng: 122.9553 },
  "sm-city-daet": { lat: 14.1216, lng: 122.9484 },
};

// Admin-added places get slugs like "freedom-park-ch-abc123", so also match
// on the name part of the slug.
function lookup(slug: string) {
  if (COORDS[slug]) return COORDS[slug];
  const key = Object.keys(COORDS).find((k) => slug.startsWith(k + "-"));
  return key ? COORDS[key] : null;
}

export function coordsOf(channel: Pick<Channel, "slug">) {
  return lookup(channel.slug);
}

export function mapsUrl(channel: Pick<Channel, "name">) {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${channel.name}, Daet, Camarines Norte`)}`;
}
