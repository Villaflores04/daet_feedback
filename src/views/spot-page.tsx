"use client";

import { useParams, useSearchParams, notFound } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { FaceGauge } from "@/components/face-gauge";
import { PublicChrome } from "@/components/public-chrome";
import { RateSheet } from "@/components/rate-sheet";
import { StoredPhoto } from "@/components/stored-photo";
import { PlaceThread } from "@/components/thread";
import { Button } from "@/components/ui/button";
import { tallyFaces } from "@/lib/pulse/faces";
import { usePulse } from "@/lib/pulse/store";

export function SpotPage() {
  const params = useParams();
  const search = useSearchParams();
  const slug = String(params.slug ?? "");
  const reply = search.get("reply") ?? undefined;
  const channel = usePulse((s) => s.channels.find((c) => c.slug === slug));
  const pulses = usePulse((s) => s.pulses);
  const [rate, setRate] = useState(false);

  const tally = useMemo(
    () => tallyFaces(pulses.filter((p) => p.channelId === channel?.id)),
    [pulses, channel?.id],
  );

  if (!channel) throw notFound();

  return (
    <PublicChrome>
      <main id="main-content">
        <div className="relative h-72 sm:h-96 lg:h-[30rem]">
          <StoredPhoto
            id={channel.cover}
            alt={channel.name}
            className="h-full w-full object-cover object-[center_72%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/55 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 px-4 pb-5 sm:px-6">
            <div className="page-width">
              <p className="text-xs uppercase tracking-[0.16em] text-plate/80">
                {channel.category}
              </p>
              <h1 className="mt-1 font-display text-4xl tracking-tight text-plate sm:text-6xl">
                {channel.name}
              </h1>
            </div>
          </div>
        </div>

        <div className="page-width grid grid-cols-1 gap-10 py-8 lg:py-12 lg:grid-cols-[1.3fr_0.7fr] lg:items-start">
          <div>
            <Link
              href="/spots"
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
              <h2 className="font-display text-2xl tracking-tight">
                Visitor stories
              </h2>
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
            title="How this place feels"
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
