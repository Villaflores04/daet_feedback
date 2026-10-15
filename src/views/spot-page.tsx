"use client";

import { useParams, useSearchParams, notFound } from "next/navigation";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { WordMeter } from "@/components/word-meter";
import { scanPulses, tallyScans } from "@/lib/pulse/words";
import { FaceGauge } from "@/components/face-gauge";
import { PublicChrome } from "@/components/public-chrome";
import { RateSheet } from "@/components/rate-sheet";
import { StoredPhoto } from "@/components/stored-photo";
import { PlaceThread } from "@/components/thread";
import { Button } from "@/components/ui/button";
import { FACES, tallyFaces } from "@/lib/pulse/faces";
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

  const commentSentiment = useMemo(() => {
    const comments = pulses.filter((p) => p.channelId === channel?.id && p.body.trim());
    const words = tallyScans(scanPulses(comments));
    const summary = comments.length === 0
      ? "No written comments yet"
      : words.total === 0
        ? "No clear sentiment detected yet"
        : words.pos > words.total / 2
          ? "Mostly positive comments"
          : words.neg > words.total / 2
            ? "Mostly negative comments"
            : "Mixed / OK comments";
    return { words, summary, unclassified: comments.length - words.total };
  }, [pulses, channel?.id]);

  if (!channel) throw notFound();

  return (
    <PublicChrome>
      <main id="main-content" className="spot-detail-page">
        <div className="spot-mobile-back page-width"><Link href="/spots"><ArrowLeft size={18} aria-hidden="true" />All places</Link></div>
        <div className="spot-hero page-width">
          <StoredPhoto
            id={channel.cover}
            alt={channel.name}
            className="spot-hero-image"
          />
          <div className="spot-hero-copy">
            <div className="spot-intro-content">
              <Link href="/spots" className="spot-desktop-back text-link mb-6"><ArrowLeft size={16} /> All places</Link>
              <p className="eyebrow">
                {channel.category}
              </p>
              <h1 className="mt-3 font-display tracking-tight">
                {channel.name}
              </h1>
              <p className="spot-description mt-4 leading-relaxed text-muted">{channel.blurb}</p>
              <FaceGauge tally={tally} title="Visitor feelings · latest shared entries" className="spot-desktop-gauge mt-5" />
              <div className="spot-mobile-ratings" aria-label="Visitor emoji ratings">
                <div><strong>{tally.total === 0 ? "No ratings yet" : tally.pos > tally.total / 2 ? "Mostly positive" : tally.neg > tally.total / 2 ? "Mostly negative" : "Mixed visitor feelings"}</strong><span>{tally.total} {tally.total === 1 ? "rating" : "ratings"}</span></div>
                <ul>{FACES.map(face => <li key={face.id}><span aria-hidden="true">{face.glyph}</span><span className="sr-only">{face.label}: </span><strong>{pulses.filter(p => p.channelId === channel.id && !p.parentId && p.face === face.id).length}</strong></li>)}</ul>
              </div>
              <div className="order-3 mt-4 min-w-0" aria-label="Comment sentiment for this place">
                <WordMeter tally={commentSentiment.words} title="Comment sentiment analysis" className="border border-line !p-4" />
                <p className="mt-2 text-sm font-medium text-ink">{commentSentiment.summary}</p>
                <p className="mt-1 text-xs leading-relaxed text-muted">
                  Written comments and replies for {channel.name} only.
                  {commentSentiment.unclassified > 0 ? ` ${commentSentiment.unclassified} unclassified — no clear word match.` : ""}
                </p>
              </div>
              <Button type="button" className="spot-rate-button mt-6 h-12" onClick={() => setRate(true)}>Share your experience</Button>
            </div>
          </div>
        </div>

        <div className="spot-body page-width feedback-spot-body">
          <div>
            <Link
              href="/spots"
              className="inline-flex h-11 items-center gap-2 text-sm text-action"
            >
              <ArrowLeft className="size-4" />
              All places
            </Link>
            <h2 className="spot-about-heading">About this place</h2>
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
