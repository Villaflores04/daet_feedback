"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { BoardView } from "@/components/board-view";

function DeskBoardInner() {
  const search = useSearchParams();
  const tab = search.get("tab");
  const open = search.get("open") ?? undefined;
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

export default function DeskBoardPage() {
  return (
    <Suspense fallback={<div className="min-h-40 bg-page" />}>
      <DeskBoardInner />
    </Suspense>
  );
}
