import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/board/words/$slug")({
  beforeLoad: ({ params }) => {
    throw redirect({ to: "/board/words", search: { open: params.slug } });
  },
  component: () => null,
});
