"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronDown, Download, Smile, MessageSquareText } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { MismatchList, MoodDonut, MoodHeatmap, MoodTrend, PlaceCompare, RangeSwitch, ReactionsCard, SourceChart, TopReacted, TopicPlaceMatrix, TopicTone, WeekdayChart } from "@/components/sentiment-charts";
import { OutsideReactions } from "@/components/outside-reactions";
import { tallyReactions } from "@/lib/pulse/fb-reactions";
import { isOutside } from "@/lib/pulse/types";
import { buildSentiment, csvOf, DAY, type Range } from "@/lib/pulse/sentiment";
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
  origin: fixedOrigin,
}: {
  mode: "faces" | "words";
  openSlug?: string;
  desk?: boolean;
  /** Public pages show one origin only: "inside" (default) or "outside". The Desk can switch between them. */
  origin?: "inside" | "outside";
}) {
  const channels = usePulse((s) => s.channels);
  const allPulses = usePulse((s) => s.pulses);
  const search = useSearchParams();
  // Feedback given on this site (inside) and feedback staff imported from other platforms (outside) are analysed separately.
  const [chosen, setOrigin] = useState<"inside" | "outside">(search.get("origin") === "outside" ? "outside" : "inside");
  const origin = desk ? chosen : (fixedOrigin ?? "inside");
  const pulses = useMemo(() => allPulses.filter(p => (origin === "outside") === isOutside(p)), [allPulses, origin]);
  const outsideCount = useMemo(() => allPulses.filter(p => isOutside(p) && !p.parentId).length, [allPulses]);
  function selectOrigin(next: "inside" | "outside") {
    setOrigin(next);
    setOpen(null);
    const url = new URL(window.location.href);
    url.searchParams.set("origin", next);
    window.history.replaceState(null, "", url);
  }
  const hydrated = usePulse((s) => s.hydrated);
  const [range, setRange] = useState<Range>(30);
  const [open, setOpen] = useState<string | null>(openSlug ?? null);

  useEffect(() => {
    if (openSlug) setOpen(openSlug);
  }, [openSlug]);

  const [mode, setMode] = useState<"faces" | "words">(search.get("analysis") === "words" ? "words" : search.get("analysis") === "faces" ? "faces" : initialMode);
  const [scopeChoice, setScope] = useState<"places" | "trip">(search.get("scope") === "trip" ? "trip" : "places");
  // Imported feedback is always about individual places.
  const scope = origin === "outside" ? "places" : scopeChoice;
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
  const ranged = range ? pulses.filter(p => p.createdAt >= Date.now() - range * DAY) : pulses;
  const scopedPulses = ranged.filter(p => scope === "trip" ? p.channelId === OVERALL_ID : p.channelId !== OVERALL_ID);
  const sd = useMemo(() => buildSentiment(pulses, channels, scope, range), [pulses, channels, scope, range]);
  function exportCsv() {
    const url = URL.createObjectURL(new Blob([csvOf(scopedPulses, channels)], { type: "text/csv" }));
    const a = document.createElement("a"); a.href = url; a.download = `daet-sentiment-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url);
  }
  function showPlace(slug: string) { setOpen(slug); window.setTimeout(() => document.getElementById("place-details")?.scrollIntoView({ behavior: "smooth", block: "start" }), 60); }
  const scopedChannels = channels.filter(c => scope === "trip" ? c.id === OVERALL_ID : c.id !== OVERALL_ID);
  const townFaces = tallyFaces(scopedPulses);
  const townWords = tallyScans(scanPulses(scopedPulses));
  const fb = useMemo(() => tallyReactions(scopedPulses), [scopedPulses]);
  const out = origin === "outside";
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
          eyebrow={origin === "outside" ? "Beyond this site" : "How Daet feels"}
          title={origin === "outside" ? "Sentiment from other platforms" : "Visitor sentiment"}
          lede={origin === "outside" ? "Comments and reactions collected from Facebook, analysed separately from feedback given on this site." : "See how visitors feel about Daet."}
          stats={[{ value: out ? fb.total : townFaces.total, label: out ? (fb.total === 1 ? "reaction" : "reactions") : (townFaces.total === 1 ? "rating" : "ratings") }, ...((out ? fb.total : townFaces.total) ? [{ value: `${Math.round(((out ? fb.pos / fb.total : townFaces.pos / townFaces.total)) * 100)}%`, label: "positive" }] : []), { value: textCount, label: textCount === 1 ? "written note" : "written notes" }]}
          action={origin === "outside" ? <Link href="/live?from=other" className="page-hero-cta">Read the comments</Link> : <Link href="/feedback" className="page-hero-cta">Add your rating</Link>}
          corner={<Link href={out ? "/board" : "/outside"}>{out ? "Site feedback →" : "Other platforms →"}</Link>}
        />
      )}
      <div className="sentiment-navigation">
        <div className="analysis-primary" role="group" aria-label="Analysis type">
          <button type="button" aria-pressed={mode === "faces"} onClick={() => selectAnalysis("faces")}>
            <Smile aria-hidden="true" />
            <span><strong>{out ? "Facebook reactions" : "Emoji ratings"}</strong><small>{out ? "How people reacted on Facebook" : "How visitors rated their visit"}</small></span>
          </button>
          <button type="button" aria-pressed={mode === "words"} onClick={() => selectAnalysis("words")}>
            <MessageSquareText aria-hidden="true" />
            <span><strong>Text sentiment</strong><small>What visitors say in comments</small></span>
          </button>
        </div>
        {desk ? <fieldset className="analysis-scope">
          <legend>Feedback from</legend>
          <div>
            <label><input type="radio" name="feedback-origin" value="inside" checked={origin === "inside"} onChange={() => selectOrigin("inside")} /><span>Inside the system</span></label>
            <label><input type="radio" name="feedback-origin" value="outside" checked={origin === "outside"} onChange={() => selectOrigin("outside")} /><span>Outside ({outsideCount})</span></label>
          </div>
        </fieldset> : null}
        {!out ? <fieldset className="analysis-scope">
          <legend>Show feedback for</legend>
          <div>
            <label><input type="radio" name="feedback-scope" value="places" checked={scope === "places"} onChange={() => selectScope("places")} /><span>Individual places</span></label>
            <label><input type="radio" name="feedback-scope" value="trip" checked={scope === "trip"} onChange={() => selectScope("trip")} /><span>Overall Daet visit</span></label>
          </div>
        </fieldset> : null}
        <div className="sentiment-tools">
          <RangeSwitch value={range} onChange={setRange} />
          {desk ? <button type="button" onClick={exportCsv} className="sentiment-export"><Download size={15} aria-hidden />Export CSV</button> : null}
        </div>
      </div>
      <div className="sentiment-results-heading" aria-live="polite" aria-atomic="true">
        <div><h2>{mode === "faces" ? "Emoji rating overview" : "Comment sentiment overview"}</h2>
        <p>{origin === "outside" ? "Outside the system (other platforms)" : "Inside the system"} · {scope === "places" ? "Individual places" : "Overall Daet visit"} · {mode === "faces" ? (origin === "outside" ? "Faces from Facebook reactions, or from the comment text when it had none" : "Original visitor ratings") : "Written comments and replies"}</p></div>
        <span>{mode === "faces" ? (out ? `${fb.total} reactions` : `${townFaces.total} ratings`) : `${townWords.total} classified · ${textCount - townWords.total} unclassified`}</span>
      </div>

      {hydrated ? (
        mode === "faces" && out ? (
          <OutsideReactions pulses={scopedPulses} channels={scopedChannels} />
        ) : mode === "faces" ? (
          <div className="sentiment-charts">
            <MoodDonut d={sd} />
            {scope === "places" ? <PlaceCompare d={sd} onSelect={showPlace} /> : null}
            <MoodTrend d={sd} />
            <ReactionsCard d={sd} desk={desk} />
            <TopReacted d={sd} />
            {desk ? <><SourceChart d={sd} /><MoodHeatmap d={sd} /><WeekdayChart d={sd} /></> : null}
          </div>
        ) : (
          <div className="sentiment-charts">
            <WordMeter tally={townWords} className="sentiment-chart" />
            <TopicTone d={sd} />
            {desk ? <><TopicPlaceMatrix d={sd} /><MismatchList d={sd} /></> : null}
          </div>
        )
      ) : <div className="sentiment-charts-loading" aria-hidden />}
      {!desk && !out && (mode === "faces" ? townFaces.total : townWords.total) === 0 ? (
        <div className="sentiment-empty">
          <p><strong>Nothing to chart yet.</strong> Ratings appear here as visitors share them.</p>
          <Link href="/feedback" className="primary-link">Be the first to rate</Link>
        </div>
      ) : null}
      <details className="sentiment-method">
        <summary>About these results{mode === "words" ? ` · ${townWords.total} classified notes` : ` · ${townFaces.total} ratings`}</summary>
        <p>Summaries cover the latest 500 shared entries within the chosen time range. Overall visits and individual place ratings are calculated separately. Emoji ratings exclude replies. Topic and comment charts are keyword estimates and can misread local expressions and sarcasm.</p>
        {mode === "words" ? <p>{textCount} notes and replies checked · {townWords.total} classified · {textCount - townWords.total} without a clear sentiment match. Empty notes are excluded.</p> : null}
      </details>
      {out && mode === "faces" ? null : <>
      <h2 id="place-details" className="sentiment-details-title">{scope === "places" ? "Details by place" : "Overall visit details"}</h2>
      <div className="sentiment-layout sentiment-layout-single">
        <ul className="space-y-2" aria-label={scope === "places" ? "Results by place" : "Overall visit results"}>
          {scopedChannels.map((channel) => {
            const placePulses = ranged.filter(
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
      </>}
    </div>
  );
}
