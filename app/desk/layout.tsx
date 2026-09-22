"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { DeskShell } from "@/components/desk-shell";
import { useDesk } from "@/lib/pulse/desk";

export default function DeskLayout({ children }: { children: ReactNode }) {
  const ready = useDesk((s) => s.ready);
  const unlocked = useDesk((s) => s.unlocked);
  const opening = useDesk((s) => s.opening);
  const setOpening = useDesk((s) => s.setOpening);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => setOpening(false), 700);
    return () => window.clearTimeout(timer);
  }, [opening, setOpening]);

  useEffect(() => {
    if (ready && !unlocked && pathname !== "/desk") {
      router.replace("/desk");
    }
  }, [ready, unlocked, pathname, router]);

  if (!ready) {
    return <div className="min-h-svh bg-page" />;
  }

  if (!unlocked) {
    return pathname === "/desk" ? <>{children}</> : <p className="p-6">Opening admin sign-in…</p>;
  }

  return (
    <DeskShell>
      {opening ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-page/70">
          <p className="rounded-full bg-ink px-4 py-2 text-sm text-plate">
            Opening desk…
          </p>
        </div>
      ) : null}
      {children}
    </DeskShell>
  );
}
