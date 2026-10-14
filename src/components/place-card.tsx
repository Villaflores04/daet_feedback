"use client";
import { usePulse } from "@/lib/pulse/store";
import { FACES, tallyFaces } from "@/lib/pulse/faces";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { StoredPhoto } from "@/components/stored-photo";
import type { Channel } from "@/lib/pulse/types";

export function PlaceCard({
  channel,
  index,
}: {
  channel: Channel;
  index?: number;
}) {
  const pulses = usePulse(s => s.pulses);
  const hydrated = usePulse(s => s.hydrated);
  const ratings = pulses.filter(p => p.channelId === channel.id && !p.parentId);
  const tally = tallyFaces(ratings);
  const summary = !hydrated ? "Loading ratings…" : !tally.total ? "No ratings yet" : tally.pos > tally.total / 2 ? "Mostly positive" : tally.neg > tally.total / 2 ? "Mostly negative" : "Mixed visitor feelings";
  return (
    <Link href={`/spots/${channel.slug}`} className="place-card group">
      <div className="place-card-photo">
        <StoredPhoto
          id={channel.cover}
          alt={channel.name}
          className="h-full w-full object-cover object-[center_65%]"
        />
        <div className="place-emoji-summary" aria-label={`Emoji ratings for ${channel.name}`}>
          <div className="place-emoji-heading"><strong>{summary}</strong><span>{hydrated ? `${tally.total} ${tally.total === 1 ? "rating" : "ratings"}` : ""}</span></div>
          <ul className="place-emoji-counts">
            {FACES.map(face => <li key={face.id} aria-label={`${face.label}: ${ratings.filter(p => p.face === face.id).length}`}><span aria-hidden="true">{face.glyph}</span><span>{face.label}</span><b>{hydrated ? ratings.filter(p => p.face === face.id).length : "–"}</b></li>)}
          </ul>
          <small>Emoji feedback · latest shared entries</small>
        </div>
        <span className="place-category">{channel.category}</span>
        <span className="place-arrow">
          <ArrowUpRight size={20} />
        </span>
      </div>
      <div className="place-card-copy">
        <div className="flex items-start justify-between gap-3">
          <h3>{channel.name}</h3>
          {index !== undefined && (
            <span className="text-xs text-muted tabular-nums pt-2">
              0{index + 1}
            </span>
          )}
        </div>
        <p>{channel.blurb}</p>
      </div>
    </Link>
  );
}
