"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { faceById, moodOf } from "@/lib/pulse/faces";
import { usePulse } from "@/lib/pulse/store";
import type { Mood } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export function DeskLog() {
  const channels = usePulse((s) => s.channels);
  const pulses = usePulse((s) => s.pulses);
  const burnPulse = usePulse((s) => s.burnPulse);
  const [spot, setSpot] = useState<string>("all");
  const [mood, setMood] = useState<Mood | "all">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  const tickets = useMemo(() => {
    return pulses
      .filter((p) => (spot === "all" ? true : p.channelId === spot))
      .filter((p) => (mood === "all" ? true : moodOf(p.face) === mood))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [pulses, spot, mood]);

  return (
    <div className="desk-activity">
      <header className="desk-page-heading">
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Log</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">
        Visitor activity
      </h1>
      <p className="mt-2 text-sm text-muted">
        Review feedback by place and visitor rating. Deleted feedback cannot be
        restored.
      </p>

      </header>
      <div className="activity-filters">
        <select
          aria-label="Filter feedback by place"
          value={spot}
          onChange={(e) => setSpot(e.target.value)}
          className="h-11 rounded-xl border border-line bg-plate px-3 text-sm"
        >
          <option value="all">All places</option>
          {channels.map((channel) => (
            <option key={channel.id} value={channel.id}>
              {channel.name}
            </option>
          ))}
        </select>
        <div className="activity-rating-filters" role="group" aria-label="Filter by emoji rating">
        {(["all", "POS", "MIX", "NEG"] as const).map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={mood === item}
            onClick={() => setMood(item)}
            className={cn(
              "h-11 rounded-full px-4 text-sm font-medium",
              mood === item ? "bg-teal text-plate" : "bg-cool",
            )}
          >
            {item === "all"
              ? "All ratings"
              : item === "POS"
                ? "Positive"
                : item === "MIX"
                  ? "Mixed"
                  : "Negative"}
          </button>
        ))}
        </div>
      </div>

      <p className="activity-count" aria-live="polite">{tickets.length} entries · Newest first</p>
      <ul className="activity-list">
        {tickets.map((pulse) => {
          const channel = channels.find((c) => c.id === pulse.channelId);
          const face = faceById(pulse.face);
          return (
            <li
              key={pulse.id}
              className="activity-card rounded-2xl bg-plate shadow-plate"
            >
              <span className="activity-face text-xl" aria-hidden>
                {face.glyph}
              </span>
              <div className="activity-meta min-w-0">
                <p className="font-medium">
                  {pulse.callsign}
                  <span className="ml-2 text-xs text-teal">{pulse.parentId ? "Reply" : "Comment"}</span>
                </p>
                  <p className="activity-place text-xs font-normal text-muted">
                    {channel?.name}
                  </p>
              </div>
                <p className="activity-body text-sm text-muted">
                  {pulse.body || `${face.label} — face only`}
                </p>
              <button
                type="button"
                className="activity-delete h-11 shrink-0 px-2 text-sm text-neg"
                disabled={Boolean(deleting)}
                onClick={async () => {
                  if (!confirm(pulse.parentId ? "Delete this reply?" : "Delete this comment and its replies?")) return;
                  setDeleting(pulse.id);
                  try { await burnPulse(pulse.id); toast("Feedback deleted"); }
                  catch (cause) { toast.error(cause instanceof Error ? cause.message : "Could not delete comment."); }
                  finally { setDeleting(null); }
                }}
              >
                {deleting === pulse.id ? "Deleting…" : "Delete"}
              </button>
            </li>
          );
        })}
      </ul>
      {tickets.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">
          No feedback matches these filters.
        </p>
      ) : null}
    </div>
  );
}
