"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PublicChrome } from "@/components/public-chrome";
import { BoardView } from "@/components/board-view";

function BoardInner() {
  const search = useSearchParams();
  const open = search.get("open") ?? undefined;
  return (
    <PublicChrome>
      <main id="main-content">
        <BoardView mode="faces" openSlug={open} />
      </main>
    </PublicChrome>
  );
}

export default function BoardPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-page" />}>
      <BoardInner />
    </Suspense>
  );
}
