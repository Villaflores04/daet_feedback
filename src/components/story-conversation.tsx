"use client";

import { useState } from "react";
import { PulseCard } from "./pulse-card";
import { ReplyForm } from "./thread";
import type { Channel, Pulse } from "@/lib/pulse/types";

export function StoryConversation({ pulse, channel, replies, highlight, hidePlace }: {
  pulse: Pulse; channel?: Channel; replies: Pulse[]; highlight: boolean; hidePlace: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [composing, setComposing] = useState(false);
  const id = `comments-${pulse.id}`;
  return <div className="conversation-card">
    <PulseCard pulse={pulse} channel={channel} highlight={highlight} hidePlace={hidePlace}
      compactPhoto={false} onReply={replies.length ? () => setOpen(!open) : undefined}
      onCompose={channel ? () => { setOpen(true); setComposing(true); } : undefined}
      repliesOpen={open} repliesId={id}
      replyLabel={open ? "Hide replies" : `View ${replies.length} ${replies.length === 1 ? "reply" : "replies"}`} />
    <section id={id} hidden={!open} aria-label={`Replies to ${pulse.callsign}`} className="conversation-thread">
      <div className="conversation-heading">
        <h2>Replies <span>{replies.length}</span></h2>
        <p>To {pulse.callsign} · Oldest first</p>
      </div>
      {replies.length ? <ol className="conversation-replies">{replies.map(reply => <li key={reply.id}><PulseCard pulse={reply} hidePlace /></li>)}</ol>
        : <p className="conversation-empty">Be the first to reply to this story.</p>}
      {channel && composing ? <ReplyForm channel={channel} parent={pulse} onDone={() => setComposing(false)} /> : null}
      {channel && !composing ? <button type="button" className="conversation-write" onClick={() => setComposing(true)}>Write a reply to {pulse.callsign}…</button> : null}
    </section>
  </div>;
}
