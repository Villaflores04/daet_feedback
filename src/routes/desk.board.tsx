import { createFileRoute } from "@tanstack/react-router";
import { BoardView } from "@/components/board-view";

type Search = { tab?: "faces" | "words"; open?: string };

export const Route = createFileRoute("/desk/board")({
  validateSearch: (raw: Record<string, unknown>): Search => {
    const next: Search = {};
    if (raw.tab === "words") next.tab = "words";
    if (typeof raw.open === "string" && raw.open) next.open = raw.open;
    return next;
  },
  component: DeskBoard,
});

function DeskBoard() {
  const { tab, open } = Route.useSearch();
  return (
    <div className="-mx-4 sm:-mx-6">
      <BoardView
        mode={tab === "words" ? "words" : "faces"}
        openSlug={open}
        desk
      />
    </div>
  );
}
