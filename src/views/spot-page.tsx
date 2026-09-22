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
        <div className="spot-hero page-width">
          <StoredPhoto
            id={channel.cover}
            alt={channel.name}
            className="spot-hero-image"
          />
          <div className="spot-hero-copy">
            <div>
              <Link href="/spots" className="text-link mb-6"><ArrowLeft size={16} /> All places</Link>
              <p className="eyebrow">
                {channel.category}
              </p>
              <h1 className="mt-3 font-display tracking-tight">
                {channel.name}
              </h1>
              <p className="mt-4 leading-relaxed text-muted">{channel.blurb}</p>
              <Button type="button" className="mt-6 h-12" onClick={() => setRate(true)}>Share your experience</Button>
            </div>
          </div>
        </div>

        <div className="spot-body page-width">
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
