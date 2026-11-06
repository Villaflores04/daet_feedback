"use client";

import { OVERALL_ID } from "@/lib/pulse/scope";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { PublicChrome } from "@/components/public-chrome";
import { ScrollCue } from "@/components/scroll-cue";
import { MonumentHero } from "@/components/monument-hero";
import { PlaceCard } from "@/components/place-card";
import { PulseCard } from "@/components/pulse-card";
import { tallyFaces } from "@/lib/pulse/faces";
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
        <ScrollCue />
        <MonumentHero trail={{ places: featured.map(c => c.name), moods: { pos: tally.pos, mix: tally.mix, neg: tally.neg, total: tally.total }, story: latest.find(x => x.body && x.body.length > 20 && x.body.length < 140)?.body }} />
        <section id="discover" className="page-width section-space">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Where visitors are talking</p>
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
        <section className="page-width section-space">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Latest stories</p>
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
      </main>
    </PublicChrome>
  );
}
