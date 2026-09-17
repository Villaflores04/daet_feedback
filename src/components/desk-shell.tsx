"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  LayoutDashboard,
  ChartNoAxesCombined,
  MapPinned,
  Inbox,
  ScrollText,
  LockKeyhole,
  ArrowUpRight,
} from "lucide-react";
import { Wordmark } from "@/components/mark";
import { useDesk } from "@/lib/pulse/desk";
const LINKS = [
  { to: "/desk", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/desk/board", label: "Sentiment", icon: ChartNoAxesCombined },
  { to: "/desk/channels", label: "Places", icon: MapPinned },
  { to: "/desk/wishes", label: "Suggestions", icon: Inbox },
  { to: "/desk/log", label: "Activity", icon: ScrollText },
];
export function DeskShell({ children }: { children: ReactNode }) {
  const pathname = usePathname(),
    lock = useDesk((s) => s.lock);
  return (
    <div className="desk-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <aside className="desk-sidebar">
        <Link href="/desk" aria-label="Municipal desk home">
          <Wordmark compact />
        </Link>
        <nav aria-label="Municipal desk navigation">
          {LINKS.map((link) => {
            const Icon = link.icon;
            const active = link.exact
              ? pathname === link.to
              : pathname.startsWith(link.to);
            return (
              <Link
                href={link.to}
                key={link.to}
                className="desk-nav-link"
                aria-current={active ? "page" : undefined}
              >
                <Icon size={18} />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="desk-actions mt-auto pt-5">
          <Link href="/" className="desk-nav-link">
            Visitor site <ArrowUpRight size={16} />
          </Link>
          <button onClick={() => lock()} className="desk-nav-link">
            <LockKeyhole size={16} />
            Lock desk
          </button>
        </div>
      </aside>
      <main id="main-content" className="desk-content">
        {children}
      </main>
    </div>
  );
}
