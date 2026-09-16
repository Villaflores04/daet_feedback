"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Wordmark } from "@/components/mark";
import { FACES } from "@/lib/pulse/faces";
import { cn } from "@/lib/utils";

const BOOT_KEY = "daet-pulse-booted";

export function BootSplash({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<"boot" | "leaving" | "app">("boot");

  useEffect(() => {
    if (sessionStorage.getItem(BOOT_KEY) === "1") {
      setPhase("app");
      return;
    }
    const hold = window.setTimeout(() => setPhase("leaving"), 2100);
    return () => window.clearTimeout(hold);
  }, []);

  useEffect(() => {
    if (phase !== "leaving") return;
    const done = window.setTimeout(() => {
      sessionStorage.setItem(BOOT_KEY, "1");
      setPhase("app");
    }, 520);
    return () => window.clearTimeout(done);
  }, [phase]);

  return (
    <>
      {children}
      {phase !== "app" ? (
        <div
          className={cn(
            "fixed inset-0 z-[90] bg-page",
            phase === "leaving" && "boot-leave",
          )}
          suppressHydrationWarning
        >
          <img
            src="/hero.jpg"
            alt=""
            className="boot-photo absolute inset-0 h-full w-full object-cover object-[center_68%]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-page via-page/82 to-ink/20" />
          <div className="relative mx-auto flex min-h-svh max-w-6xl flex-col justify-end px-4 pb-16 pt-16 sm:px-6 lg:justify-center lg:pb-20">
            <div className="rise max-w-md">
              <Wordmark />
              <h1 className="mt-6 font-display text-[2.05rem] leading-[1.12] tracking-[-0.03em] text-ink sm:text-4xl">
                See Daet through the eyes of its visitors.
              </h1>
              <p className="mt-3 text-base text-muted">
                Discover places. Share how they felt.
              </p>
              <div className="mt-6 rounded-2xl bg-plate p-4 shadow-plate">
                <p className="text-sm font-medium text-muted">
                  Official faces of the town
                </p>
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {FACES.map((face) => (
                    <span
                      key={face.id}
                      className="flex flex-col items-center gap-1 rounded-xl bg-cool py-2"
                    >
                      <span className="text-2xl leading-none" aria-hidden>
                        {face.glyph}
                      </span>
                      <span className="text-[0.65rem] text-muted">
                        {face.label}
                      </span>
                    </span>
                  ))}
                </div>
                <div className="mt-4">
                  <div className="h-1 overflow-hidden rounded-full bg-cool">
                    <span className="boot-bar block h-full rounded-full bg-teal" />
                  </div>
                  <p className="mt-2 text-[0.7rem] uppercase tracking-[0.16em] text-muted">
                    Opening Pulse
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
