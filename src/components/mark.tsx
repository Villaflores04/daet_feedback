import { cn } from "@/lib/utils";

export function PulseMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <circle cx="16" cy="16" r="15" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M6 18.2c2.1-1.5 3.4-5 5.1-5 2.1 0 2.5 6.4 4.9 6.4 2.1 0 2.9-5.2 5.3-5.2 1.5 0 2.7 1.9 4.3 3.5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <circle cx="16" cy="10.6" r="1.35" fill="currentColor" />
    </svg>
  );
}

export function Wordmark({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-ink", className)}>
      <PulseMark className="size-9 text-teal" />
      <span className="leading-none">
        <span className="block font-display text-[1.2rem] font-semibold tracking-[-0.03em]">
          DAET Pulse
        </span>
        {compact ? null : (
          <span className="mt-0.5 block text-[0.65rem] uppercase tracking-[0.18em] text-muted">
            Places. People. Perspective.
          </span>
        )}
      </span>
    </span>
  );
}
