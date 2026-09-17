"use client";
import { useState } from "react";
import { Search, Plus, X } from "lucide-react";
import { PublicChrome } from "@/components/public-chrome";
import { PlaceCard } from "@/components/place-card";
import { WishSheet } from "@/components/wish-sheet";
import { CATEGORIES, type Category } from "@/lib/pulse/types";
import { usePulse } from "@/lib/pulse/store";
export function SpotsPage() {
  const channels = usePulse((s) => s.channels);
  const [filter, setFilter] = useState<Category | "All">("All");
  const [query, setQuery] = useState("");
  const [wish, setWish] = useState(false);
  const visible = channels.filter(
    (c) =>
      (filter === "All" || c.category === filter) &&
      `${c.name} ${c.blurb} ${c.category}`
        .toLowerCase()
        .includes(query.trim().toLowerCase()),
  );
  return (
    <PublicChrome>
      <main id="main-content" className="page-width pb-16">
        <header className="page-intro">
          <p className="eyebrow">The Daet field guide</p>
          <h1>A change of scenery.</h1>
          <p>
            Follow the coastline, wander through history, or find a quiet
            corner. Your next stop starts here.
          </p>
        </header>
        <div className="explore-toolbar">
          <label className="search-field">
            <Search size={18} />
            <span className="sr-only">Search places</span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Find a place in Daet…"
              type="search"
            />
            {query && (
              <button
                className="p-2"
                onClick={() => setQuery("")}
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </label>
          <div className="filter-row" aria-label="Place categories">
            {(["All", ...CATEGORIES] as const).map((item) => (
              <button
                key={item}
                className="filter-chip"
                aria-pressed={filter === item}
                onClick={() => setFilter(item)}
              >
                {item}
              </button>
            ))}
          </div>
        </div>
        <p
          className="mb-6 text-xs uppercase tracking-widest text-muted"
          role="status"
        >
          {visible.length} {visible.length === 1 ? "place" : "places"} to
          discover
        </p>
        {visible.length ? (
          <ul className="place-grid">
            {visible.map((channel, index) => (
              <li key={channel.id}>
                <PlaceCard channel={channel} index={index} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <h2 className="font-display text-2xl">No places found.</h2>
            <p className="mt-2 text-muted">Try a different name or category.</p>
            <button
              onClick={() => {
                setQuery("");
                setFilter("All");
              }}
              className="text-link mt-4"
            >
              Clear filters
            </button>
          </div>
        )}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-line pt-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-2xl">Know a place we missed?</h2>
            <p className="mt-2 text-sm text-muted">
              Help the town’s guide grow with a suggestion.
            </p>
          </div>
          <button onClick={() => setWish(true)} className="primary-link">
            <Plus size={18} /> Suggest a place
          </button>
        </div>
        <WishSheet open={wish} onClose={() => setWish(false)} />
      </main>
    </PublicChrome>
  );
}
