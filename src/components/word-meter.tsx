import type { MoodTally } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export function WordMeter({
  tally,
  title = "Words in notes — not the official face.",
  className,
}: {
  tally: MoodTally;
  title?: string;
  className?: string;
}) {
  const rows = [
    { key: "pos", label: "Up", value: tally.pos, color: "bg-pos" },
    { key: "mix", label: "Mixed", value: tally.mix, color: "bg-mix" },
    { key: "neg", label: "Down", value: tally.neg, color: "bg-neg" },
  ];
  const max = Math.max(1, tally.pos, tally.mix, tally.neg);

  return (
    <figure className={cn("rounded-2xl bg-plate p-5 shadow-plate", className)}>
      <figcaption className="text-sm font-medium text-ink">{title}</figcaption>
      <p className="mt-1 text-xs text-muted">
        Keyword scan of comment bodies only. Bicol, Tagalog, and sarcasm can miss.
      </p>
      <ul className="mt-5 space-y-3">
        {rows.map((row) => (
          <li key={row.key} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2">
            <span className="text-sm text-muted">{row.label}</span>
            <div className="h-3 overflow-hidden rounded-full bg-cool">
              <span
                className={cn("block h-full rounded-full", row.color)}
                style={{ width: `${(row.value / max) * 100}%` }}
              />
            </div>
            <span className="text-right text-sm tabular-nums text-ink">
              {row.value}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs tabular-nums text-muted">
        {tally.total} scanned {tally.total === 1 ? "note" : "notes"}
      </p>
    </figure>
  );
}
