"use client";

import { useState } from "react";
import { ClipboardCopy, Download } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const SCRIPT = "/fb-feedback-collector-v2.js";

/** Desk help card: where to get the Facebook feedback collector and how to use it. */
export function CollectorCard() {
  const [busy, setBusy] = useState(false);

  async function copy() {
    setBusy(true);
    try {
      const res = await fetch(SCRIPT, { cache: "no-store" });
      if (!res.ok) throw new Error();
      await navigator.clipboard.writeText(await res.text());
      toast("Collector script copied. Paste it into the browser console.");
    } catch {
      toast.error("Could not copy. Use Download instead and open the file to copy it.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="grid min-w-0 gap-3 rounded-2xl border border-line bg-plate p-4 text-sm sm:p-5" aria-labelledby="collector-title">
      <h2 id="collector-title" className="text-lg font-semibold">Collect feedback from Facebook</h2>
      <p className="text-muted">The collector is a small script that runs in your own browser. It reads public posts and comments about a place, saves them as a CSV file, and you add that file below. Imported feedback is shown and counted as outside the system, separate from feedback given on this site.</p>
      <ol className="grid list-decimal gap-1.5 pl-5">
        <li>Select Copy script (or Download) below.</li>
        <li>Open Facebook in Chrome, set the language to English, and go to a hashtag or search page for the place, for example <span className="break-all">facebook.com/hashtag/bagasbas</span>.</li>
        <li>Press F12, open the Console tab, paste the script and press Enter. If Chrome blocks pasting, type <code>allow pasting</code> first.</li>
        <li>Let it scroll and read the posts and comments. Use the buttons it shows to stop and save the CSV file.</li>
        <li>Below, choose Upload CSV file, drop the file, pick Facebook as the source and the place, then select Add feedback.</li>
      </ol>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={copy} disabled={busy}><ClipboardCopy size={16} aria-hidden /> {busy ? "Copying…" : "Copy script"}</Button>
        <a href={SCRIPT} download className="inline-flex h-11 items-center gap-2 rounded-full bg-cool px-4 font-medium"><Download size={16} aria-hidden /> Download</a>
      </div>
      <p className="rounded-xl bg-cool p-3 text-muted">Use only on public content and follow Facebook&apos;s terms. Author names are replaced with anonymous codes. Do not collect private groups, profiles or messages. Facebook changes its pages often, so if a column comes out blank the script&apos;s selectors need an update. Check the numbers before you rely on them.</p>
    </section>
  );
}
