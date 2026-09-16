import { createFileRoute, Outlet } from "@tanstack/react-router";
import { PublicChrome } from "@/components/public-chrome";

export const Route = createFileRoute("/board")({
  component: BoardLayout,
});

function BoardLayout() {
  return (
    <PublicChrome>
      <Outlet />
    </PublicChrome>
  );
}
