import { Link, useRouterState } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/mark";
import { useDesk } from "@/lib/pulse/desk";
import { cn } from "@/lib/utils";

const LINKS = [
  { to: "/desk" as const, label: "Home", exact: true },
  { to: "/desk/board" as const, label: "Board" },
  { to: "/desk/channels" as const, label: "Channels" },
  { to: "/desk/wishes" as const, label: "Wishes" },
  { to: "/desk/log" as const, label: "Log" },
];

export function DeskShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const lock = useDesk((s) => s.lock);

  return (
    <div className="min-h-svh bg-page text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-page/94 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-3 py-2.5 sm:px-6">
          <Link to="/desk" className="min-w-0">
            <Wordmark compact />
          </Link>
          <span className="hidden rounded-full bg-cool px-2 py-0.5 text-[0.65rem] uppercase tracking-[0.14em] text-muted sm:inline-flex">
            Desk
          </span>
          <div className="ml-auto flex shrink-0 items-center">
            <Link
              to="/"
              className="inline-flex h-11 items-center px-2.5 text-sm font-medium text-action"
            >
              Visitor site
            </Link>
            <button
              type="button"
              onClick={() => lock()}
              className="inline-flex h-11 items-center px-2.5 text-sm text-muted"
            >
              Lock
            </button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 pb-2 sm:px-5">
          {LINKS.map((link) => {
            const active = link.exact
              ? pathname === link.to
              : pathname === link.to || pathname.startsWith(`${link.to}/`);
            return (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "inline-flex h-11 shrink-0 items-center rounded-lg px-3 text-sm font-medium",
                  active ? "bg-cool text-ink" : "text-muted",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</div>
    </div>
  );
}
