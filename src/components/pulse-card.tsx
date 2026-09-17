"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageCircle, ThumbsDown, ThumbsUp } from "lucide-react";
import { Lightbox } from "@/components/lightbox";
import { StoredPhoto } from "@/components/stored-photo";
import { faceById } from "@/lib/pulse/faces";
import { usePulse } from "@/lib/pulse/store";
import type { Channel, Pulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function PulseCard({
  pulse,
  channel,
  hidePlace = false,
  highlight = false,
  onReply,
  compactPhoto = true,
}: {
  pulse: Pulse;
  channel?: Channel;
  hidePlace?: boolean;
  highlight?: boolean;
  onReply?: () => void;
  compactPhoto?: boolean;
}) {
  const face = faceById(pulse.face);
  const mine = usePulse((s) => s.myReacts[pulse.id]);
  const reactPulse = usePulse((s) => s.reactPulse);
  const [openPhoto, setOpenPhoto] = useState(false);
  const iso = new Date(pulse.createdAt).toISOString();

  return (
    <article
      id={`pulse-${pulse.id}`}
      className={cn(
        "rounded-xl bg-plate p-5 shadow-plate",
        highlight && "ring-2 ring-teal",
      )}
    >
      <header className="flex items-start gap-3">
        <span className="text-2xl leading-none" aria-hidden>
          {face.glyph}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {pulse.callsign}
          </p>
          <p className="text-xs text-muted">
            {hidePlace ? null : channel ? (
              <>
                <Link href={`/spots/${channel.slug}`} className="text-teal">
                  {channel.name}
                </Link>
                <span aria-hidden> · </span>
              </>
            ) : null}
            <time dateTime={iso} suppressHydrationWarning>
              {timeAgo(pulse.createdAt)}
            </time>
            <span className="sr-only"> {face.label}</span>
          </p>
        </div>
      </header>

      {pulse.body ? (
        <p className="mt-4 break-words text-[0.95rem] leading-relaxed text-ink">
          {pulse.body}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">{face.label} — face only</p>
      )}

      {pulse.photo ? (
        <button
          type="button"
          onClick={() => setOpenPhoto(true)}
          className={cn(
            "mt-3 overflow-hidden rounded-xl",
            compactPhoto ? "h-28 w-40" : "w-full",
          )}
        >
          <StoredPhoto
            id={pulse.photo}
            alt="Visitor photo"
            className={cn(
              "h-full w-full object-cover object-[center_72%]",
              !compactPhoto && "max-h-64",
            )}
          />
        </button>
      ) : null}

      <footer className="mt-4 flex items-center gap-1 border-t border-line pt-2">
        <button
          type="button"
          onClick={() => reactPulse(pulse.id, "up")}
          aria-pressed={mine === "up"}
          className={cn(
            "inline-flex h-11 min-w-11 items-center gap-1.5 rounded-lg px-2.5 text-sm",
            mine === "up" ? "bg-sea text-teal" : "text-muted",
          )}
        >
          <ThumbsUp className="size-4" />
          <span className="tabular-nums">{pulse.reacts.up}</span>
          <span className="sr-only">Agree</span>
        </button>
        <button
          type="button"
          onClick={() => reactPulse(pulse.id, "down")}
          aria-pressed={mine === "down"}
          className={cn(
            "inline-flex h-11 min-w-11 items-center gap-1.5 rounded-lg px-2.5 text-sm",
            mine === "down" ? "bg-cool text-neg" : "text-muted",
          )}
        >
          <ThumbsDown className="size-4" />
          <span className="tabular-nums">{pulse.reacts.down}</span>
          <span className="sr-only">Disagree</span>
        </button>
        {onReply ? (
          <button
            type="button"
            onClick={onReply}
            className="ml-auto inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm text-action"
          >
            <MessageCircle className="size-4" />
            Reply
          </button>
        ) : null}
      </footer>

      {openPhoto && pulse.photo ? (
        <Lightbox
          id={pulse.photo}
          alt="Visitor photo"
          onClose={() => setOpenPhoto(false)}
        />
      ) : null}
    </article>
  );
}
