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
  return (
    <Link href={`/spots/${channel.slug}`} className="place-card group">
      <div className="place-card-photo">
        <StoredPhoto
          id={channel.cover}
          alt={channel.name}
          className="h-full w-full object-cover object-[center_65%]"
        />
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
