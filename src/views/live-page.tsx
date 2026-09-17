"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { PublicChrome } from "@/components/public-chrome";
import { PulseCard } from "@/components/pulse-card";
import { usePulse } from "@/lib/pulse/store";
import { cn } from "@/lib/utils";

export function LivePage() {
  const search = useSearchParams();
  const highlight = search.get("pulse") ?? undefined;
  const place = search.get("place") ?? undefined;
  const router = useRouter();
  const channels = usePulse((s) => s.channels);
  const pulses = usePulse((s) => s.pulses);
  const [photosOnly, setPhotosOnly] = useState(false);

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
            active={!place && !photosOnly}
            onClick={() => {
              setPhotosOnly(false);
              router.push("/live");
            }}
          >
            All
          </FilterChip>
          {channels.map((channel) => (
            <FilterChip
              key={channel.id}
              active={place === channel.slug && !photosOnly}
              onClick={() => {
                setPhotosOnly(false);
                router.push(`/live?place=${channel.slug}`);
              }}
            >
              {channel.name}
            </FilterChip>
          ))}
          <FilterChip
            active={photosOnly}
            onClick={() => {
              setPhotosOnly(true);
              router.push(place ? `/live?place=${place}` : "/live");
            }}
          >
            Photos
          </FilterChip>
        </div>

        {roots.length === 0 ? (
          <p className="mt-8 rounded-2xl bg-plate px-4 py-10 text-center text-sm text-muted shadow-plate">
            No voices here yet.
          </p>
        ) : (
          <ul className="mt-6 grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
            {roots.map((item) => {
              const channel = channels.find((c) => c.id === item.channelId);
              return (
                <li key={item.id}>
                  <PulseCard
                    pulse={item}
                    channel={channel}
                    hidePlace={Boolean(activePlace)}
                    highlight={highlight === item.id}
                    onReply={() => {
                      if (!channel) return;
                      router.push(`/spots/${channel.slug}?reply=${item.id}`);
                    }}
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
