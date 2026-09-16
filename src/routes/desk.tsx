import { useEffect } from "react";
import { createFileRoute, Navigate, Outlet, useRouterState } from "@tanstack/react-router";
import { DeskShell } from "@/components/desk-shell";
import { useDesk } from "@/lib/pulse/desk";

export const Route = createFileRoute("/desk")({
  component: DeskLayout,
});

function DeskLayout() {
  const ready = useDesk((s) => s.ready);
  const unlocked = useDesk((s) => s.unlocked);
  const opening = useDesk((s) => s.opening);
  const setOpening = useDesk((s) => s.setOpening);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!opening) return;
    const timer = window.setTimeout(() => setOpening(false), 700);
    return () => window.clearTimeout(timer);
  }, [opening, setOpening]);

  if (!ready) {
    return <div className="min-h-svh bg-page" />;
  }

  if (!unlocked && pathname !== "/desk") {
    return <Navigate to="/desk" />;
  }

  if (!unlocked) {
    return <Outlet />;
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
      <Outlet />
    </DeskShell>
  );
}
