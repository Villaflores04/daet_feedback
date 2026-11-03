"use client";
import { OVERALL_ID } from "@/lib/pulse/scope";
import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { ArrowUpRight, LayoutGrid, Map as MapIcon, Search, Plus, X } from "lucide-react";
import { PublicChrome } from "@/components/public-chrome";
import { PlaceCard } from "@/components/place-card";
import { PageHero } from "@/components/page-hero";
import { WishSheet } from "@/components/wish-sheet";
import { CATEGORIES, type Category, type Channel } from "@/lib/pulse/types";
import { buildPlaceStats, MIN_PLACE_RATINGS } from "@/lib/pulse/places";
import { usePulse } from "@/lib/pulse/store";
const PlacesMap = dynamic(() => import("@/components/places-map"), { ssr: false, loading: () => <div className="places-map places-map-loading" aria-hidden="true" /> });

type Sort = "top" | "most" | "latest" | "az";
const SORTS: { id: Sort; label: string }[] = [
  { id: "top", label: "Top rated" },
  { id: "most", label: "Most rated" },
  { id: "latest", label: "Latest feedback" },
  { id: "az", label: "A to Z" },
];

export function SpotsPage() {
  const channels = usePulse((s) => s.channels);
  const hydrated = usePulse((s) => s.hydrated);
  const pulses = usePulse((s) => s.pulses);
  const [filter, setFilter] = useState<Category | "All">("All");
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<Sort>("top");
  const [concernsOnly, setConcernsOnly] = useState(false);
  const [view, setView] = useState<"list" | "map">("list");
  const [wish, setWish] = useState(false);
  const places = useMemo(() => channels.filter((c) => c.id !== OVERALL_ID), [channels]);
  const stats = useMemo(() => buildPlaceStats(places, pulses), [places, pulses]);
  const ratingCount = useMemo(() => [...stats.values()].reduce((n, s) => n + s.total, 0), [stats]);
  const concernCount = useMemo(() => places.filter((c) => stats.get(c.id)?.concern).length, [places, stats]);
  const countFor = (item: Category | "All") => item === "All" ? places.length : places.filter((c) => c.category === item).length;
  const text = query.trim().toLowerCase();
  const visible = useMemo(() => {
    const list = places.filter((c) =>
      (filter === "All" || c.category === filter) &&
      (!concernsOnly || stats.get(c.id)?.concern) &&
      `${c.name} ${c.blurb} ${c.category}`.toLowerCase().includes(text));
    const stat = (c: Channel) => stats.get(c.id)!;
    const rated = (c: Channel) => stat(c).total >= MIN_PLACE_RATINGS;
    return list.sort((a, b) => {
      if (sort === "az") return a.name.localeCompare(b.name);
      if (sort === "most") return stat(b).total - stat(a).total || a.name.localeCompare(b.name);
      if (sort === "latest") return stat(b).lastAt - stat(a).lastAt || a.name.localeCompare(b.name);
      // Top rated: places with enough ratings first, then by positive share; unrated last.
      return Number(rated(b)) - Number(rated(a)) || stat(b).posShare - stat(a).posShare || stat(b).total - stat(a).total || a.name.localeCompare(b.name);
    });
  }, [places, stats, filter, concernsOnly, text, sort]);
  const picks = useMemo(() => places
    .filter((c) => { const s = stats.get(c.id)!; return s.total >= MIN_PLACE_RATINGS && s.posShare >= 0.6; })
    .sort((a, b) => stats.get(b.id)!.posShare - stats.get(a.id)!.posShare || stats.get(b.id)!.total - stats.get(a.id)!.total)
    .slice(0, 3), [places, stats]);
  const browsing = filter === "All" && !text && !concernsOnly;
  const pickIds = new Set(picks.map((c) => c.id));
  const resetAll = () => { setQuery(""); setFilter("All"); setConcernsOnly(false); };
  return (
    <PublicChrome>
      <main id="main-content" className="page-width pb-16 places-main">
        <PageHero
          eyebrow="Places in Daet"
          title="Explore places"
          lede="Find your next stop and see how visitors felt."
          stats={[{ value: places.length, label: places.length === 1 ? "place" : "places" }, { value: ratingCount, label: ratingCount === 1 ? "visitor rating" : "visitor ratings" }]}
        />
        {hydrated && browsing && view === "list" && picks.length ? (
          <section className="places-picks" aria-labelledby="picks-title">
            <h2 id="picks-title">Visitors love these</h2>
            <ol>
              {picks.map((c, i) => {
                const s = stats.get(c.id)!;
                return (
                  <li key={c.id}>
                    <Link href={`/spots/${c.slug}`} className="places-pick">
                      <span className="places-pick-rank" aria-hidden="true">{i + 1}</span>
                      <span className="places-pick-body"><strong>{c.name}</strong><small>{Math.round(s.posShare * 100)}% positive · {s.total} ratings</small></span>
                      <ArrowUpRight size={18} aria-hidden="true" />
                    </Link>
                  </li>
                );
              })}
            </ol>
          </section>
        ) : null}
        <div className="explore-toolbar">
          <label className="search-field">
            <Search size={18} />
            <span className="sr-only">Search places</span>
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a place in Daet…" type="search" />
            {query && (
              <button className="places-clear-search" onClick={() => setQuery("")} aria-label="Clear search"><X size={16} /></button>
            )}
          </label>
          <div className="places-controls">
            <label className="places-sort"><span className="sr-only">Sort places</span>
              <select value={sort} onChange={(e) => setSort(e.target.value as Sort)} aria-label="Sort places">
                {SORTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
              </select>
            </label>
            <div className="places-view" role="group" aria-label="View">
              <button type="button" aria-pressed={view === "list"} onClick={() => setView("list")}><LayoutGrid size={16} aria-hidden="true" />List</button>
              <button type="button" aria-pressed={view === "map"} onClick={() => setView("map")}><MapIcon size={16} aria-hidden="true" />Map</button>
            </div>
          </div>
          <div className="filter-row" role="group" aria-label="Place categories">
            {(["All", ...CATEGORIES] as const).map((item) => (
              <button key={item} className="filter-chip" aria-pressed={filter === item} onClick={() => setFilter(item)}>
                {item}<small>{countFor(item)}</small>
              </button>
            ))}
            {concernCount ? (
              <button className="filter-chip filter-chip-warn" aria-pressed={concernsOnly} onClick={() => setConcernsOnly(!concernsOnly)}>
                Recent concerns<small>{concernCount}</small>
              </button>
            ) : null}
          </div>
        </div>
        <p className="places-result-count mb-6 text-xs uppercase tracking-widest text-muted" role="status">
          {visible.length} {visible.length === 1 ? "place" : "places"} {view === "map" ? "on this map" : "to discover"}
        </p>
        {view === "map" ? (
          <PlacesMap places={visible} stats={stats} />
        ) : visible.length ? (
          <ul className="place-grid">
            {visible.map((channel) => (
              <li key={channel.id}>
                <PlaceCard channel={channel} stat={stats.get(channel.id)} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <h2 className="font-display text-2xl">No places found.</h2>
            <p className="mt-2 text-muted">Try a different name, category or filter.</p>
            <button onClick={resetAll} className="text-link mt-4 min-h-11">Clear filters</button>
          </div>
        )}
        <section className="places-suggest" aria-labelledby="suggest-title">
          <div>
            <h2 id="suggest-title" className="font-display text-2xl">Know a place we missed?</h2>
            <p className="mt-2 text-sm text-muted">Help the town’s guide grow. Tell us what to add and the municipal desk will review it.</p>
          </div>
          <button onClick={() => setWish(true)} className="primary-link"><Plus size={18} /> Suggest a place</button>
        </section>
        <WishSheet open={wish} onClose={() => setWish(false)} />
      </main>
    </PublicChrome>
  );
}
