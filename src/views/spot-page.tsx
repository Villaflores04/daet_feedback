"use client";

import { useParams, useSearchParams, notFound } from "next/navigation";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ExternalLink, Share2 } from "lucide-react";
import { WordMeter } from "@/components/word-meter";
import { scanPulses, tallyScans } from "@/lib/pulse/words";
import { FaceGauge } from "@/components/face-gauge";
import { PublicChrome } from "@/components/public-chrome";
import { RateSheet } from "@/components/rate-sheet";
import { StoredPhoto } from "@/components/stored-photo";
import { PlaceThread } from "@/components/thread";
import { Button } from "@/components/ui/button";
import { FACES, tallyFaces } from "@/lib/pulse/faces";
import { Lightbox } from "@/components/lightbox";
import { PlaceCard } from "@/components/place-card";
import { MoodTrend, RangeSwitch, ReactionsCard, TopicTone } from "@/components/sentiment-charts";
import { mapsUrl } from "@/lib/pulse/geo";
import { buildPlaceStats } from "@/lib/pulse/places";
import { buildSentiment, type Range } from "@/lib/pulse/sentiment";
import { shareLink } from "@/lib/share";
import { OVERALL_ID } from "@/lib/pulse/scope";
import { usePulse } from "@/lib/pulse/store";

export function SpotPage() {
  const params = useParams();
  const search = useSearchParams();
  const slug = String(params.slug ?? "");
  const reply = search.get("reply") ?? undefined;
  const channel = usePulse((s) => s.channels.find((c) => c.slug === slug));
  const pulses = usePulse((s) => s.pulses);
  const [rate, setRate] = useState(false);
  const [range, setRange] = useState<Range>(30);
  const [photo, setPhoto] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [heroCta, setHeroCta] = useState(true);
  const ctaRef = useRef<HTMLDivElement>(null);
  const channels = usePulse((s) => s.channels);
  const hydrated = usePulse((s) => s.hydrated);

  // Phones get a sticky button once the one in the hero scrolls out of view.
  useEffect(() => {
    const node = ctaRef.current;
    if (!node || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setHeroCta(entry.isIntersecting));
    io.observe(node);
    return () => io.disconnect();
  }, [channel?.id]);

  const own = useMemo(() => pulses.filter((p) => p.channelId === channel?.id), [pulses, channel?.id]);
  const sd = useMemo(() => buildSentiment(own, channel ? [channel] : [], "places", range), [own, channel, range]);
  const photos = useMemo(() => own.filter((p) => p.photo).sort((a, b) => b.createdAt - a.createdAt).slice(0, 8), [own]);
  // Topics most visitors praise or complain about, from the same keyword scan as the Sentiment tab.
  const says = useMemo(() => {
    const praise = sd.topics.filter((t) => t.total >= 2 && t.pos > t.neg).slice(0, 3).map((t) => t.label);
    const concerns = sd.topics.filter((t) => t.total >= 2 && t.neg > t.pos).slice(0, 3).map((t) => t.label);
    return { praise, concerns };
  }, [sd]);
  const related = useMemo(() => {
    if (!channel) return [];
    const others = channels.filter((c) => c.id !== channel.id && c.id !== OVERALL_ID);
    const stats = buildPlaceStats(others, pulses);
    const score = (c: typeof others[number]) => Number(c.category === channel.category) * 10 + (stats.get(c.id)?.posShare ?? 0);
    return others.sort((a, b) => score(b) - score(a)).slice(0, 3).map((c) => ({ c, stat: stats.get(c.id)! }));
  }, [channels, pulses, channel]);
  async function share() {
    if (!channel) return;
    const result = await shareLink(`${window.location.origin}/spots/${channel.slug}`, channel.name);
    if (result === "copied") { setCopied(true); window.setTimeout(() => setCopied(false), 2000); }
  }

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
              <div className="spot-actions" ref={ctaRef}>
                <Button type="button" className="spot-rate-button h-12" onClick={() => setRate(true)}>Share your experience</Button>
                <button type="button" className="spot-share" onClick={() => void share()}>{copied ? <Check size={16} aria-hidden="true" /> : <Share2 size={16} aria-hidden="true" />}{copied ? "Link copied" : "Share"}</button>
                <a className="spot-share" href={mapsUrl(channel)} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} aria-hidden="true" />Maps</a>
              </div>
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
            {photos.length ? (
              <section className="spot-gallery" aria-labelledby="gallery-title">
                <h2 id="gallery-title" className="font-display text-2xl tracking-tight">Visitor photos</h2>
                <ul>
                  {photos.map((p) => (
                    <li key={p.id}>
                      <button type="button" onClick={() => setPhoto(p.photo!)} aria-label="Enlarge visitor photo"><StoredPhoto id={p.photo} alt="Visitor photo" className="h-full w-full object-cover" /></button>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {hydrated && (says.praise.length || says.concerns.length) ? (
              <section className="spot-says" aria-label="What visitors say">
                <h2 className="font-display text-2xl tracking-tight">What visitors say</h2>
                {says.praise.length ? <p><span className="spot-says-tag is-good">Praised for</span>{says.praise.join(", ")}</p> : null}
                {says.concerns.length ? <p><span className="spot-says-tag is-bad">Concerns</span>{says.concerns.join(", ")}</p> : null}
                <small>Based on keywords in written comments. Read the stories below for the full picture.</small>
              </section>
            ) : null}
            {hydrated && tally.total ? (
              <section className="spot-analysis" aria-labelledby="analysis-title">
                <div className="spot-analysis-head"><h2 id="analysis-title" className="font-display text-2xl tracking-tight">How visitors feel</h2><RangeSwitch value={range} onChange={setRange} /></div>
                <div className="sentiment-charts spot-charts">
                  <MoodTrend d={sd} />
                  <TopicTone d={sd} />
                  <ReactionsCard d={sd} />
                </div>
              </section>
            ) : null}
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
        {related.length ? (
          <section className="spot-related page-width" aria-labelledby="related-title">
            <h2 id="related-title" className="font-display text-2xl tracking-tight">More places to see</h2>
            <ul className="place-grid">
              {related.map(({ c, stat }) => <li key={c.id}><PlaceCard channel={c} stat={stat} /></li>)}
            </ul>
          </section>
        ) : null}
      </main>
      {!heroCta ? <div className="spot-sticky"><Button type="button" className="h-12 w-full" onClick={() => setRate(true)}>Share your experience</Button></div> : null}
      {photo ? <Lightbox id={photo} alt="Visitor photo" onClose={() => setPhoto(null)} /> : null}
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
