"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { PublicChrome } from "@/components/public-chrome";
import { BoardView } from "@/components/board-view";

function WordsInner() {
  const search = useSearchParams();
  const open = search.get("open") ?? undefined;
  return (
    <PublicChrome>
      <main>
        <BoardView mode="words" openSlug={open} />
      </main>
    </PublicChrome>
  );
}

export default function BoardWordsPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-page" />}>
      <WordsInner />
    </Suspense>
  );
}
