import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { PublicChrome } from "@/components/public-chrome";
import { Wordmark } from "@/components/mark";
import { PulseCard } from "@/components/pulse-card";
import { StoredPhoto } from "@/components/stored-photo";
import { FACES, tallyFaces } from "@/lib/pulse/faces";
import { usePulse } from "@/lib/pulse/store";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const channels = usePulse((s) => s.channels);
  const pulses = usePulse((s) => s.pulses);
  const tally = tallyFaces(pulses);
  const latest = pulses
    .filter((p) => !p.parentId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);

  return (
    <PublicChrome landing>
      <main>
        <section className="relative isolate min-h-[100svh] overflow-hidden">
          <img
            src="/hero.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_68%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-page via-page/80 to-ink/15" />
          <div className="relative mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-4 pb-28 pt-16 sm:px-6 lg:justify-center lg:pb-20">
            <div className="rise max-w-xl">
              <Wordmark />
              <h1 className="mt-6 font-display text-[2.15rem] leading-[1.12] tracking-[-0.03em] text-ink sm:text-5xl">
                See Daet through the eyes of its visitors.
              </h1>
              <p className="mt-3 max-w-md text-base text-muted sm:text-lg">
                Discover places. Share how they felt.
              </p>
              <Link
                to="/board"
                className="mt-6 block rounded-2xl bg-plate p-4 shadow-plate"
                aria-label="Visitor feelings on the board"
              >
                <p className="text-sm font-medium text-muted">
                  Visitor feelings on the board
                </p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {FACES.map((face) => {
                    const n = pulses.filter(
                      (p) => !p.parentId && p.face === face.id,
                    ).length;
                    return (
                      <span
                        key={face.id}
                        className="flex flex-col items-center gap-1 rounded-xl bg-cool py-2"
                      >
                        <span className="text-2xl leading-none" aria-hidden>
                          {face.glyph}
                        </span>
                        <span className="text-[0.65rem] text-muted">{face.label}</span>
                        <span className="text-xs tabular-nums text-ink">{n}</span>
                      </span>
                    );
                  })}
                </div>
                <p className="mt-3 text-xs tabular-nums text-muted">
                  {tally.total} official faces in town
                </p>
              </Link>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/spots"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-teal px-5 text-sm font-medium text-plate"
                >
                  Explore Daet
                </Link>
                <Link
                  to="/transmit"
                  className="inline-flex h-12 items-center justify-center rounded-xl bg-ink px-5 text-sm font-medium text-plate"
                >
                  Share your experience
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Places
              </p>
              <h2 className="mt-1 font-display text-2xl tracking-tight">
                Explore Daet
              </h2>
            </div>
            <Link
              to="/spots"
              className="inline-flex h-11 items-center gap-1 text-sm font-medium text-action"
            >
              All places <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {channels.map((channel) => (
              <li key={channel.id}>
                <Link
                  to="/spots/$slug"
                  params={{ slug: channel.slug }}
                  className="block overflow-hidden rounded-2xl bg-plate shadow-plate transition-[box-shadow] duration-150 hover:shadow-plate-hover"
                >
                  <StoredPhoto
                    id={channel.cover}
                    alt={channel.name}
                    className="h-40 w-full object-cover object-[center_72%]"
                  />
                  <div className="p-4">
                    <p className="text-xs uppercase tracking-[0.14em] text-muted">
                      {channel.category}
                    </p>
                    <p className="mt-1 font-display text-lg tracking-tight">
                      {channel.name}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
          <div className="mb-5 flex items-end justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-muted">
                Live
              </p>
              <h2 className="mt-1 font-display text-2xl tracking-tight">
                Visitor voices
              </h2>
            </div>
            <Link
              to="/live"
              className="inline-flex h-11 items-center gap-1 text-sm font-medium text-action"
            >
              Open live <ArrowRight className="size-4" />
            </Link>
          </div>
          <ul className="grid gap-3 lg:grid-cols-3">
            {latest.map((pulse) => (
              <li key={pulse.id}>
                <PulseCard
                  pulse={pulse}
                  channel={channels.find((c) => c.id === pulse.channelId)}
                />
              </li>
            ))}
          </ul>
          {latest.length === 0 ? (
            <p className="rounded-2xl bg-plate px-4 py-10 text-center text-sm text-muted shadow-plate">
              No voices yet. Be the first to share.
            </p>
          ) : null}
        </section>
      </main>
    </PublicChrome>
  );
}
