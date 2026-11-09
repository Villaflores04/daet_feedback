"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, MessageCircle, Share2, ThumbsDown, ThumbsUp } from "lucide-react";
import { Lightbox } from "@/components/lightbox";
import { StoredPhoto } from "@/components/stored-photo";
import { faceById } from "@/lib/pulse/faces";
import { usePulse } from "@/lib/pulse/store";
import { SOURCES, type Channel, type Pulse } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

function timeAgo(ts: number) {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;
  return new Date(ts).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" });
}

const LONG_STORY = 260;

export function PulseCard({
  pulse,
  channel,
  hidePlace = false,
  highlight = false,
  onReply,
  onCompose,
  compactPhoto = true,
  replyLabel = "Reply",
  repliesOpen,
  repliesId,
  photoFirst = false,
  replyCount,
  shareable = false,
  who,
}: {
  pulse: Pulse;
  channel?: Channel;
  hidePlace?: boolean;
  highlight?: boolean;
  onReply?: () => void;
  onCompose?: () => void;
  compactPhoto?: boolean;
  replyLabel?: string;
  repliesOpen?: boolean;
  repliesId?: string;
  /** Story feed: show the photo large above the author row. */
  photoFirst?: boolean;
  replyCount?: number;
  shareable?: boolean;
  /** Who this is inside the conversation (number, and whether they are the story's author). */
  who?: { code: string; author: boolean };
}) {
  const face = faceById(pulse.face);
  const sourceLabel = pulse.source && pulse.source !== "visitor" ? SOURCES.find((x) => x.id === pulse.source)?.label : undefined;
  const mine = usePulse((s) => s.myReacts[pulse.id]);
  const reactPulse = usePulse((s) => s.reactPulse);
  const [reacting, setReacting] = useState(false);
  const [reactionError, setReactionError] = useState("");
  async function react(side: "up" | "down") {
    if (reacting) return;
    setReacting(true); setReactionError("");
    try { await reactPulse(pulse.id, side); }
    catch (error) { setReactionError(error instanceof Error ? error.message : "Could not save reaction. Please retry."); }
    finally { setReacting(false); }
  }
  const [openPhoto, setOpenPhoto] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  async function share() {
    const url = `${window.location.origin}/live?pulse=${encodeURIComponent(pulse.id)}`;
    try {
      if (navigator.share) { await navigator.share({ title: "A visitor story from Daet", url }); return; }
      await navigator.clipboard.writeText(url);
      setCopied(true); window.setTimeout(() => setCopied(false), 2000);
    } catch { /* cancelled or blocked; nothing to do */ }
  }
  const reply = Boolean(pulse.parentId);
  const iso = new Date(pulse.createdAt).toISOString();
  const lead = photoFirst && !reply && Boolean(pulse.photo);
  const clamp = !reply && pulse.body.length > LONG_STORY;
  const photoButton = pulse.photo ? (
    <button
      type="button"
      onClick={() => setOpenPhoto(true)}
      aria-label={`Enlarge photo from ${pulse.callsign}`}
      className={cn(
        lead ? "story-lead" : "mt-3 overflow-hidden rounded-xl",
        !lead && !reply && !compactPhoto && "story-photo",
        !lead && (reply ? "h-20 w-28" : compactPhoto ? "h-28 w-40" : "w-full"),
      )}
    >
      <StoredPhoto
        id={pulse.photo}
        alt="Visitor photo"
        className={cn("h-full w-full object-cover", lead ? "object-center" : "object-[center_72%]", !lead && !compactPhoto && "max-h-64")}
      />
    </button>
  ) : null;

  return (
    <article
      id={`pulse-${pulse.id}`}
      className={cn(
        reply ? "rounded-lg bg-plate px-3 py-2" : "rounded-xl bg-plate p-5 shadow-plate",
        !reply && "story-card",
        reply && "conversation-reply",
        lead && "story-card-lead",
        highlight && "ring-2 ring-teal",
      )}
    >
      {lead ? photoButton : null}
      <header className="story-author flex items-start gap-2">
        <span className={reply ? "text-lg leading-none" : "text-2xl leading-none"} aria-hidden>
          {face.glyph}
        </span>
        <div className="min-w-0 flex-1">
          <p className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
            <span className="truncate">{pulse.callsign}</span>
            {who?.author && pulse.parentId ? <span className="shrink-0 rounded-full bg-teal px-2 py-0.5 text-[11px] font-semibold text-plate" title="This reply is from the person who wrote the story">Author</span> : null}
            {who ? <span className="shrink-0 rounded-full bg-cool px-2 py-0.5 font-mono text-[11px] font-medium text-muted" title="Numbered by who spoke first in this conversation">{who.code}</span> : null}
            {sourceLabel ? <span className="shrink-0 rounded-full bg-cool px-2 py-0.5 text-[11px] font-medium text-muted">via {sourceLabel}</span> : null}
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
            {replyCount ? <><span aria-hidden> · </span><span>{replyCount} {replyCount === 1 ? "reply" : "replies"}</span></> : null}
            <span className="sr-only"> {face.label}</span>
          </p>
        </div>
      </header>

      {pulse.body ? (
        <p className={cn("whitespace-pre-wrap break-words text-ink", reply ? "mt-2 text-sm leading-5" : "mt-4 text-[0.95rem] leading-relaxed", (reply ? pulse.body.length > 180 : clamp) && !expanded && (reply ? "line-clamp-4" : "line-clamp-5"))}>
          {pulse.body}
        </p>
      ) : (
        <p className="mt-3 text-sm text-muted">{face.label} — face only</p>
      )}
      {(reply && pulse.body.length > 180) || clamp ? <button type="button" aria-expanded={expanded} onClick={() => setExpanded(!expanded)} className="min-h-11 text-xs font-semibold text-teal">{expanded ? "Show less" : reply ? "Read full reply" : "Read more"}</button> : null}

      {!lead ? photoButton : null}

      <footer className={cn("story-actions flex items-center gap-1", reply ? "mt-1" : "mt-4 border-t border-line pt-2")}>
        <button
          type="button"
          disabled={reacting}
          onClick={() => void react("up")}
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
          disabled={reacting}
          onClick={() => void react("down")}
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
        <div className="story-reply-actions">
        {shareable ? <button type="button" onClick={() => void share()} className="story-share" aria-label="Share this story">{copied ? <Check className="size-4" /> : <Share2 className="size-4" />}<span>{copied ? "Link copied" : "Share"}</span></button> : null}
        {onReply ? (
          <button
            type="button"
            onClick={onReply}
            aria-expanded={repliesOpen}
            aria-controls={repliesId}
            className="ml-auto inline-flex h-11 items-center gap-1.5 rounded-lg px-3 text-sm text-action"
          >
            <MessageCircle className="size-4" />
            {replyLabel}
          </button>
        ) : null}
        {onCompose ? <button type="button" onClick={onCompose} className="story-compose-button"><MessageCircle className="size-4" />Reply</button> : null}
        </div>
      </footer>

      {reactionError && <p role="alert" className="mt-2 text-sm text-neg">{reactionError}</p>}
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
