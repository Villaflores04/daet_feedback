"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Lightbox } from "@/components/lightbox";
import { StoredPhoto } from "@/components/stored-photo";
import { toast } from "sonner";
import { faceById, moodOf } from "@/lib/pulse/faces";
import { usePulse } from "@/lib/pulse/store";
import { flagPulses } from "@/lib/pulse/spam";
import { SOURCES, type Mood, type Source } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export function DeskLog() {
  const channels = usePulse((s) => s.channels);
  const pulses = usePulse((s) => s.pulses);
  const burnPulse = usePulse((s) => s.burnPulse);
  const burnMany = usePulse((s) => s.burnMany);
  const [batch, setBatch] = useState("all");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [flaggedOnly, setFlaggedOnly] = useState(false);
  const flags = useMemo(() => flagPulses(pulses), [pulses]);
  const [spot, setSpot] = useState<string>("all");
  const [mood, setMood] = useState<Mood | "all">("all");
  const [deleting, setDeleting] = useState<string | null>(null);
  const [source, setSource] = useState<Source | "all">("all");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(30);
  const [openPhoto, setOpenPhoto] = useState<string | null>(null);

  const tickets = useMemo(() => {
    return pulses
      .filter((p) => (spot === "all" ? true : p.channelId === spot))
      .filter((p) => (mood === "all" ? true : moodOf(p.face) === mood))
      .filter((p) => (batch === "all" ? true : p.ext?.batch === batch))
      .filter((p) => (flaggedOnly ? flags.has(p.id) : true))
      .filter((p) => (source === "all" ? true : (p.source ?? "visitor") === source))
      .filter((p) => !query.trim() || p.body.toLowerCase().includes(query.trim().toLowerCase()) || p.callsign.toLowerCase().includes(query.trim().toLowerCase()))
      .sort((a, b) => b.createdAt - a.createdAt);
  }, [pulses, spot, mood, source, batch, flaggedOnly, flags, query]);
  const batches = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of pulses) if (p.ext?.batch) map.set(p.ext.batch, (map.get(p.ext.batch) ?? 0) + 1);
    return [...map.entries()];
  }, [pulses]);
  const pickedShown = tickets.filter((p) => picked.has(p.id)).length;

  async function removeMany(target: { ids: string[] } | { batch: string }, label: string) {
    if (!confirm(`${label}\n\nThis cannot be undone.`)) return;
    setBulkBusy(true);
    try {
      const n = await burnMany(target);
      toast(`${n} deleted`);
      setPicked(new Set());
      if ("batch" in target) setBatch("all");
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not delete.");
    } finally {
      setBulkBusy(false);
    }
  }
  const withPhotos = tickets.filter((p) => p.photo).length;

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
        <div className="relative min-w-0">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input
            type="search"
            aria-label="Search comments"
            placeholder="Search comments or names"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShown(30); }}
            className="h-11 w-full min-w-0 rounded-xl border border-line bg-plate pl-9 pr-3 text-base sm:text-sm"
          />
        </div>
        <select
          aria-label="Filter feedback by source"
          value={source}
          onChange={(e) => { setSource(e.target.value as Source | "all"); setShown(30); }}
          className="h-11 w-full min-w-0 rounded-xl border border-line bg-plate px-3 text-sm"
        >
          <option value="all">All sources</option>
          {SOURCES.map((x) => (
            <option key={x.id} value={x.id}>{x.label}</option>
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

      {batches.length ? (
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <select aria-label="Filter by import" value={batch} onChange={(e) => { setBatch(e.target.value); setPicked(new Set()); }} className="h-11 max-w-full rounded-xl border border-line bg-plate px-3 text-sm">
            <option value="all">All imports</option>
            {batches.map(([b, n]) => <option key={b} value={b}>{b} ({n})</option>)}
          </select>
          {batch !== "all" ? (
            <button type="button" disabled={bulkBusy} className="h-11 rounded-xl bg-neg px-4 text-sm font-medium text-white" onClick={() => void removeMany({ batch }, `Delete the whole import "${batch}" (${batches.find(([b]) => b === batch)?.[1] ?? 0} entries)?`)}>
              {bulkBusy ? "Deleting…" : "Delete this whole import"}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
        <button type="button" aria-pressed={flaggedOnly} onClick={() => { setFlaggedOnly((v) => !v); setPicked(new Set()); }} className={`h-11 rounded-xl px-4 font-medium ${flaggedOnly ? "bg-neg text-white" : "bg-cool"}`}>
          Possible spam ({flags.size})
        </button>
        <label className="flex min-h-11 items-center gap-2">
          <input type="checkbox" className="size-5" checked={tickets.length > 0 && pickedShown === tickets.length} onChange={(e) => setPicked(e.target.checked ? new Set(tickets.map((p) => p.id)) : new Set())} />
          Select all {tickets.length} in this list
        </label>
        {pickedShown ? (
          <button type="button" disabled={bulkBusy} className="h-11 rounded-xl bg-neg px-4 font-medium text-white" onClick={() => void removeMany({ ids: tickets.filter((p) => picked.has(p.id)).map((p) => p.id) }, `Delete ${pickedShown} selected ${pickedShown === 1 ? "entry" : "entries"} and their replies?`)}>
            {bulkBusy ? "Deleting…" : `Delete selected (${pickedShown})`}
          </button>
        ) : null}
      </div>
      <p className="activity-count" aria-live="polite">{tickets.length} {tickets.length === 1 ? "entry" : "entries"}{withPhotos ? ` · ${withPhotos} with photos` : ""} · Newest first</p>
      <ul className="activity-list">
        {tickets.slice(0, shown).map((pulse) => {
          const channel = channels.find((c) => c.id === pulse.channelId);
          const face = faceById(pulse.face);
          return (
            <li
              key={pulse.id}
              className="activity-card rounded-2xl bg-plate shadow-plate"
            >
              <span className="flex flex-col items-center gap-2"><input type="checkbox" aria-label={`Select feedback from ${pulse.callsign}`} className="size-5" checked={picked.has(pulse.id)} onChange={(e) => setPicked((prev) => { const next = new Set(prev); if (e.target.checked) next.add(pulse.id); else next.delete(pulse.id); return next; })} />
              <span className="activity-face text-xl" aria-hidden>
                {face.glyph}
              </span></span>
              <div className="activity-meta min-w-0">
                <p className="font-medium">
                  {pulse.callsign}
                  <span className="ml-2 text-xs text-teal">{pulse.parentId ? "Reply" : "Comment"}</span>
                  {flags.has(pulse.id) ? <span className="ml-2 rounded-full bg-neg/15 px-2 py-0.5 text-xs text-neg" title={flags.get(pulse.id)!.reason}>Possible spam</span> : null}
                  {pulse.source && pulse.source !== "visitor" ? <span className="ml-2 rounded-full bg-cool px-2 py-0.5 text-xs text-muted">{SOURCES.find((x) => x.id === pulse.source)?.label}</span> : null}
                </p>
                  <p className="activity-place text-xs font-normal text-muted">
                    {channel?.name} · {new Date(pulse.createdAt).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })}
                  </p>
              </div>
                <p className="activity-body text-sm text-muted">
                  {pulse.body || `${face.label} — face only`}
                </p>
              {flags.has(pulse.id) ? (
                <p className="activity-body text-xs text-neg">
                  {flags.get(pulse.id)!.reason}.{" "}
                  <button type="button" className="underline underline-offset-2" disabled={bulkBusy} onClick={() => { const key = flags.get(pulse.id)!.authorKey; const ids = pulses.filter((x) => x.authorKey === key).map((x) => x.id); void removeMany({ ids }, `Delete all ${ids.length} entries from this device and their replies?`); }}>
                    Delete all from this device
                  </button>
                </p>
              ) : null}
              {pulse.photo ? (
                <button type="button" className="activity-photo" onClick={() => setOpenPhoto(pulse.photo!)} aria-label={`Enlarge photo from ${pulse.callsign}`}>
                  <StoredPhoto id={pulse.photo} alt="Visitor photo" className="h-full w-full object-cover" />
                </button>
              ) : null}
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
      {tickets.length > shown ? (
        <button type="button" className="mt-4 h-11 w-full rounded-xl bg-cool text-sm font-medium" onClick={() => setShown((n) => n + 30)}>
          Show {Math.min(30, tickets.length - shown)} more
        </button>
      ) : null}
      {openPhoto ? <Lightbox id={openPhoto} alt="Visitor photo" onClose={() => setOpenPhoto(null)} /> : null}
      {tickets.length === 0 ? (
        <p className="mt-8 text-center text-sm text-muted">
          No feedback matches these filters.
        </p>
      ) : null}
    </div>
  );
}
