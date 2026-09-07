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
    <header className="sticky top-0 z-40 border-b border-gold/20 bg-[#07131c]/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-4">
        <Link href="/admin">
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold/80">Officer desk</p>
          <p className="font-display text-2xl tracking-tight text-sand">DAET Pulse</p>
        </Link>
        <nav className="flex flex-wrap items-center gap-2 text-sm">
          {links.map((l) => {
            const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={`rounded-full px-4 py-2 ${active ? "bg-gold font-semibold text-ink" : "text-sand/80 hover:bg-white/5"}`}>
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
