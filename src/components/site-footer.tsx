import { Link } from "@tanstack/react-router";
import { PulseMark } from "@/components/mark";

export function SiteFooter() {
  return (
    <footer className="border-t border-line px-4 pt-6 pb-dock sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-relaxed text-muted">
          Municipality of Daet, Camarines Norte. Faces stay on this device.
        </p>
        <Link
          to="/desk"
          className="inline-flex h-10 items-center gap-2 text-xs uppercase tracking-[0.16em] text-muted"
        >
          <PulseMark className="size-4" />
          Municipal desk
        </Link>
      </div>
    </footer>
  );
}
