"use client";

import { CollectorCard } from "@/components/collector-card";
import { ShareLinkCard } from "@/components/share-link-card";

/** Desk "Add feedback" page: the Facebook collector guide and the tagged link / QR code card. */
export function DeskImport() {
  return (
    <div className="desk-activity min-w-0">
      <header className="desk-page-heading">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Sources</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">Add feedback</h1>
        <p className="mt-2 text-sm text-muted">
          Collect feedback from social media with the collector script, or share a tagged link or QR code so visitors can give feedback on this site.
        </p>
      </header>

      <div className="mt-6"><CollectorCard /></div>

      <ShareLinkCard />
    </div>
  );
}
