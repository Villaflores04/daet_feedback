import { useMemo, useState } from "react";
import { createFileRoute, Link, notFound, useRouterState } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { FaceGauge } from "@/components/face-gauge";
import { PublicChrome } from "@/components/public-chrome";
import { RateSheet } from "@/components/rate-sheet";
import { StoredPhoto } from "@/components/stored-photo";
import { PlaceThread } from "@/components/thread";
import { Button } from "@/components/ui/button";
import { tallyFaces } from "@/lib/pulse/faces";
import { usePulse } from "@/lib/pulse/store";

export const Route = createFileRoute("/spots_/$slug")({
  component: SpotPage,
});

function SpotPage() {
  const { slug } = Route.useParams();
  const reply = useRouterState({
    select: (s) => {
      const search = s.location.search as { reply?: string };
      return typeof search.reply === "string" ? search.reply : undefined;
    },
  });
  const channel = usePulse((s) => s.channels.find((c) => c.slug === slug));
  const pulses = usePulse((s) => s.pulses);
  const [rate, setRate] = useState(false);

  if (!channel) throw notFound();

  const tally = useMemo(
    () => tallyFaces(pulses.filter((p) => p.channelId === channel.id)),
    [pulses, channel.id],
  );

  return (
    <PublicChrome>
      <main>
        <div className="relative h-56 sm:h-72 lg:h-[22rem]">
          <StoredPhoto
            id={channel.cover}
            alt={channel.name}
            className="h-full w-full object-cover object-[center_72%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-5 sm:px-6">
            <div className="mx-auto max-w-6xl">
              <p className="text-xs uppercase tracking-[0.16em] text-plate/80">
                {channel.category}
              </p>
              <h1 className="mt-1 font-display text-3xl tracking-tight text-plate sm:text-4xl">
                {channel.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-6 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-start">
          <div>
            <Link
              to="/spots"
              className="inline-flex h-11 items-center gap-2 text-sm text-action"
            >
              <ArrowLeft className="size-4" />
              All places
            </Link>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-muted">
              {channel.about}
            </p>
            <Button
              type="button"
              className="mt-6 h-12 w-full lg:w-auto"
              onClick={() => setRate(true)}
            >
              Rate this spot
            </Button>
            <section className="mt-10">
              <h2 className="font-display text-2xl tracking-tight">Thread</h2>
              <p className="mt-1 text-sm text-muted">
                Tap agree if this matches what you saw.
              </p>
              <div className="mt-4">
                <PlaceThread channel={channel} replyTo={reply} />
              </div>
            </section>
          </div>
          <FaceGauge
            tally={tally}
            title="This place — official faces"
            className="lg:sticky lg:top-20"
          />
        </div>
      </main>
      {rate ? (
        <RateSheet
          open={rate}
          onClose={() => setRate(false)}
          channel={channel}
        />
      ) : null}
    </PublicChrome>
  );
}
