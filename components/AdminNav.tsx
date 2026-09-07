"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

const links = [
  { href: "/admin", label: "Desk" },
  { href: "/admin/view", label: "View spots" },
  { href: "/admin/spots", label: "Manage" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/activity", label: "Activity" }
];

export function AdminNav() {
  const path = usePathname() || "";
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-shell">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3 md:px-5 md:py-4">
        <Link href="/admin">
          <p className="text-[10px] uppercase tracking-[0.2em] text-ink-soft">Officer desk</p>
          <p className="font-display text-xl tracking-tight text-ink md:text-2xl">DAET Pulse</p>
        </Link>
        <nav className="flex flex-wrap items-center gap-1 text-sm">
          {links.map((l) => {
            const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={`rounded-full px-3 py-1.5 md:px-4 md:py-2 ${active ? "bg-gold font-semibold text-white" : "text-ink-soft hover:bg-paper"}`}>
                {l.label}
              </Link>
            );
          })}
          <LogoutButton />
        </nav>
      </div>
    </header>
  );
}
