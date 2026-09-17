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
  return <div className="overflow-hidden rounded-xl border border-line bg-plate">
    <PulseCard pulse={pulse} channel={channel} highlight={highlight} hidePlace={hidePlace}
      compactPhoto={false} onReply={() => setOpen(!open)} repliesOpen={open} repliesId={id}
      replyLabel={`${replies.length} ${replies.length === 1 ? "reply" : "replies"}`} />
    <section id={id} hidden={!open} aria-label={`Replies to ${pulse.callsign}`} className="border-t border-line bg-cool/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold">Conversation</h2>
        {channel && !composing ? <button type="button" onClick={() => setComposing(true)} className="min-h-11 rounded-lg px-3 text-sm font-semibold text-teal">Add a reply</button> : null}
      </div>
      {replies.length ? <ol className="space-y-3">{replies.map(reply => <li key={reply.id}><PulseCard pulse={reply} hidePlace /></li>)}</ol>
        : <p className="pb-3 text-sm text-muted">No replies yet. Start the conversation.</p>}
      {channel && composing ? <ReplyForm channel={channel} parent={pulse} onDone={() => setComposing(false)} /> : null}
    </section>
  </div>;
}
