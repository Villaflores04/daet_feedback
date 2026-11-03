"use client";
import { usePulse } from "@/lib/pulse/store";
import { FACES, tallyFaces } from "@/lib/pulse/faces";
import { ago, buildPlaceStats, type PlaceStat } from "@/lib/pulse/places";
import { useMemo } from "react";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StoredPhoto } from "@/components/stored-photo";
import type { Channel } from "@/lib/pulse/types";

export function PlaceCard({
  channel,
  stat,
}: {
  channel: Channel;
  stat?: PlaceStat;
  /** Kept so existing callers still compile; cards no longer show list numbers. */
  index?: number;
}) {
  const pulses = usePulse(s => s.pulses);
  const own = useMemo(() => stat ?? buildPlaceStats([channel], pulses.filter(p => p.channelId === channel.id)).get(channel.id)!, [stat, channel, pulses]);
  const hydrated = usePulse(s => s.hydrated);
  const ratings = pulses.filter(p => p.channelId === channel.id && !p.parentId);
  const tally = tallyFaces(ratings);
  const summary = !hydrated ? "Loading ratings…" : !tally.total ? "Be the first to rate" : tally.pos > tally.total / 2 ? "Mostly positive" : tally.neg > tally.total / 2 ? "Mostly negative" : "Mixed feelings";
  const glyph = !hydrated || !tally.total ? "😐" : tally.pos > tally.total / 2 ? "😊" : tally.neg > tally.total / 2 ? "😢" : "😐";
  const breakdown = FACES.map(face => `${face.label}: ${ratings.filter(p => p.face === face.id).length}`).join(", ");
  return (
    <Link href={`/spots/${channel.slug}`} className="place-card group">
      <div className="place-card-photo">
        <StoredPhoto
          id={channel.cover}
          alt={channel.name}
          className="h-full w-full object-cover object-[center_65%]"
        />
        <div
          className={`place-rating-badge${hydrated && !tally.total ? " is-empty" : ""}`}
          aria-label={`${channel.name}: ${summary}${hydrated ? `, ${tally.total} ratings. ${breakdown}` : ""}`}
          title={hydrated ? `Latest shared emoji ratings · ${breakdown}` : summary}
        >
          {hydrated && !tally.total ? null : <span className="place-rating-emoji" aria-hidden="true">{glyph}</span>}
          <span className="place-rating-copy">
            <strong>{summary}</strong>
            {hydrated && tally.total ? <small>{tally.total} {tally.total === 1 ? "rating" : "ratings"}</small> : null}
          </span>
        </div>
        <span className="place-category">{channel.category}</span>
        <span className="place-arrow">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <div className="place-card-copy">
        <h3>{channel.name}</h3>
        <p>{channel.blurb}</p>
        {hydrated ? (
          own.total ? (
            <div className="place-card-meta">
              <div className="place-mood" role="img" aria-label={`${Math.round(own.posShare * 100)}% positive, ${own.mix} okay, ${own.neg} negative`}>
                <span style={{ flexGrow: own.pos, background: "#16a34a" }} />
                <span style={{ flexGrow: own.mix, background: "#eab308" }} />
                <span style={{ flexGrow: own.neg, background: "#dc2626" }} />
              </div>
              <p><b>{Math.round(own.posShare * 100)}%</b> positive · {own.total} {own.total === 1 ? "rating" : "ratings"}{own.lastAt ? ` · ${ago(own.lastAt)}` : ""}</p>
            </div>
          ) : <p className="place-card-first">Be the first to share how it felt →</p>
        ) : null}
      </div>
    </Link>
  );
}
