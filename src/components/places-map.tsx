"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";
import { ExternalLink } from "lucide-react";
import { coordsOf, mapsUrl } from "@/lib/pulse/geo";
import { moodLabel, type PlaceStat } from "@/lib/pulse/places";
import type { Channel } from "@/lib/pulse/types";

const colorOf = (s?: PlaceStat) => !s || !s.total ? "#8aa0ad" : s.posShare >= 0.6 ? "#16a34a" : s.neg > s.total / 2 ? "#dc2626" : "#eab308";
const esc = (v: string) => v.replace(/[&<>"']/g, ch => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]!);

/** Interactive map of the places that have a known position, pins coloured by visitor mood. */
export default function PlacesMap({ places, stats }: { places: Channel[]; stats: Map<string, PlaceStat> }) {
  const el = useRef<HTMLDivElement>(null);
  const located = useMemo(() => places.filter(p => coordsOf(p)), [places]);
  const missing = useMemo(() => places.filter(p => !coordsOf(p)), [places]);

  useEffect(() => {
    const node = el.current;
    if (!node || !located.length) return;
    const map = L.map(node, { scrollWheelZoom: false, attributionControl: true }).setView([14.1142, 122.9564], 12);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "&copy; OpenStreetMap contributors" }).addTo(map);
    const pts: L.LatLngTuple[] = [];
    // Places sharing a spot (the town centre) are fanned out slightly so every pin stays tappable.
    const seen = new Map<string, number>();
    for (const place of located) {
      const c = coordsOf(place)!;
      const key = `${c.lat},${c.lng}`;
      const n = seen.get(key) ?? 0; seen.set(key, n + 1);
      const pos: L.LatLngTuple = [c.lat + n * 0.0016, c.lng + n * 0.0016];
      pts.push(pos);
      const stat = stats.get(place.id);
      const icon = L.divIcon({ className: "places-pin", html: `<span style="background:${colorOf(stat)}"></span>`, iconSize: [30, 30], iconAnchor: [15, 30], popupAnchor: [0, -28] });
      L.marker(pos, { icon, title: place.name, alt: place.name, keyboard: true })
        .addTo(map)
        .bindPopup(`<strong>${esc(place.name)}</strong><br/><span>${esc(stat ? moodLabel(stat) : "")}${stat?.total ? ` · ${stat.total} ratings` : ""}</span><br/><a href="/spots/${encodeURIComponent(place.slug)}">View place</a>`);
    }
    if (pts.length > 1) map.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
    else if (pts.length === 1) map.setView(pts[0], 14);
    return () => { map.remove(); };
  }, [located, stats]);

  return (
    <div className="places-map-wrap">
      {located.length ? <div ref={el} className="places-map" role="region" aria-label="Map of places in Daet" /> : <p className="places-map-empty">No places in this view have a map position yet.</p>}
      <p className="places-map-note">Pins mark the general area and are coloured by how visitors feel: green mostly positive, yellow mixed, red mostly negative, grey not rated yet.</p>
      {missing.length ? (
        <div className="places-map-missing">
          <h3>Not on the map yet</h3>
          <ul>
            {missing.map(place => (
              <li key={place.id}>
                <Link href={`/spots/${place.slug}`}>{place.name}</Link>
                <a href={mapsUrl(place)} target="_blank" rel="noopener noreferrer">Open in Maps <ExternalLink size={13} aria-hidden="true" /></a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
