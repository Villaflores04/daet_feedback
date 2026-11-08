"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ShareLinkCard } from "@/components/share-link-card";
import { Button } from "@/components/ui/button";
import { usePulse } from "@/lib/pulse/store";
import { SOURCES } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

const OUTSIDE = SOURCES.filter((s) => s.id !== "visitor");

type Entry = { body: string; stars?: number };

/** One entry per line. A leading rating like "5 - Great view" or "2/5: too crowded" becomes stars. */
function parseLines(text: string): Entry[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const m = line.match(/^([1-5])(?:\s*\/\s*5|\s*stars?)?\s*[-:|–]\s*(.*)$/i);
      return m ? { stars: Number(m[1]), body: m[2].trim() } : { body: line };
    });
}

export function DeskImport() {
  const channels = usePulse((s) => s.channels);
  const syncShared = usePulse((s) => s.syncShared);
  const [source, setSource] = useState<string>("facebook");
  const [place, setPlace] = useState("");
  const [date, setDate] = useState("");
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const entries = useMemo(() => parseLines(text), [text]);

  async function submit() {
    if (!place) return toast.error("Choose the place these comments are about.");
    if (!entries.length) return toast.error("Paste at least one comment.");
    if (entries.length > 200) return toast.error("Add up to 200 entries at a time.");
    setBusy(true);
    try {
      const when = date ? new Date(`${date}T12:00:00`).getTime() : undefined;
      const res = await fetch("/api/desk/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          items: entries.map((e) => ({ channelId: place, source, body: e.body, stars: e.stars, createdAt: when, callsign: "Imported" })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not add the feedback.");
      const skipped = data.skipped?.length ?? 0;
      toast(`${data.added} added${skipped ? `, ${skipped} skipped` : ""}`);
      setText("");
      await syncShared();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not add the feedback.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="desk-activity min-w-0">
      <header className="desk-page-heading">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Sources</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Add outside feedback</h1>
        <p className="mt-2 text-sm text-muted">
          Bring in comments from Facebook, Google reviews, TripAdvisor, surveys or walk-ins. Each one is scored with the same sentiment rules as site feedback and counted in the charts.
        </p>
      </header>

      <div className="mt-6 grid grid-cols-1 gap-4 rounded-2xl bg-plate p-4 shadow-plate sm:p-6">
        <div className="activity-rating-filters" role="group" aria-label="Where did this feedback come from?">
          {OUTSIDE.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={source === s.id}
              onClick={() => setSource(s.id)}
              className={cn("h-11 rounded-full px-4 text-sm font-medium", source === s.id ? "bg-teal text-plate" : "bg-cool")}
            >
              {s.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="grid min-w-0 grid-cols-1 gap-1 text-sm">
            <span className="text-muted">Place</span>
            <select value={place} onChange={(e) => setPlace(e.target.value)} className="h-11 w-full min-w-0 max-w-full rounded-xl border border-line bg-plate px-3 text-sm">
              <option value="">Choose a place</option>
              {channels.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </label>
          <label className="grid min-w-0 grid-cols-1 gap-1 text-sm">
            <span className="text-muted">Date of the feedback (optional)</span>
            <input type="date" value={date} max={new Date().toISOString().slice(0, 10)} onChange={(e) => setDate(e.target.value)} className="h-11 w-full min-w-0 max-w-full rounded-xl border border-line bg-plate px-3 text-sm" />
          </label>
        </div>

        <label className="grid min-w-0 grid-cols-1 gap-1 text-sm">
          <span className="text-muted">Comments, one per line. Start a line with a rating to include stars, like “5 - Beautiful sunrise” or “2/5: too crowded”.</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder={"5 - Beautiful sunrise, very friendly staff\n2/5: too crowded and dirty comfort room\nMaganda ang lugar, malinis"}
            className="w-full min-w-0 max-w-full rounded-xl border border-line bg-plate p-3 text-sm"
          />
        </label>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">{entries.length} {entries.length === 1 ? "entry" : "entries"} ready</p>
          <Button type="button" onClick={submit} disabled={busy}>{busy ? "Adding…" : "Add feedback"}</Button>
        </div>
      </div>
      <ShareLinkCard />
    </div>
  );
}
