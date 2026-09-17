"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  Compass,
  ChartNoAxesCombined,
  MessagesSquare,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";
const ITEMS = [
  { to: "/spots", label: "Explore", icon: Compass },
  { to: "/live", label: "Stories", icon: MessagesSquare },
  { to: "/board", label: "Town pulse", icon: ChartNoAxesCombined },
  { to: "/transmit", label: "Share", icon: Plus },
];
export function SiteDock() {
  const pathname = usePathname();
  return (
    <nav className="site-dock lg:hidden" aria-label="Visitor navigation">
      <ul>
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname.startsWith(item.to);
          return (
            <li key={item.to}>
              <Link
                href={item.to}
                aria-current={active ? "page" : undefined}
                className={cn(active && "is-active")}
              >
                <span>
                  <Icon size={21} strokeWidth={active ? 2.1 : 1.6} />
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
