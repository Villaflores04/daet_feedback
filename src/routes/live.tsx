import { useEffect, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PublicChrome } from "@/components/public-chrome";
import { PulseCard } from "@/components/pulse-card";
import { usePulse } from "@/lib/pulse/store";
import { cn } from "@/lib/utils";

type Search = { pulse?: string; place?: string };

export const Route = createFileRoute("/live")({
  validateSearch: (raw: Record<string, unknown>): Search => {
    const next: Search = {};
    if (typeof raw.pulse === "string" && raw.pulse) next.pulse = raw.pulse;
    if (typeof raw.place === "string" && raw.place) next.place = raw.place;
    return next;
  },
  component: LivePage,
});

function LivePage() {
  const { pulse: highlight, place } = Route.useSearch();
  const navigate = useNavigate();
  const channels = usePulse((s) => s.channels);
  const pulses = usePulse((s) => s.pulses);
  const [photosOnly, setPhotosOnly] = useState(false);

  useEffect(() => {
    if (!highlight) return;
    const t = window.setTimeout(() => {
      document
        .getElementById(`pulse-${highlight}`)
        ?.scrollIntoView({ block: "center", behavior: "smooth" });
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
      <main className="mx-auto max-w-2xl px-4 py-6 sm:px-6 lg:max-w-4xl">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Live</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">
          Visitor voices
        </h1>
        <p className="mt-2 text-sm text-muted">
          Tap agree if this matches what you saw.
        </p>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          <FilterChip
            active={!place && !photosOnly}
            onClick={() => {
              setPhotosOnly(false);
              void navigate({ to: "/live" });
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
                void navigate({
                  to: "/live",
                  search: { place: channel.slug },
                });
              }}
            >
              {channel.name}
            </FilterChip>
          ))}
          <FilterChip
            active={photosOnly}
            onClick={() => {
              setPhotosOnly(true);
              void navigate({
                to: "/live",
                search: place ? { place } : {},
              });
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
          <ul className="mt-5 grid gap-3 lg:grid-cols-2">
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
                      void navigate({
                        to: "/spots/$slug",
                        params: { slug: channel.slug },
                        search: { reply: item.id },
                      });
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
      className={cn(
        "h-10 shrink-0 rounded-full px-4 text-sm font-medium",
        active ? "bg-teal text-plate" : "bg-cool text-ink",
      )}
    >
      {children}
    </button>
  );
}
