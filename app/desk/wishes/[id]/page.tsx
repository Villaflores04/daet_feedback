"use client";

import { Suspense } from "react";
import { WishDetail } from "@/views/desk-wish-detail";

export default function Page() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-page" />}>
      <WishDetail />
    </Suspense>
  );
}
