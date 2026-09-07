"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "./LogoutButton";

const links = [
  { href: "/admin", label: "Desk" },
  { href: "/admin/view", label: "View" },
  { href: "/admin/spots", label: "Manage" },
  { href: "/admin/comments", label: "Comments" },
  { href: "/admin/activity", label: "Activity" }
];

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden>
      <circle cx="16" cy="10.5" r="5.2" fill="var(--dp-gold)" />
      <path d="M4 19.5c3.6-3.1 7.2-4.6 12-4.6s8.4 1.5 12 4.6" fill="none" stroke="var(--dp-tide)" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 24.2c3.1-2.2 6.4-3.2 10-3.2s6.9 1 10 3.2" fill="none" stroke="var(--dp-tide)" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export function AdminNav() {
  const path = usePathname() || "";
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-shell/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center gap-3 px-3 py-2 md:px-5">
        <Link href="/admin" className="flex shrink-0 items-center gap-2">
          <Mark />
          <span>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Officer desk</p>
            <p className="font-display text-[1.05rem] leading-none text-ink">DAET Pulse</p>
          </span>
        </Link>
        <nav className="nav-scroll ml-auto">
          {links.map((l) => {
            const active = l.href === "/admin" ? path === "/admin" : path.startsWith(l.href);
            return (
              <Link key={l.href} href={l.href} className={active ? "btn-gold" : "btn-ghost"}>
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
