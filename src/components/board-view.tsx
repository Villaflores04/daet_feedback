"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Smile, MessageSquareText } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { FaceGauge } from "@/components/face-gauge";
import { MoodBar } from "@/components/mood-bar";
import { WordMeter } from "@/components/word-meter";
import { FACES, tallyFaces } from "@/lib/pulse/faces";
import { usePulse } from "@/lib/pulse/store";
import { scanPulses, tallyScans } from "@/lib/pulse/words";
import { OVERALL_ID } from "@/lib/pulse/scope";
import { cn } from "@/lib/utils";

export function BoardTabs({ active, desk = false, scope = "places" }: {
  active: "faces" | "words"; desk?: boolean; scope?: "places" | "trip";
}) {
  return <nav className="sentiment-tabs" aria-label="Analysis type">
    {(["faces", "words"] as const).map(value => {
      const params = new URLSearchParams();
      if (scope === "trip") params.set("scope", "trip");
      if (desk && value === "words") params.set("tab", "words");
      const path = desk ? "/desk/board" : value === "faces" ? "/board" : "/board/words";
      return <Link key={value} href={`${path}${params.size ? `?${params}` : ""}`} scroll={false}
        aria-current={active === value ? "page" : undefined}>
        <span aria-hidden>{value === "faces" ? "☺" : "Aa"}</span>
        {value === "faces" ? "Emoji ratings" : "Text sentiment"}
      </Link>;
    })}
  </nav>;
}

export function BoardView({
  mode: initialMode,
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

  const search = useSearchParams();
  const [mode, setMode] = useState<"faces" | "words">(search.get("analysis") === "words" ? "words" : search.get("analysis") === "faces" ? "faces" : initialMode);
  const [scope, setScope] = useState<"places" | "trip">(search.get("scope") === "trip" ? "trip" : "places");
  function selectAnalysis(next: "faces" | "words") {
    setMode(next);
    const url = new URL(window.location.href);
    url.searchParams.set("analysis", next);
    url.searchParams.set("scope", scope);
    window.history.replaceState(null, "", url);
  }
  function selectScope(next: "places" | "trip") {
    setScope(next);
    setOpen(null);
    const url = new URL(window.location.href);
    url.searchParams.set("scope", next);
    window.history.replaceState(null, "", url);
  }
  const scopedPulses = pulses.filter(p => scope === "trip" ? p.channelId === OVERALL_ID : p.channelId !== OVERALL_ID);
  const scopedChannels = channels.filter(c => scope === "trip" ? c.id === OVERALL_ID : c.id !== OVERALL_ID);
  const townFaces = tallyFaces(scopedPulses);
  const townWords = tallyScans(scanPulses(scopedPulses));
  const textCount = scopedPulses.filter(p => p.body.trim()).length;

  return (
    <div className={desk ? "sentiment-page sentiment-desk pb-12" : "sentiment-page page-width pb-12"}>
      {desk ? (
        <header className="sentiment-intro">
          <h1 className="font-display text-ink">Visitor sentiment</h1>
          <p>See how visitors feel about Daet.</p>
        </header>
      ) : (
        <PageHero
          eyebrow="How Daet feels"
          title="Visitor sentiment"
          lede="See how visitors feel about Daet."
          stats={[{ value: townFaces.total, label: townFaces.total === 1 ? "rating" : "ratings" }, ...(townFaces.total ? [{ value: `${Math.round((townFaces.pos / townFaces.total) * 100)}%`, label: "positive" }] : []), { value: textCount, label: textCount === 1 ? "written note" : "written notes" }]}
          action={<Link href="/feedback" className="page-hero-cta">Add your rating</Link>}
        />
      )}
      <div className="sentiment-navigation">
        <div className="analysis-primary" role="group" aria-label="Analysis type">
          <button type="button" aria-pressed={mode === "faces"} onClick={() => selectAnalysis("faces")}>
            <Smile aria-hidden="true" />
            <span><strong>Emoji ratings</strong><small>How visitors rated their visit</small></span>
          </button>
          <button type="button" aria-pressed={mode === "words"} onClick={() => selectAnalysis("words")}>
            <MessageSquareText aria-hidden="true" />
            <span><strong>Text sentiment</strong><small>What visitors say in comments</small></span>
          </button>
        </div>
        <fieldset className="analysis-scope">
          <legend>Show feedback for</legend>
          <div>
            <label><input type="radio" name="feedback-scope" value="places" checked={scope === "places"} onChange={() => selectScope("places")} /><span>Individual places</span></label>
            <label><input type="radio" name="feedback-scope" value="trip" checked={scope === "trip"} onChange={() => selectScope("trip")} /><span>Overall Daet visit</span></label>
          </div>
        </fieldset>
      </div>
      <div className="sentiment-results-heading" aria-live="polite" aria-atomic="true">
        <div><h2>{mode === "faces" ? "Emoji rating overview" : "Comment sentiment overview"}</h2>
        <p>{scope === "places" ? "Individual places" : "Overall Daet visit"} · {mode === "faces" ? "Original visitor ratings" : "Written comments and replies"}</p></div>
        <span>{mode === "faces" ? `${townFaces.total} ratings` : `${townWords.total} classified · ${textCount - townWords.total} unclassified`}</span>
      </div>

      <div className="sentiment-layout">
        <div className="sentiment-overview">
        {mode === "faces" ? (
          <FaceGauge tally={townFaces} className="sentiment-chart" />
        ) : (
          <WordMeter tally={townWords} className="sentiment-chart" />
        )}

        {!desk && (mode === "faces" ? townFaces.total : townWords.total) === 0 ? (
          <div className="sentiment-empty">
            <p><strong>Nothing to chart yet.</strong> Ratings appear here as visitors share them.</p>
            <Link href="/feedback" className="primary-link">Be the first to rate</Link>
          </div>
        ) : null}
        <details className="sentiment-method">
          <summary>About these results{mode === "words" ? ` · ${townWords.total} classified notes` : ` · ${townFaces.total} ratings`}</summary>
          <p>Summaries cover the latest 500 shared entries. Overall visits and individual place ratings are calculated separately. Emoji ratings exclude replies.</p>
          {mode === "words" ? <p>{textCount} notes and replies checked · {townWords.total} classified · {textCount - townWords.total} without a clear sentiment match. Empty notes are excluded. Word-based estimates may misunderstand local expressions and sarcasm.</p> : null}
        </details>
        </div>
        <ul className="space-y-2" aria-label={scope === "places" ? "Results by place" : "Overall visit results"}>
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
                      {count} {mode === "faces" ? (count === 1 ? "rating" : "ratings") : "classified comments"} · {expanded ? "Hide details" : "View details"}
                    </p>
                  </div>
                  <MoodBar tally={tally} className="hidden w-28 sm:flex" />
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
                    ) : !desk ? (
                      <WordMeter tally={words} title="Comment sentiment summary" />
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
                              <small className="mt-2 block text-muted">{note.pulse.parentId ? "Reply" : "Original feedback"} · {note.pulse.reacts.up} agree · {note.pulse.reacts.down} disagree</small>
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
