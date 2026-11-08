"use client";

import { useMemo, useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { toast } from "sonner";
import { ShareLinkCard } from "@/components/share-link-card";
import { Button } from "@/components/ui/button";
import { parseCsv } from "@/lib/csv";
import { getPhotoBlob, ingestFile, recordPhotoConsent } from "@/lib/pulse/photos";
import { uploadSharedPhoto } from "@/lib/pulse/remote";
import { StoredPhoto } from "@/components/stored-photo";
import { usePulse } from "@/lib/pulse/store";
import { SOURCES } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

const OUTSIDE = SOURCES.filter((s) => s.id !== "visitor" && s.id !== "qr");
const NONE = -1;

type Entry = { body: string; stars?: number; callsign?: string; createdAt?: number };

function starsOf(value: string) {
  const n = parseFloat(value);
  return Number.isFinite(n) && n >= 1 && n <= 5 ? Math.round(n) : undefined;
}

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
  const [mode, setMode] = useState<"paste" | "csv">("paste");
  const [proof, setProof] = useState("");
  const [proofUrl, setProofUrl] = useState("");
  const [proofBusy, setProofBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const proofRef = useRef<HTMLInputElement>(null);
  const [csv, setCsv] = useState<string[][]>([]);
  const [map, setMap] = useState({ body: NONE, stars: NONE, date: NONE, author: NONE });
  const pasted = useMemo(() => parseLines(text), [text]);
  const header = csv[0] ?? [];
  const csvEntries = useMemo<Entry[]>(() => {
    if (map.body === NONE) return [];
    return csv.slice(1).map((r) => {
      const when = map.date === NONE ? NaN : Date.parse(r[map.date] ?? "");
      return {
        body: (r[map.body] ?? "").trim(),
        stars: map.stars === NONE ? undefined : starsOf(r[map.stars] ?? ""),
        callsign: map.author === NONE ? undefined : (r[map.author] ?? "").trim() || undefined,
        createdAt: Number.isFinite(when) ? when : undefined,
      };
    }).filter((e) => e.body || e.stars);
  }, [csv, map]);
  const entries = mode === "csv" ? csvEntries : pasted;

  async function pickProof(file?: File) {
    if (!file) return;
    setProofBusy(true);
    try {
      const id = await ingestFile(file);
      recordPhotoConsent(id);
      const blob = await getPhotoBlob(id);
      if (!blob) throw new Error("Could not read that image.");
      const up = await uploadSharedPhoto(id, blob);
      if (!up.ok) throw new Error(up.error);
      setProof(id);
      setProofUrl(up.data);
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not upload the image.");
    } finally {
      setProofBusy(false);
      if (proofRef.current) proofRef.current.value = "";
    }
  }

  async function pickCsv(file?: File) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error("Use a CSV file under 2 MB.");
    const rows = parseCsv(await file.text());
    if (rows.length < 2) { setCsv([]); return toast.error("That file has no data rows."); }
    const head = rows[0].map((h) => h.trim().toLowerCase());
    const find = (...names: string[]) => head.findIndex((h) => names.some((n) => h.includes(n)));
    setCsv(rows);
    setMap({
      body: find("comment", "review", "text", "message", "feedback", "body", "response"),
      stars: find("rating", "stars", "star", "score"),
      date: find("date", "time", "created"),
      author: find("author", "name", "user", "reviewer"),
    });
  }

  async function submit() {
    if (!place) return toast.error("Choose the place these comments are about.");
    if (!entries.length) return toast.error(mode === "csv" ? "Choose a file and match the comment column." : "Paste at least one comment.");
    if (entries.length > 2000) return toast.error("Add up to 2,000 entries at a time.");
    setBusy(true);
    try {
      const chosen = date ? new Date(`${date}T12:00:00`).getTime() : undefined;
      let added = 0;
      let skipped = 0;
      for (let i = 0; i < entries.length; i += 200) {
        const res = await fetch("/api/desk/import", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            items: entries.slice(i, i + 200).map((e) => ({
              channelId: place, source, body: e.body, stars: e.stars, createdAt: e.createdAt ?? chosen,
              callsign: e.callsign || "Imported", photo: proofUrl || undefined,
            })),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not add the feedback.");
        added += data.added ?? 0;
        skipped += data.skipped?.length ?? 0;
      }
      toast(`${added} added${skipped ? `, ${skipped} skipped` : ""}`);
      setText("");
      setCsv([]);
      setProof("");
      setProofUrl("");
      if (fileRef.current) fileRef.current.value = "";
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

        <div className="activity-rating-filters" role="group" aria-label="How to add the feedback" style={{ gridTemplateColumns: "repeat(2, minmax(0, 1fr))" }}>
          {([["paste", "Paste comments"], ["csv", "Upload CSV file"]] as const).map(([id, label]) => (
            <button key={id} type="button" aria-pressed={mode === id} onClick={() => setMode(id)} className={cn("h-11 rounded-full px-4 text-sm font-medium", mode === id ? "bg-teal text-plate" : "bg-cool")}>{label}</button>
          ))}
        </div>

        {mode === "paste" ? (
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
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-3 text-sm">
            <label className="grid min-w-0 grid-cols-1 gap-1">
              <span className="text-muted">CSV file from a survey, Google Forms or a review export. The first row must be the column names.</span>
              <input ref={fileRef} type="file" accept=".csv,text/csv" onChange={(e) => void pickCsv(e.target.files?.[0])} className="w-full min-w-0 rounded-xl border border-line bg-plate p-2 text-sm" />
            </label>
            {csv.length ? (
              <>
                <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                  {([["body", "Comment column (required)"], ["stars", "Rating column (1–5, optional)"], ["date", "Date column (optional)"], ["author", "Name column (optional)"]] as const).map(([key, label]) => (
                    <label key={key} className="grid min-w-0 grid-cols-1 gap-1">
                      <span className="text-muted">{label}</span>
                      <select value={map[key]} onChange={(e) => setMap((m) => ({ ...m, [key]: Number(e.target.value) }))} className="h-11 w-full min-w-0 max-w-full rounded-xl border border-line bg-plate px-3 text-sm">
                        <option value={NONE}>{key === "body" ? "Choose a column" : "Not in this file"}</option>
                        {header.map((h, i) => <option key={i} value={i}>{h.trim() || `Column ${i + 1}`}</option>)}
                      </select>
                    </label>
                  ))}
                </div>
                {csvEntries.length ? (
                  <div className="min-w-0 rounded-xl bg-cool p-3">
                    <p className="text-xs font-medium text-muted">Preview, first {Math.min(4, csvEntries.length)} of {csvEntries.length}</p>
                    <ul className="mt-2 grid gap-2">
                      {csvEntries.slice(0, 4).map((e, i) => (
                        <li key={i} className="min-w-0 break-words text-sm">{e.stars ? `${e.stars}★ · ` : ""}{e.body || "(rating only)"}{e.callsign ? ` — ${e.callsign}` : ""}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        )}

        <div className="grid min-w-0 grid-cols-1 gap-2 text-sm">
          <span className="text-muted">Proof image (optional). A screenshot of the original post or review. It is kept for staff only and never shown on the public site. Hide names and faces before uploading.</span>
          <input ref={proofRef} type="file" accept="image/*" className="sr-only" onChange={(e) => void pickProof(e.target.files?.[0])} />
          {proof ? (
            <div className="relative w-40">
              <StoredPhoto id={proof} alt="Proof image" className="h-28 w-40 rounded-xl object-cover" />
              <button type="button" aria-label="Remove proof image" onClick={() => { setProof(""); setProofUrl(""); }} className="absolute right-1 top-1 grid size-8 place-items-center rounded-full bg-ink/80 text-white"><X size={16} /></button>
            </div>
          ) : (
            <button type="button" disabled={proofBusy} onClick={() => proofRef.current?.click()} className="inline-flex h-11 w-fit items-center gap-2 rounded-xl bg-cool px-4 text-sm font-medium"><ImagePlus size={18} />{proofBusy ? "Uploading…" : "Attach proof image"}</button>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted" aria-live="polite">{entries.length} {entries.length === 1 ? "entry" : "entries"} ready</p>
          <Button type="button" onClick={submit} disabled={busy}>{busy ? "Adding…" : "Add feedback"}</Button>
        </div>
      </div>
      <ShareLinkCard />
    </div>
  );
}
