"use client";

import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { PublicChrome } from "@/components/public-chrome";
import { CoastalHero } from "@/components/coastal-hero";
import { PlaceCard } from "@/components/place-card";
import { PulseCard } from "@/components/pulse-card";
import { FACES, tallyFaces } from "@/lib/pulse/faces";
import { usePulse } from "@/lib/pulse/store";

export function HomePage() {
  const channels = usePulse((s) => s.channels);
  const pulses = usePulse((s) => s.pulses);
  const tally = tallyFaces(pulses);
  const latest = pulses
    .filter((p) => !p.parentId)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 3);
  const featured = [...channels]
    .sort((a, b) => Number(b.featured) - Number(a.featured))
    .slice(0, 3);
  return (
    <PublicChrome landing>
      <main id="main-content">
        <CoastalHero />
        <section id="discover" className="page-width section-space">
          <div className="section-heading">
            <div>
              <p className="eyebrow">01 / A place for every feeling</p>
              <h2>
                Come for the coast.
                <br />
                <em>Stay for the discovery.</em>
              </h2>
            </div>
            <div className="max-w-sm">
              <p className="text-muted leading-relaxed">
                From slow mornings by the sea to familiar streets with a story.
                Find a corner of Daet to call your own.
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
              <p className="eyebrow">02 / The town, through you</p>
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
                    aria-label={`${face.label}: ${pulses.filter((p) => !p.parentId && p.face === face.id).length} ratings. View sentiment.`}
                  >
                    <span className="mood-emoji" aria-hidden>
                      {face.glyph}
                    </span>
                    <span className="font-medium">{face.label}</span>
                    <span className="text-sm text-muted tabular-nums">
                      {
                        pulses.filter((p) => !p.parentId && p.face === face.id)
                          .length
                      }{" "}
                      ratings
                    </span>
                  </Link>
                ))}
              </div>
              <p className="mt-4 text-xs text-muted">
                {tally.total} visitor ratings shared · Your next visit
                could be the first story.
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
              <Link href="/transmit" className="text-link mt-5">
                Share your experience <ArrowUpRight size={17} />
              </Link>
            </div>
          )}
        </section>
        <section className="page-width mb-16">
          <div className="share-banner">
            <div>
              <p className="eyebrow">Your perspective belongs here</p>
              <h2>Been somewhere lovely?</h2>
              <p className="mt-3">
                A feeling, a photo, a little note. Help someone discover their
                next stop.
              </p>
            </div>
            <Link href="/transmit" className="primary-link">
              Share your experience <ArrowUpRight size={18} />
            </Link>
          </div>
        </section>
      </main>
    </PublicChrome>
  );
}
