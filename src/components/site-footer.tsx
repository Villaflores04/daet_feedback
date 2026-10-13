import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "@/components/mark";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="page-width">
        <div className="flex flex-col justify-between gap-8 sm:flex-row">
          <div>
            <Link href="/" aria-label="DAET-CONNECT home">
              <Wordmark />
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted">
              A little closer to the places.
              <br />A little closer to the people.
            </p>
          </div>
          <nav
            className="flex flex-wrap gap-x-8 gap-y-4 text-sm"
            aria-label="Footer"
          >
            {process.env.NEXT_PUBLIC_DAET_CONNECT_URL?.startsWith("https://") && <a href={process.env.NEXT_PUBLIC_DAET_CONNECT_URL}>Main dashboard ↗</a>}
            <Link href="/feedback">Give feedback</Link>
            <Link href="/spots">Places</Link>
            <Link href="/board">Sentiment</Link>
            <Link href="/desk" className="inline-flex items-center gap-2">
              Municipal desk <ArrowUpRight size={14} />
            </Link>
          </nav>
        </div>
        <div className="mt-10 flex flex-col gap-2 border-t border-line pt-5 text-xs text-muted sm:flex-row sm:justify-between">
          <p>Daet, Camarines Norte · Philippines</p>
          <p>Visitor feedback syncs with the town database.</p>
        </div>
      </div>
    </footer>
  );
}
