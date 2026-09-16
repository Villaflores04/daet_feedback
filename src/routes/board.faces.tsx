import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/board/faces")({
  beforeLoad: () => {
    throw redirect({ to: "/board" });
  },
  component: () => null,
});
