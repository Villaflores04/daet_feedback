import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/board/faces/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/board", search: { open: params.slug } });
  },
  component: () => null,
});
