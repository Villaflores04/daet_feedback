"use client";

import { useEffect, useState } from "react";
import type { Analytics } from "@/lib/types";
import { AnalyticsView } from "./AnalyticsView";

export function LivePulse({ initial }: { initial: Analytics }) {
  const [data, setData] = useState(initial);
  useEffect(() => {
    let on = true;
    fetch("/api/analytics", { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (on && json && typeof json.totalReviews === "number") setData(json);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);
  return <AnalyticsView data={data} />;
}
