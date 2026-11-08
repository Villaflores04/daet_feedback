"use client";

import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { usePulse } from "@/lib/pulse/store";
import { LINK_SOURCES } from "@/lib/pulse/source-tag";
import { SOURCES } from "@/lib/pulse/types";

/** Builds a tagged feedback link and QR code, so feedback from outside the site arrives already labelled with its source. */
export function ShareLinkCard() {
  const channels = usePulse((s) => s.channels);
  const [place, setPlace] = useState("");
  const [source, setSource] = useState("qr");
  const [qr, setQr] = useState("");

  const url = useMemo(() => {
    if (typeof window === "undefined") return "";
    const q = new URLSearchParams({ src: source });
    if (place) q.set("place", place);
    return `${window.location.origin}/feedback?${q.toString()}`;
  }, [place, source]);

  useEffect(() => {
    if (!url) return;
    let alive = true;
    QRCode.toDataURL(url, { width: 512, margin: 2, errorCorrectionLevel: "M" }).then((data) => alive && setQr(data)).catch(() => alive && setQr(""));
    return () => { alive = false; };
  }, [url]);

  const placeName = channels.find((c) => c.id === place)?.name;
  const fileName = `connect-daet-${(placeName ?? "all-places").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${source}.png`;

  async function copy() {
    try {
      await navigator.clipboard.writeText(url);
      toast("Link copied");
    } catch {
      toast.error("Could not copy. Select the link and copy it.");
    }
  }

  return (
    <section className="mt-6 grid grid-cols-1 gap-4 rounded-2xl bg-plate p-4 shadow-plate sm:p-6" aria-labelledby="share-heading">
      <div>
        <h2 id="share-heading" className="font-display text-2xl tracking-tight">Share a tagged link or QR code</h2>
        <p className="mt-1 text-sm text-muted">
          Post the link on Facebook or print the QR code at a place. Feedback given through it is saved with its source automatically, with no typing by staff.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="grid min-w-0 grid-cols-1 gap-1 text-sm">
          <span className="text-muted">Place</span>
          <select value={place} onChange={(e) => setPlace(e.target.value)} className="h-11 w-full min-w-0 max-w-full rounded-xl border border-line bg-plate px-3 text-sm">
            <option value="">Visitor chooses the place</option>
            {channels.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="grid min-w-0 grid-cols-1 gap-1 text-sm">
          <span className="text-muted">Where will it be shared?</span>
          <select value={source} onChange={(e) => setSource(e.target.value)} className="h-11 w-full min-w-0 max-w-full rounded-xl border border-line bg-plate px-3 text-sm">
            {SOURCES.filter((s) => (LINK_SOURCES as string[]).includes(s.id)).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </label>
      </div>
      <div className="grid min-w-0 grid-cols-1 items-center gap-4 sm:grid-cols-[160px_minmax(0,1fr)]">
        {qr ? <img src={qr} alt={`QR code for ${placeName ?? "feedback"}`} width={160} height={160} className="rounded-xl bg-white" /> : <div className="size-40 rounded-xl bg-cool" aria-hidden />}
        <div className="min-w-0">
          <p className="break-all rounded-xl bg-cool p-3 text-xs leading-5" aria-label="Tagged link">{url}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" onClick={copy}>Copy link</Button>
            <a href={qr || undefined} download={fileName} aria-disabled={!qr} className="inline-flex h-11 items-center rounded-xl bg-cool px-4 text-sm font-medium">Download QR</a>
          </div>
        </div>
      </div>
    </section>
  );
}
