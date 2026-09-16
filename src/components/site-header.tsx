"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Wordmark } from "@/components/mark";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/spots" as const, label: "Explore" },
  { to: "/live" as const, label: "Live" },
  { to: "/board" as const, label: "Board" },
  { to: "/transmit" as const, label: "Share" },
];

export function SiteHeader({
  landing = false,
  scrolled = false,
}: {
  landing?: boolean;
  scrolled?: boolean;
}) {
  const pathname = usePathname();
  const hidden = landing && !scrolled;

  return (
    <header
      className={cn(
        "z-40 transition-[background-color,box-shadow,transform,opacity] duration-200",
        landing ? "fixed inset-x-0 top-0" : "sticky top-0",
        hidden
          ? "pointer-events-none -translate-y-2 opacity-0"
          : "bg-page/92 shadow-[0_1px_0_0_var(--color-line)] backdrop-blur-md",
      )}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="DAET Pulse home">
          <Wordmark compact />
        </Link>
        <nav className="hidden items-center gap-1 lg:flex">
          {LINKS.map((link) => {
            const active =
              pathname === link.to ||
              (link.to !== "/spots" && pathname.startsWith(link.to)) ||
              (link.to === "/spots" && pathname.startsWith("/spots"));
            return (
              <Link
                key={link.to}
                href={link.to}
                className={cn(
                  "inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium",
                  active ? "bg-cool text-ink" : "text-muted hover:text-ink",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
