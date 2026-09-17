"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import { PublicChrome } from "@/components/public-chrome";
import { StoryConversation } from "@/components/story-conversation";
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

  const roots = useMemo(() => {
    return pulses
      .filter((p) => !p.parentId)
      .filter((p) => (activePlace ? p.channelId === activePlace.id : true))
      .filter((p) => (photosOnly ? Boolean(p.photo) : true))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [pulses, activePlace, photosOnly]);

  return (
    <PublicChrome>
      <main id="main-content" className="page-width pb-16">
        <header className="page-intro">
          <p className="eyebrow">From the community</p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">
            Visitor voices
          </h1>
          <p className="mt-2 text-sm text-muted">
            A collection of visits, discoveries, and honest impressions.
          </p>
        </header>
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <FilterChip
            active={!place}
            onClick={() => {
              filter(undefined, photosOnly);
            }}
          >
            All places
          </FilterChip>
          {channels.map((channel) => (
            <FilterChip
              key={channel.id}
              active={place === channel.slug}
              onClick={() => {
                filter(channel.slug, photosOnly);
              }}
            >
              {channel.name}
            </FilterChip>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between gap-3">
          <FilterChip
            active={photosOnly}
            onClick={() => {
              filter(place, !photosOnly);
            }}
          >
            Photos only
          </FilterChip>
          <p className="text-right text-xs text-muted" role="status">{roots.length} {roots.length === 1 ? "story" : "stories"} · Newest first</p>
        </div>

        {roots.length === 0 ? (
          <div className="mt-8 rounded-2xl bg-plate px-4 py-10 text-center text-sm text-muted shadow-plate">
            <p>No stories match these filters yet.</p>
            {place || photosOnly ? <button type="button" onClick={() => filter(undefined, false)} className="mt-3 min-h-11 rounded-full bg-cool px-5 font-semibold text-teal">Clear filters</button> : null}
          </div>
        ) : (
          <ul className="mt-6 grid items-start gap-5 lg:grid-cols-2">
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
        "h-10 shrink-0 rounded-full px-4 text-sm font-medium",
        active ? "bg-teal text-plate" : "bg-cool text-ink",
      )}
    >
      {children}
    </button>
  );
}
