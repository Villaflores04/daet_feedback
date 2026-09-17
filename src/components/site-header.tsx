"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Wordmark } from "@/components/mark";
import { cn } from "@/lib/utils";
const LINKS = [
  { to: "/spots", label: "Explore" },
  { to: "/live", label: "Visitor stories" },
  { to: "/board", label: "Town pulse" },
];
export function SiteHeader({
  landing = false,
  scrolled = false,
}: {
  landing?: boolean;
  scrolled?: boolean;
}) {
  const pathname = usePathname();
  return (
    <header
      className={cn(
        "site-header",
        landing && "site-header-landing",
        scrolled && "is-scrolled",
      )}
    >
      <div className="page-width flex h-[76px] items-center justify-between gap-4">
        <Link href="/" aria-label="DAET Pulse home">
          <Wordmark />
        </Link>
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {LINKS.map((link) => (
            <Link
              href={link.to}
              key={link.to}
              aria-current={pathname.startsWith(link.to) ? "page" : undefined}
              className={cn(
                "header-link",
                pathname.startsWith(link.to) && "is-active",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link href="/transmit" className="header-share">
          Share a moment <ArrowUpRight size={16} />
        </Link>
      </div>
    </header>
  );
}
