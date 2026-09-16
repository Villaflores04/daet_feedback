"use client";

import { useEffect, useState, type ReactNode } from "react";

const BOOT_KEY = "daet-pulse-booted";

export function BootSplash({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"boot" | "app">("boot");

  useEffect(() => {
    if (sessionStorage.getItem(BOOT_KEY) === "1") {
      setPhase("app");
      return;
    }
    const timer = window.setTimeout(() => {
      sessionStorage.setItem(BOOT_KEY, "1");
      setPhase("app");
    }, 1300);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      {phase === "boot" ? (
        <div
          className="fixed inset-0 z-[90] bg-page"
          suppressHydrationWarning
        >
          <img
            src="/splash.jpg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover object-[center_42%]"
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/55 to-transparent px-6 pb-10 pt-24">
            <div className="mx-auto h-1.5 max-w-xs overflow-hidden rounded-full bg-plate/30">
              <span className="boot-bar block h-full rounded-full bg-plate" />
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
