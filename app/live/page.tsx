"use client";

import { Suspense } from "react";
import { LivePage } from "@/views/live-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-page" />}>
      <LivePage />
    </Suspense>
  );
}
