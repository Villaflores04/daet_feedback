"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PublicChrome } from "@/components/public-chrome";
import { PageHero } from "@/components/page-hero";
import { StoryConversation } from "@/components/story-conversation";
import { StoredPhoto } from "@/components/stored-photo";
import { FACES, moodOf } from "@/lib/pulse/faces";
import type { Channel, Pulse } from "@/lib/pulse/types";
import { OVERALL_ID } from "@/lib/pulse/scope";
import { usePulse } from "@/lib/pulse/store";
import { cn } from "@/lib/utils";

const PAGE = 12;
type Sort = "new" | "replies" | "photos";
const SORTS: { id: Sort; label: string }[] = [
  { id: "new", label: "Newest" },
  { id: "replies", label: "Most replies" },
  { id: "photos", label: "Photos first" },
];

export function LivePage() {
  const search = useSearchParams();
  const highlight = search.get("pulse") ?? undefined;
  const place = search.get("place") ?? undefined;
  const router = useRouter();
  const channels = usePulse((s) => s.channels);
  const pulses = usePulse((s) => s.pulses);
  const photosOnly = search.get("photos") === "1";
  const feelingParam = search.get("feeling");
  const feeling = FACES.find((f) => f.id === feelingParam)?.id;
  const sortParam = search.get("sort");
  const sort: Sort = SORTS.some((o) => o.id === sortParam) ? (sortParam as Sort) : "new";
  const [q, setQ] = useState("");
  const [shown, setShown] = useState(PAGE);
  const query = q.trim().toLowerCase();

  function setParams(next: Record<string, string | undefined>) {
    const params = new URLSearchParams();
    const merged: Record<string, string | undefined> = {
      place, photos: photosOnly ? "1" : undefined, feeling, sort: sort === "new" ? undefined : sort, ...next,
    };
    for (const [key, value] of Object.entries(merged)) if (value) params.set(key, value);
    setShown(PAGE);
    router.replace(`/live${params.size ? `?${params}` : ""}`, { scroll: false });
  }
  function clearAll() { setQ(""); setShown(PAGE); router.replace("/live", { scroll: false }); }

  const activePlace = place ? channels.find((c) => c.slug === place) : undefined;
  const filtersOn = Boolean(place || photosOnly || feeling || query);

  const rootsAll = useMemo(() => pulses.filter((p) => !p.parentId && p.channelId !== OVERALL_ID), [pulses]);
  const totalStories = rootsAll.length;
  const photoStories = rootsAll.filter((p) => p.photo).length;
  const placesCovered = new Set(rootsAll.map((p) => p.channelId)).size;
  const replyCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pulses) if (p.parentId) map.set(p.parentId, (map.get(p.parentId) ?? 0) + 1);
    return map;
  }, [pulses]);
  const repliesByParent = useMemo(() => {
    const map = new Map<string, typeof pulses>();
    for (const p of pulses) if (p.parentId) map.set(p.parentId, [...(map.get(p.parentId) ?? []), p]);
    for (const list of map.values()) list.sort((a, b) => a.createdAt - b.createdAt);
    return map;
  }, [pulses]);
  const channelById = useMemo(() => new Map(channels.map((c) => [c.id, c])), [channels]);

  // Place + search + photos narrow the set; feeling counts are taken before the feeling filter.
  const base = useMemo(() => pulses
    .filter((p) => !p.parentId)
    .filter((p) => (activePlace ? p.channelId === activePlace.id : true))
    .filter((p) => (photosOnly ? Boolean(p.photo) : true))
    .filter((p) => !query || p.body.toLowerCase().includes(query) || (channelById.get(p.channelId)?.name ?? "").toLowerCase().includes(query)),
  [pulses, activePlace, photosOnly, query, channelById]);
  const feelingCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of base) counts[p.face] = (counts[p.face] ?? 0) + 1;
    return counts;
  }, [base]);
  const roots = useMemo(() => {
    const list = base.filter((p) => (feeling ? p.face === feeling : true));
    const byNew = (a: Pulse, b: Pulse) => b.createdAt - a.createdAt;
    if (sort === "replies") return list.sort((a, b) => (replyCounts.get(b.id) ?? 0) - (replyCounts.get(a.id) ?? 0) || byNew(a, b));
    if (sort === "photos") return list.sort((a, b) => Number(Boolean(b.photo)) - Number(Boolean(a.photo)) || byNew(a, b));
    return list.sort(byNew);
  }, [base, feeling, sort, replyCounts]);

  // A shared link must find its story even if it sits past the first page.
  const highlightIndex = highlight ? roots.findIndex((p) => p.id === highlight) : -1;
  const visible = roots.slice(0, Math.max(shown, highlightIndex + 1));

  useEffect(() => {
    if (!highlight) return;
    const t = window.setTimeout(() => {
      document.getElementById(`pulse-${highlight}`)?.scrollIntoView({
        block: "center",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      });
    }, 120);
    return () => window.clearTimeout(t);
  }, [highlight, pulses.length]);

  return (
    <PublicChrome>
      <main id="main-content" className="page-width pb-16 stories-main">
        <PageHero
          eyebrow="Notes from the town"
          title="Visitor stories"
          lede="Real experiences from visitors to Daet."
          stats={[{ value: totalStories, label: totalStories === 1 ? "story" : "stories" }, { value: photoStories, label: photoStories === 1 ? "photo" : "photos" }, { value: placesCovered, label: placesCovered === 1 ? "place" : "places" }]}
          action={<Link href="/feedback" className="page-hero-cta">Share an experience</Link>}
        />
        <div className="stories-bar stories-bar-v2" role="group" aria-label="Story filters">
          <label className="stories-search"><span className="sr-only">Search stories</span>
            <Search className="size-4" aria-hidden="true" />
            <input type="search" value={q} onChange={(e) => { setQ(e.target.value); setShown(PAGE); }} placeholder="Search stories, e.g. parking" aria-label="Search stories" />
          </label>
          <label className="stories-place-filter"><span className="sr-only">Filter by place</span>
            <select value={place || ""} onChange={(e) => setParams({ place: e.target.value || undefined })} aria-label="Filter stories by place">
              <option value="">All places</option>
              {channels.map((channel) => <option key={channel.id} value={channel.slug}>{channel.name}</option>)}
            </select>
          </label>
          <label className="stories-place-filter stories-sort"><span className="sr-only">Sort stories</span>
            <select value={sort} onChange={(e) => setParams({ sort: e.target.value === "new" ? undefined : e.target.value })} aria-label="Sort stories">
              {SORTS.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
          </label>
          <div className="stories-chips" role="group" aria-label="Filter by feeling">
            <FilterChip active={photosOnly} onClick={() => setParams({ photos: photosOnly ? undefined : "1" })}>📷 Photos</FilterChip>
            {FACES.map((face) => (
              <FilterChip key={face.id} active={feeling === face.id} onClick={() => setParams({ feeling: feeling === face.id ? undefined : face.id })}>
                {`${face.glyph} ${face.label} ${feelingCounts[face.id] ?? 0}`}
              </FilterChip>
            ))}
          </div>
          <p className="stories-count" role="status">{roots.length} {roots.length === 1 ? "story" : "stories"} · {SORTS.find((o) => o.id === sort)?.label}</p>
        </div>
        <div className="stories-columns">
          <StoriesAside stories={rootsAll} channels={channels} activeSlug={place} onPlace={(slug) => setParams({ place: slug })} />
          <div className="stories-results">
            {roots.length === 0 ? (
              <div className="stories-empty">
                <p className="stories-empty-emoji" aria-hidden="true">💬</p>
                <h2>{filtersOn ? "No stories match these filters." : "No stories yet."}</h2>
                <p>{filtersOn ? "Try a different place, feeling or word, or clear the filters." : "Be the first to tell Daet how your visit felt."}</p>
                <div className="stories-empty-faces">
                  {FACES.map((face) => <Link key={face.id} href={`/feedback?feeling=${face.id}`} aria-label={`Share a ${face.label} experience`}><span aria-hidden="true">{face.glyph}</span><small>{face.label}</small></Link>)}
                </div>
                {filtersOn ? <button type="button" onClick={clearAll} className="stories-empty-clear">Clear filters</button> : null}
              </div>
            ) : (
              <>
                <ul className="stories-feed">
                  {visible.map((item) => (
                    <li key={item.id}>
                      <StoryConversation
                        pulse={item}
                        channel={channelById.get(item.channelId)}
                        hidePlace={Boolean(activePlace)}
                        highlight={highlight === item.id}
                        replies={repliesByParent.get(item.id) ?? []}
                      />
                    </li>
                  ))}
                </ul>
                {visible.length < roots.length ? (
                  <div className="stories-more">
                    <button type="button" onClick={() => setShown(visible.length + PAGE)}>Show more stories</button>
                    <p>Showing {visible.length} of {roots.length}</p>
                  </div>
                ) : null}
              </>
            )}
          </div>
        </div>
      </main>
    </PublicChrome>
  );
}

function StoriesAside({ stories, channels, activeSlug, onPlace }: {
  stories: Pulse[]; channels: Channel[]; activeSlug?: string; onPlace: (slug: string | undefined) => void;
}) {
  const data = useMemo(() => {
    const byPlace = new Map<string, number>();
    const tally = { pos: 0, mix: 0, neg: 0 };
    for (const p of stories) {
      byPlace.set(p.channelId, (byPlace.get(p.channelId) ?? 0) + 1);
      const m = moodOf(p.face);
      if (m === "POS") tally.pos++; else if (m === "MIX") tally.mix++; else tally.neg++;
    }
    const top = [...byPlace.entries()]
      .map(([id, n]) => ({ channel: channels.find((c) => c.id === id), n }))
      .filter((x): x is { channel: Channel; n: number } => Boolean(x.channel))
      .sort((a, b) => b.n - a.n).slice(0, 4);
    const photos = stories.filter((p) => p.photo).sort((a, b) => b.createdAt - a.createdAt).slice(0, 6);
    return { top, tally, photos, total: stories.length };
  }, [stories, channels]);
  const pct = (n: number) => (data.total ? Math.round((n / data.total) * 100) : 0);
  return (
    <aside className="stories-aside" aria-label="Story highlights">
      <h2>Every visit has a story.</h2>
      {data.total ? (
        <>
          <section className="stories-aside-block">
            <h3>How visitors feel</h3>
            <div className="stories-moodbar" role="img" aria-label={`${pct(data.tally.pos)}% positive, ${pct(data.tally.mix)}% okay, ${pct(data.tally.neg)}% negative`}>
              <span style={{ flexGrow: data.tally.pos, background: "#16a34a" }} />
              <span style={{ flexGrow: data.tally.mix, background: "#eab308" }} />
              <span style={{ flexGrow: data.tally.neg, background: "#dc2626" }} />
            </div>
            <p className="stories-moodlegend">{pct(data.tally.pos)}% positive · {pct(data.tally.mix)}% okay · {pct(data.tally.neg)}% negative</p>
          </section>
          {data.top.length ? (
            <section className="stories-aside-block">
              <h3>Most talked about</h3>
              <ul className="stories-top">
                {data.top.map(({ channel, n }) => (
                  <li key={channel.id}>
                    <button type="button" aria-pressed={activeSlug === channel.slug} onClick={() => onPlace(activeSlug === channel.slug ? undefined : channel.slug)}>
                      <span>{channel.name}</span><b>{n}</b>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {data.photos.length ? (
            <section className="stories-aside-block">
              <h3>Recent photos</h3>
              <ul className="stories-recent">
                {data.photos.map((p) => (
                  <li key={p.id}>
                    <Link href={`/live?pulse=${p.id}`} aria-label="Open this photo story"><StoredPhoto id={p.photo} alt="Visitor photo" className="h-full w-full object-cover" /></Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </>
      ) : <p>Browse visitor experiences, open a conversation, or share your own.</p>}
      <Link href="/feedback" className="primary-link">Share an experience</Link>
    </aside>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "min-h-11 shrink-0 rounded-full px-4 text-sm font-medium",
        active ? "bg-teal text-plate" : "bg-cool text-ink",
      )}
    >
      {children}
    </button>
  );
}
