"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { FaceGauge } from "@/components/face-gauge";
import { MoodBar } from "@/components/mood-bar";
import { WordMeter } from "@/components/word-meter";
import { FACES, tallyFaces } from "@/lib/pulse/faces";
import { usePulse } from "@/lib/pulse/store";
import { scanPulses, tallyScans } from "@/lib/pulse/words";
import { OVERALL_ID } from "@/lib/pulse/scope";
import { cn } from "@/lib/utils";

export function BoardTabs({
  active,
  desk = false,
}: {
  active: "faces" | "words";
  desk?: boolean;
}) {
  if (desk) {
    return (
      <div className="sentiment-tabs flex rounded-xl bg-cool p-1">
        <Link
          href="/desk/board"
          className={cn(
            "flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-medium",
            active === "faces"
              ? "bg-plate text-ink shadow-plate"
              : "text-muted",
          )}
        >
          Emoji ratings
        </Link>
        <Link
          href="/desk/board?tab=words"
          className={cn(
            "flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-medium",
            active === "words"
              ? "bg-plate text-ink shadow-plate"
              : "text-muted",
          )}
        >
          Text sentiment
        </Link>
      </div>
    );
  }

  return (
    <div className="sentiment-tabs flex rounded-xl bg-cool p-1">
      <Link
        href="/board"
        className={cn(
          "flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-medium",
          active === "faces" ? "bg-plate text-ink shadow-plate" : "text-muted",
        )}
      >
        Emoji ratings
      </Link>
      <Link
        href="/board/words"
        className={cn(
          "flex h-11 flex-1 items-center justify-center rounded-lg text-sm font-medium",
          active === "words" ? "bg-plate text-ink shadow-plate" : "text-muted",
        )}
      >
        Text sentiment
      </Link>
    </div>
  );
}

export function BoardView({
  mode,
  openSlug,
  desk = false,
}: {
  mode: "faces" | "words";
  openSlug?: string;
  desk?: boolean;
}) {
  const channels = usePulse((s) => s.channels);
  const pulses = usePulse((s) => s.pulses);
  const [open, setOpen] = useState<string | null>(openSlug ?? null);

  useEffect(() => {
    if (openSlug) setOpen(openSlug);
  }, [openSlug]);

  const [scope, setScope] = useState<"places" | "trip">("places");
  const scopedPulses = pulses.filter(p => scope === "trip" ? p.channelId === OVERALL_ID : p.channelId !== OVERALL_ID);
  const scopedChannels = channels.filter(c => scope === "trip" ? c.id === OVERALL_ID : c.id !== OVERALL_ID);
  const townFaces = tallyFaces(scopedPulses);
  const townWords = tallyScans(scanPulses(scopedPulses));
  const textCount = scopedPulses.filter(p => p.body.trim()).length;

  return (
    <div className={desk ? "sentiment-page sentiment-desk pb-12" : "sentiment-page page-width pb-12"}>
      <header className="sentiment-intro">
        <h1 className="font-display text-ink">Visitor sentiment</h1>
        <p>See how visitors feel about Daet.</p>
      </header>
      <div className="sentiment-controls">
      <div className="sentiment-control-group">
      <p className="sentiment-control-label">Feedback scope</p>
      <div className="sentiment-scope" role="group" aria-label="Sentiment scope">
        <button className="filter-chip min-h-11" aria-pressed={scope === "places"} onClick={() => setScope("places")}>Individual places</button>
        <button className="filter-chip min-h-11" aria-pressed={scope === "trip"} onClick={() => setScope("trip")}>Overall Daet visit</button>
      </div>
      </div>
      <div className="sentiment-control-group">
        <p className="sentiment-control-label">Analysis</p>
        <BoardTabs active={mode} desk={desk} />
      </div>
      </div>

      <div className="sentiment-layout">
        <div className="sentiment-overview">
        {mode === "faces" ? (
          <FaceGauge tally={townFaces} className="sentiment-chart" />
        ) : (
          <WordMeter tally={townWords} className="sentiment-chart" />
        )}

        <details className="sentiment-method">
          <summary>About these results{mode === "words" ? ` · ${townWords.total} classified notes` : ` · ${townFaces.total} ratings`}</summary>
          <p>Summaries cover the latest 500 shared entries. Overall visits and individual place ratings are calculated separately. Emoji ratings exclude replies.</p>
          {mode === "words" ? <p>{textCount} notes and replies checked · {townWords.total} classified · {textCount - townWords.total} without a clear sentiment match. Empty notes are excluded. Word-based estimates may misunderstand local expressions and sarcasm.</p> : null}
        </details>
        </div>
        <ul className="space-y-2">
          {scopedChannels.map((channel) => {
            const placePulses = pulses.filter(
              (p) => p.channelId === channel.id,
            );
            const faces = tallyFaces(placePulses);
            const scanned = scanPulses(placePulses);
            const classifiedIds = new Set(scanned.map(note => note.pulse.id));
            const unmatched = placePulses.filter(p => p.body.trim() && !classifiedIds.has(p.id));
            const words = tallyScans(scanned);
            const expanded = open === channel.slug;
            const count = mode === "faces" ? faces.total : words.total;
            const tally = mode === "faces" ? faces : words;

            return (
              <li
                key={channel.id}
                className="rounded-2xl bg-plate shadow-plate"
              >
                <button
                  type="button"
                  aria-expanded={expanded}
                  onClick={() => setOpen(expanded ? null : channel.slug)}
                  className="flex w-full items-center gap-3 px-4 py-3 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-ink">
                      {channel.name}
                    </p>
                    <p className="text-xs tabular-nums text-muted">
                      {count} {mode === "faces" ? "ratings" : "scanned notes"}
                    </p>
                  </div>
                  <MoodBar tally={tally} className="hidden w-28 sm:block" />
                  <ChevronDown
                    className={cn(
                      "size-5 shrink-0 text-muted transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                  />
                </button>
                {expanded ? (
                  <div className="border-t border-line px-4 py-3">
                    {mode === "faces" ? (
                      <ul className="grid grid-cols-4 gap-2 text-center">
                        {FACES.map((face) => {
                          const n = placePulses.filter(
                            (p) => !p.parentId && p.face === face.id,
                          ).length;
                          return (
                            <li
                              key={face.id}
                              className="rounded-xl bg-cool py-2"
                            >
                              <span className="block text-lg" aria-hidden>
                                {face.glyph}
                              </span>
                              <span className="text-xs tabular-nums text-muted">
                                {n}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    ) : (
                      <ul className="space-y-2">
                        {scanned.length === 0 ? (
                          <li className="text-sm text-muted">
                            No clearly classified notes on this place yet.
                          </li>
                        ) : (
                          scanned.map((note) => (
                            <li
                              key={note.pulse.id}
                              className="break-words rounded-xl bg-cool px-3 py-2 text-sm"
                            >
                              <span
                                className={cn(
                                  "mr-2 text-xs font-semibold uppercase",
                                  note.mood === "POS" && "text-pos",
                                  note.mood === "MIX" && "text-mix",
                                  note.mood === "NEG" && "text-neg",
                                )}
                              >
                                {note.mood}
                              </span>
                              {note.pulse.body}
                            </li>
                          ))
                        )}
                        {unmatched.map(note => <li key={note.id} className="break-words rounded-xl bg-cool px-3 py-2 text-sm"><span className="mr-2 text-xs font-semibold text-muted">UNCLASSIFIED</span>{note.body}</li>)}
                      </ul>
                    )}
                    <Link
                      href={`/spots/${channel.slug}`}
                      className="mt-3 inline-flex h-11 items-center text-sm font-medium text-action"
                    >
                      Open place
                    </Link>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
