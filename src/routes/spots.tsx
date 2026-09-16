import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { PublicChrome } from "@/components/public-chrome";
import { StoredPhoto } from "@/components/stored-photo";
import { WishSheet } from "@/components/wish-sheet";
import { CATEGORIES, type Category } from "@/lib/pulse/types";
import { usePulse } from "@/lib/pulse/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/spots")({ component: SpotsPage });

function SpotsPage() {
  const channels = usePulse((s) => s.channels);
  const [filter, setFilter] = useState<Category | "All">("All");
  const [wish, setWish] = useState(false);
  const visible =
    filter === "All"
      ? channels
      : channels.filter((c) => c.category === filter);

  return (
    <PublicChrome>
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:max-w-5xl">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Places</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Explore Daet</h1>
        <p className="mt-2 text-sm text-muted">
          Magazine of the town. Wish a missing place onto the desk.
        </p>

        <div className="mt-5 flex gap-2 overflow-x-auto pb-1">
          {(["All", ...CATEGORIES] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setFilter(item)}
              className={cn(
                "h-10 shrink-0 rounded-full px-4 text-sm font-medium",
                filter === item ? "bg-teal text-plate" : "bg-cool text-ink",
              )}
            >
              {item}
            </button>
          ))}
        </div>

        <ul className="mt-6 space-y-4">
          {visible.map((channel) => (
            <li key={channel.id}>
              <Link
                to="/spots/$slug"
                params={{ slug: channel.slug }}
                className="block overflow-hidden rounded-2xl bg-plate shadow-plate transition-[box-shadow] duration-150 hover:shadow-plate-hover lg:grid lg:grid-cols-[18rem_1fr]"
              >
                <StoredPhoto
                  id={channel.cover}
                  alt={channel.name}
                  className="h-48 w-full object-cover object-[center_72%] lg:h-full lg:min-h-44"
                />
                <div className="p-5">
                  <p className="text-xs uppercase tracking-[0.14em] text-muted">
                    {channel.category}
                    {channel.featured ? " · Featured" : ""}
                  </p>
                  <h2 className="mt-1 font-display text-2xl tracking-tight">
                    {channel.name}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {channel.blurb}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>

        <button
          type="button"
          onClick={() => setWish(true)}
          className="mt-6 inline-flex h-12 w-full items-center justify-center rounded-xl border border-dashed border-line bg-plate text-sm font-medium text-action lg:w-auto lg:px-6"
        >
          Wish a missing place
        </button>
        <WishSheet open={wish} onClose={() => setWish(false)} />
      </main>
    </PublicChrome>
  );
}
