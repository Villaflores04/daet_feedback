"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { PublicChrome } from "@/components/public-chrome";
import { PageHero } from "@/components/page-hero";
import { StoryConversation } from "@/components/story-conversation";
import { FACES } from "@/lib/pulse/faces";
import { OVERALL_ID } from "@/lib/pulse/scope";
import { usePulse } from "@/lib/pulse/store";
import { cn } from "@/lib/utils";

export function LivePage() {
  const search = useSearchParams();
  const highlight = search.get("pulse") ?? undefined;
  const place = search.get("place") ?? undefined;
  const router = useRouter();
  const channels = usePulse((s) => s.channels);
  const pulses = usePulse((s) => s.pulses);
  const photosOnly = search.get("photos") === "1";
  function filter(nextPlace: string | undefined, photos: boolean) {
    const params = new URLSearchParams();
    if (nextPlace) params.set("place", nextPlace);
    if (photos) params.set("photos", "1");
    router.replace(`/live${params.size ? `?${params}` : ""}`, { scroll: false });
  }

  useEffect(() => {
    if (!highlight) return;
    const t = window.setTimeout(() => {
      document
        .getElementById(`pulse-${highlight}`)
        ?.scrollIntoView({
          block: "center",
          behavior: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches
            ? "instant"
            : "smooth",
        });
    }, 120);
    return () => window.clearTimeout(t);
  }, [highlight]);

  const activePlace = place
    ? channels.find((c) => c.slug === place)
    : undefined;

  const rootsAll = useMemo(() => pulses.filter((p) => !p.parentId && p.channelId !== OVERALL_ID), [pulses]);
  const totalStories = rootsAll.length;
  const photoStories = rootsAll.filter((p) => p.photo).length;
  const placesCovered = new Set(rootsAll.map((p) => p.channelId)).size;
  const roots = useMemo(() => {
    return pulses
      .filter((p) => !p.parentId)
      .filter((p) => (activePlace ? p.channelId === activePlace.id : true))
      .filter((p) => (photosOnly ? Boolean(p.photo) : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [pulses, activePlace, photosOnly]);

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
        <div className="stories-bar" role="group" aria-label="Story filters">
          <label className="stories-place-filter"><span className="sr-only">Filter by place</span>
            <select value={place || ""} onChange={event => filter(event.target.value || undefined, photosOnly)} aria-label="Filter stories by place">
              <option value="">All places</option>
              {channels.map(channel => <option key={channel.id} value={channel.slug}>{channel.name}</option>)}
            </select>
          </label>
          <FilterChip active={photosOnly} onClick={() => { filter(place, !photosOnly); }}>Photos only</FilterChip>
          <p className="stories-count" role="status">{roots.length} {roots.length === 1 ? "story" : "stories"} · Newest first</p>
        </div>
        <div className="stories-columns">
        <div className="stories-results">
        {roots.length === 0 ? (
          <div className="stories-empty">
            <p className="stories-empty-emoji" aria-hidden="true">💬</p>
            <h2>{place || photosOnly ? "No stories match these filters." : "No stories yet."}</h2>
            <p>{place || photosOnly ? "Try another place, or show every story." : "Be the first to tell Daet how your visit felt."}</p>
            <div className="stories-empty-faces">
              {FACES.map(face => <Link key={face.id} href={`/feedback?feeling=${face.id}`} aria-label={`Share a ${face.label} experience`}><span aria-hidden="true">{face.glyph}</span><small>{face.label}</small></Link>)}
            </div>
            {place || photosOnly ? <button type="button" onClick={() => filter(undefined, false)} className="stories-empty-clear">Show all stories</button> : null}
          </div>
        ) : (
          <ul className="stories-feed">
            {roots.map((item) => {
              const channel = channels.find((c) => c.id === item.channelId);
              return (
                <li key={item.id}>
                  <StoryConversation
                    pulse={item}
                    channel={channel}
                    hidePlace={Boolean(activePlace)}
                    highlight={highlight === item.id}
                    replies={pulses.filter(p => p.parentId === item.id).sort((a, b) => a.createdAt - b.createdAt)}
                  />
                </li>
              );
            })}
          </ul>
        )}
        </div>
        <aside className="stories-aside">
          <h2>Every visit has a story.</h2>
          <p>Browse visitor experiences, open a conversation, or share your own.</p>
          <Link href="/feedback" className="primary-link">Share an experience</Link>
        </aside>
        </div>
      </main>
    </PublicChrome>
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
