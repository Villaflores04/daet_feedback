"use client";

import { useMemo, useRef, useState } from "react";
import { FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { CollectorCard } from "@/components/collector-card";
import { ShareLinkCard } from "@/components/share-link-card";
import { Button } from "@/components/ui/button";
import { parseCsv } from "@/lib/csv";
import { isCollectorCsv, reactionsOf } from "@/lib/pulse/collector";
import { usePulse } from "@/lib/pulse/store";
import type { OutsideExt } from "@/lib/pulse/types";
import { OVERALL_ID } from "@/lib/pulse/scope";

type Entry = { body: string; callsign?: string; createdAt?: number; ext: OutsideExt };

/** Desk "Add feedback" page: the Facebook collector guide, the CSV import for its output, and the tagged link / QR code card. */
export function DeskImport() {
  const channels = usePulse((s) => s.channels);
  const syncShared = usePulse((s) => s.syncShared);
  const input = useRef<HTMLInputElement>(null);
  const [place, setPlace] = useState("");
  const [name, setName] = useState("");
  const [rows, setRows] = useState<string[][]>([]);
  const [busy, setBusy] = useState(false);

  const entries = useMemo<Entry[]>(() => {
    const header = rows[0] ?? [];
    if (!isCollectorCsv(header)) return [];
    const h = header.map((x) => x.trim().toLowerCase());
    const at = (r: string[], key: string) => (r[h.indexOf(key)] ?? "").trim();
    return rows.slice(1).map((r) => {
      const when = Date.parse(at(r, "scraped_at"));
      const label = at(r, "sentiment");
      const reactions = reactionsOf(r, header);
      return {
        body: at(r, "comment"),
        callsign: at(r, "author") || undefined,
        createdAt: Number.isFinite(when) ? when : undefined,
        ext: {
          kind: at(r, "type").toLowerCase() === "post" ? "post" : "comment",
          url: at(r, "post_url") || undefined,
          reactions,
          text: label ? { label, score: Number(at(r, "score")) || 0 } : undefined,
        },
      } as Entry;
    }).filter((e) => e.body);
  }, [rows]);

  async function pick(file?: File) {
    if (!file) return;
    if (!/\.csv$/i.test(file.name) && file.type !== "text/csv") return toast.error("Choose the CSV file saved by the collector.");
    if (file.size > 5 * 1024 * 1024) return toast.error("Use a CSV file under 5 MB.");
    const parsed = parseCsv(await file.text());
    setName(file.name);
    if (parsed.length < 2 || !isCollectorCsv(parsed[0])) { setRows([]); return toast.error("That is not a collector file. It needs the columns type, post_url, comment and scraped_at."); }
    setRows(parsed);
  }

  async function submit() {
    if (!place) return toast.error("Choose the place these comments are about.");
    if (!entries.length) return toast.error("Choose a collector CSV file first.");
    setBusy(true);
    try {
      const batch = `${name} · ${new Date().toLocaleString("en", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" })}`;
      let added = 0;
      let skipped = 0;
      for (let i = 0; i < entries.length; i += 200) {
        const res = await fetch("/api/desk/import", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ items: entries.slice(i, i + 200).map((e) => ({ channelId: place, source: "facebook", body: e.body, callsign: e.callsign || "Facebook user", createdAt: e.createdAt, ext: { ...e.ext, batch } })) }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Could not add the feedback.");
        added += data.added ?? 0;
        skipped += data.skipped?.length ?? 0;
      }
      toast(`${added} added${skipped ? `, ${skipped} skipped` : ""}. See them under Sentiment, Outside.`);
      setRows([]);
      setName("");
      await syncShared();
    } catch (cause) {
      toast.error(cause instanceof Error ? cause.message : "Could not add the feedback.");
    } finally {
      setBusy(false);
    }
  }

  const places = channels.filter((c) => c.id !== OVERALL_ID);
  const withReactions = entries.filter((e) => Object.values(e.ext.reactions ?? {}).some(Boolean)).length;

  return (
    <div className="desk-activity min-w-0">
      <header className="desk-page-heading">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Sources</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Add feedback</h1>
        <p className="mt-2 text-sm text-muted">
          Collect feedback from Facebook with the collector script, then import its CSV file here. Imported comments and reactions are analysed separately as outside the system and shown on the Other platforms page. You can also share a tagged link or QR code so visitors can give feedback on this site.
        </p>
      </header>

      <div className="mt-6"><CollectorCard /></div>

      <section className="mt-6 grid min-w-0 gap-3 rounded-2xl bg-plate p-4 text-sm shadow-plate sm:p-6" aria-labelledby="import-title">
        <h2 id="import-title" className="text-lg font-semibold">Import the collector CSV</h2>
        <label className="grid min-w-0 gap-1">
          <span className="text-muted">Place these comments are about</span>
          <select value={place} onChange={(e) => setPlace(e.target.value)} className="h-11 w-full min-w-0 rounded-xl border border-line bg-plate px-3">
            <option value="">Choose a place</option>
            {places.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <button type="button" onClick={() => input.current?.click()} className="flex min-h-24 w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-line p-4 text-center">
          <FileSpreadsheet size={26} className="text-muted" aria-hidden />
          <span className="font-medium">{name || "Choose the CSV file from the collector"}</span>
          <span className="text-xs text-muted">CSV files only, up to 5 MB.</span>
        </button>
        <input ref={input} type="file" accept=".csv,text/csv" className="sr-only" tabIndex={-1} onChange={(e) => { void pick(e.target.files?.[0]); e.target.value = ""; }} />
        {entries.length ? (
          <div className="rounded-xl bg-cool p-3">
            <p className="font-medium">{entries.length} comments and posts ready. {withReactions} have Facebook reactions. Reactions are kept as Facebook's own (Like, Love, Care, Haha, Wow, Sad, Angry) and are not turned into the site's four faces. Comment text is scored with the text sentiment rules.</p>
            <ul className="mt-2 grid gap-1 text-muted">
              {entries.slice(0, 3).map((e, i) => <li key={i} className="break-words">{e.ext.kind === "post" ? "Post" : "Comment"}: {e.body.slice(0, 120)}</li>)}
            </ul>
          </div>
        ) : null}
        <div className="flex justify-end">
          <Button type="button" onClick={submit} disabled={busy}>{busy ? "Importing…" : "Import to Other platforms"}</Button>
        </div>
      </section>

      <ShareLinkCard />
    </div>
  );
}
