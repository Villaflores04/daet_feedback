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

  const tickets = useMemo(() => {
    return pulses
      .filter((p) => !p.parentId)
      .filter((p) => (spot === "all" ? true : p.channelId === spot))
      .filter((p) => (mood === "all" ? true : moodOf(p.face) === mood))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [pulses, spot, mood]);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Log</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">Tickets</h1>
      <p className="mt-2 text-sm text-muted">
        Filter by place and official mood. Burn deletes with no undo.
      </p>

      <div className="mt-5 flex flex-wrap gap-2">
        <select
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
        {(["all", "POS", "MIX", "NEG"] as const).map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => setMood(item)}
            className={cn(
              "h-11 rounded-full px-4 text-sm font-medium",
              mood === item ? "bg-teal text-plate" : "bg-cool",
            )}
          >
            {item === "all" ? "All moods" : item}
          </button>
        ))}
      </div>

      <ul className="mt-5 space-y-2">
        {tickets.map((pulse) => {
          const channel = channels.find((c) => c.id === pulse.channelId);
          const face = faceById(pulse.face);
          return (
            <li
              key={pulse.id}
              className="flex items-start gap-3 rounded-2xl bg-plate p-4 shadow-plate"
            >
              <span className="text-xl" aria-hidden>
                {face.glyph}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {pulse.callsign}
                  <span className="ml-2 text-xs font-normal text-muted">
                    {channel?.name}
                  </span>
                </p>
                <p className="mt-1 text-sm text-muted">
                  {pulse.body || `${face.label} — face only`}
                </p>
              </div>
              <button
                type="button"
                className="h-11 shrink-0 px-2 text-sm text-neg"
                onClick={() => {
                  burnPulse(pulse.id);
                  toast("Ticket burned");
                }}
              >
                Burn
              </button>
            </li>
          );
        })}
      </ul>
      {tickets.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">No tickets in this filter.</p>
      ) : null}
    </div>
  );
}
