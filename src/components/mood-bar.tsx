import type { MoodTally } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";

export function MoodBar({
  tally,
  className,
}: {
  tally: MoodTally;
  className?: string;
}) {
  if (tally.total === 0) {
    return (
      <div
        className={cn("h-2 w-full overflow-hidden rounded-full bg-cool", className)}
        aria-hidden
      />
    );
  }
  return (
    <div
      className={cn(
        "flex h-2 w-full overflow-hidden rounded-full bg-cool",
        className,
      )}
      aria-hidden
    >
      {tally.pos > 0 ? (
        <span
          className="h-full bg-pos"
          style={{ width: `${(tally.pos / tally.total) * 100}%` }}
        />
      ) : null}
      {tally.mix > 0 ? (
        <span
          className="h-full bg-mix"
          style={{ width: `${(tally.mix / tally.total) * 100}%` }}
        />
      ) : null}
      {tally.neg > 0 ? (
        <span
          className="h-full bg-neg"
          style={{ width: `${(tally.neg / tally.total) * 100}%` }}
        />
      ) : null}
    </div>
  );
}
