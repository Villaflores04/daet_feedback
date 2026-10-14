import type { MoodTally } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export function WordMeter({
  tally,
  title = "Sentiment in visitor notes",
  className,
}: {
  tally: MoodTally;
  title?: string;
  className?: string;
}) {
  const rows = [
    { key: "pos", label: "Positive", value: tally.pos, color: "bg-pos" },
    { key: "mix", label: "Mixed / OK", value: tally.mix, color: "bg-mix" },
    { key: "neg", label: "Negative", value: tally.neg, color: "bg-neg" },
  ];
  const total = Math.max(1, tally.total);

  return (
    <figure className={cn("rounded-2xl bg-plate p-5 shadow-plate", className)}>
      <figcaption className="text-sm font-medium text-ink">{title}</figcaption>
      <p className="word-meter-explainer mt-1 text-xs text-muted">
        Estimated from words and negation in notes and replies. Local expressions and sarcasm
        may be misunderstood.
      </p>
      <ul className="mt-5 space-y-3">
        {rows.map((row) => (
          <li
            key={row.key}
            className="grid grid-cols-[5rem_1fr_4rem] items-center gap-2"
          >
            <span className="text-sm text-muted">{row.label}</span>
            <div className="h-3 overflow-hidden rounded-full bg-cool">
              <span
                className={cn("block h-full rounded-full", row.color)}
                style={{ width: `${(row.value / total) * 100}%` }}
              />
            </div>
            <span className="text-right text-sm tabular-nums text-ink">
              {row.value} · {Math.round(row.value / total * 100)}%
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs tabular-nums text-muted">
        {tally.total === 0 ? "No classified comments in this scope yet." : `${tally.total} classified comments · bars show their percentage share`}
      </p>
    </figure>
  );
}
