"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { Compass, LayoutList, Radio, Send } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { to: "/spots" as const, label: "Explore", icon: Compass, match: "/spots" },
  { to: "/live" as const, label: "Live", icon: Radio, match: "/live" },
  { to: "/board" as const, label: "Board", icon: LayoutList, match: "/board" },
  { to: "/transmit" as const, label: "Share", icon: Send, match: "/transmit" },
];

export function SiteDock() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-plate/96 backdrop-blur-md lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      aria-label="Visitor dock"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4 px-2 pt-1">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.to || pathname.startsWith(item.match);
          return (
            <li key={item.to}>
              <Link
                href={item.to}
                className={cn(
                  "flex h-14 flex-col items-center justify-center gap-0.5 text-[0.7rem] font-medium",
                  active ? "text-teal" : "text-muted",
                )}
              >
                <Icon className="size-5" strokeWidth={active ? 2.4 : 1.8} />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
