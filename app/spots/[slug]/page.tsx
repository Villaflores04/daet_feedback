"use client";

import { Suspense } from "react";
import { SpotPage } from "@/views/spot-page";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-page" />}>
      <SpotPage />
    </Suspense>
  );
}
