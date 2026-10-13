"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { RewardBalanceLink } from "@/components/reward-preview";
import { Wordmark } from "@/components/mark";
import { cn } from "@/lib/utils";
const LINKS = [
  { to: "/feedback", label: "Feedback" },
  { to: "/spots", label: "Places" },
  { to: "/live", label: "Visitor stories" },
  { to: "/board", label: "Sentiment" },
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
        <Link href="/" aria-label="DAET-CONNECT home">
          <Wordmark />
        </Link>
        <nav
          className="hidden items-center gap-1 lg:flex"
          aria-label="Main navigation"
        >
          {process.env.NEXT_PUBLIC_DAET_CONNECT_URL?.startsWith("https://") && <a className="header-link" href={process.env.NEXT_PUBLIC_DAET_CONNECT_URL}>Main dashboard ↗</a>}
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
        <div className="flex items-center gap-2"><RewardBalanceLink />
        <Link href="/feedback" className="header-share">
          Give feedback <ArrowUpRight size={16} />
        </Link></div>
      </div>
    </header>
  );
}
