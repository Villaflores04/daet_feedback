import { createFileRoute } from "@tanstack/react-router";
import { BoardView } from "@/components/board-view";

type Search = { open?: string };

export const Route = createFileRoute("/board/")({
  validateSearch: (raw: Record<string, unknown>): Search => {
    if (typeof raw.open === "string" && raw.open) return { open: raw.open };
    return {};
  },
  component: BoardIndex,
});

function BoardIndex() {
  const { open } = Route.useSearch();
  return (
    <main>
      <BoardView mode="faces" openSlug={open} />
    </main>
  );
}
