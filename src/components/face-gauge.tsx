import { majority, type MoodTally } from "@/lib/pulse/faces";
import { cn } from "@/lib/utils";

function arc(cx: number, cy: number, r: number, start: number, end: number) {
  const to = (angle: number) => {
    const rad = ((angle - 180) * Math.PI) / 180;
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)] as const;
  };
  const [x1, y1] = to(start);
  const [x2, y2] = to(end);
  const large = end - start > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
}

export function FaceGauge({
  tally,
  title = "Visitor ratings",
  className,
}: {
  tally: MoodTally;
  title?: string;
  className?: string;
}) {
  const mood = majority(tally);
  const segments = [
    { key: "pos", value: tally.pos, color: "var(--color-pos)" },
    { key: "mix", value: tally.mix, color: "var(--color-mix)" },
    { key: "neg", value: tally.neg, color: "var(--color-neg)" },
  ].filter((seg) => seg.value > 0);

  let cursor = 0;
  const paths = segments.map((seg) => {
    const span = (seg.value / tally.total) * 180;
    const start = cursor;
    const end = cursor + span;
    cursor = end;
    return { ...seg, start, end: Math.min(end, 180) };
  });

  const label =
    tally.total === 0
      ? "No ratings yet"
      : mood === "POS"
        ? "Mostly positive"
        : mood === "NEG"
          ? "Needs care"
          : "Mixed";

  return (
    <figure className={cn("rounded-2xl bg-plate p-5 shadow-plate", className)}>
      <figcaption className="text-sm font-medium text-ink">{title}</figcaption>
      <div className="relative mx-auto mt-2 h-36 w-64 max-w-full">
        <svg viewBox="0 0 200 120" className="h-full w-full" aria-hidden>
          <path
            d={arc(100, 108, 78, 0, 180)}
            fill="none"
            stroke="var(--color-cool)"
            strokeWidth="16"
            strokeLinecap="round"
          />
          {tally.total > 0
            ? paths.map((seg) => (
                <path
                  key={seg.key}
                  d={arc(
                    100,
                    108,
                    78,
                    seg.start + 1.2,
                    Math.max(seg.start + 1.2, seg.end - 1.2),
                  )}
                  fill="none"
                  stroke={seg.color}
                  strokeWidth="16"
                  strokeLinecap="round"
                />
              ))
            : null}
        </svg>
        <div className="absolute inset-x-0 bottom-1 text-center">
          <p className="font-display text-2xl tracking-tight text-ink">
            {label}
          </p>
          <p className="text-xs tabular-nums text-muted">
            {tally.total} {tally.total === 1 ? "rating" : "ratings"}
          </p>
        </div>
      </div>
      <ul className="mt-3 flex justify-center gap-4 text-xs tabular-nums text-muted">
        <li>
          <span className="mr-1 inline-block size-2 rounded-full bg-pos" />
          {tally.pos} up
        </li>
        <li>
          <span className="mr-1 inline-block size-2 rounded-full bg-mix" />
          {tally.mix} mixed
        </li>
        <li>
          <span className="mr-1 inline-block size-2 rounded-full bg-neg" />
          {tally.neg} down
        </li>
      </ul>
    </figure>
  );
}
