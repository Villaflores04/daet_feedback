"use client";

import { OVERALL_ID } from "@/lib/pulse/scope";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { PublicChrome } from "@/components/public-chrome";
import { MonumentHero } from "@/components/monument-hero";
import { PlaceCard } from "@/components/place-card";
import { PulseCard } from "@/components/pulse-card";
import { FACES, tallyFaces } from "@/lib/pulse/faces";
import { usePulse } from "@/lib/pulse/store";

export function HomePage() {
  const channels = usePulse((s) => s.channels);
  const pulses = usePulse((s) => s.pulses);
  const placePulses = pulses.filter(p => p.channelId !== OVERALL_ID);
  const tally = tallyFaces(placePulses);
  const latest = pulses
    .filter((p) => !p.parentId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);
  const featured = channels.filter(c => c.id !== OVERALL_ID)
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 3);
  return (
    <PublicChrome landing>
      <main id="main-content">
        <MonumentHero />
        <section id="discover" className="page-width section-space">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / Feedback by destination</p>
              <h2>
                A place you visited.
                <br />
                <em>An experience to share.</em>
              </h2>
            </div>
            <div className="max-w-sm">
              <p className="text-muted leading-relaxed">
                Choose a destination to see visitor ratings and share your own experience. Overall-trip feedback is kept separate.
              </p>
              <Link href="/spots" className="text-link mt-4">
                View all places <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
          <ul className="place-grid">
            {featured.map((channel, index) => (
              <li key={channel.id}>
                <PlaceCard channel={channel} index={index} />
              </li>
            ))}
          </ul>
        </section>
        <section className="mood-section">
          <div className="page-width mood-layout">
            <div>
              <p className="eyebrow">02 / Visitor sentiment</p>
              <h2>
                Every visit
                <br />
                leaves a feeling.
              </h2>
              <p className="mt-4 max-w-sm leading-relaxed text-muted">
                Four ways to say how it felt. See what visitors have shared, or
                add your own experience.
              </p>
              <Link href="/board" className="text-link mt-5">
                Explore visitor sentiment <ArrowRight size={17} />
              </Link>
            </div>
            <div>
              <div className="mood-tiles">
                {FACES.map((face) => (
                  <Link
                    href="/board"
                    key={face.id}
                    className="mood-tile"
                    aria-label={`${face.label}: ${placePulses.filter((p) => !p.parentId && p.face === face.id).length} ratings. View sentiment.`}
                  >
                    <span className="mood-emoji" aria-hidden>
                      {face.glyph}
                    </span>
                    <span className="font-medium">{face.label}</span>
                    <span className="text-sm text-muted tabular-nums">
                      {
                        placePulses.filter((p) => !p.parentId && p.face === face.id)
                          .length
                      }{" "}
                      ratings
                    </span>
                  </Link>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted">
                {tally.total} place ratings in the latest shared entries · Overall-trip ratings are shown separately in Sentiment.
              </p>
            </div>
          </div>
        </section>
        <section className="page-width section-space">
          <div className="section-heading">
            <div>
              <p className="eyebrow">03 / Notes from the town</p>
              <h2>
                Small moments.
                <br />
                <em>Real impressions.</em>
              </h2>
            </div>
            <Link href="/live" className="text-link">
              All visitor stories <ArrowUpRight size={18} />
            </Link>
          </div>
          {latest.length ? (
            <ul className="grid gap-5 lg:grid-cols-3">
              {latest.map((pulse) => (
                <li key={pulse.id}>
                  <PulseCard
                    pulse={pulse}
                    channel={channels.find((c) => c.id === pulse.channelId)}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="empty-state">
              <p className="font-display text-2xl">
                Every place starts with a story.
              </p>
              <p className="mt-2 text-muted">
                Be the first to share a moment from your visit.
              </p>
              <Link href="/feedback" className="text-link mt-5">
                Share your experience <ArrowUpRight size={17} />
              </Link>
            </div>
          )}
        </section>
        <section className="page-width mb-16">
          <div className="share-banner">
            <div>
              <p className="eyebrow">Your perspective belongs here</p>
              <h2>How was your Daet experience?</h2>
              <p className="mt-3">
                A feeling, a photo, a little note. Share what went well and what
                needs attention.
              </p>
            </div>
            <Link href="/feedback" className="primary-link">
              Share your experience <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>
    </PublicChrome>
  );
}
