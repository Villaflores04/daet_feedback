"use client";

import { useEffect, useState } from "react";
import type { Analytics } from "@/lib/types";
import { AnalyticsView } from "./AnalyticsView";

export function LivePulse({ initial, endpoint = "/api/analytics" }: { initial: Analytics; endpoint?: string }) {
  const [data, setData] = useState(initial);
  useEffect(() => {
    let on = true;
    fetch(endpoint, { cache: "no-store" })
      .then((r) => r.json())
      .then((json) => {
        if (on && json && typeof json.totalReviews === "number") setData(json);
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, [endpoint]);
  return <AnalyticsView data={data} />;
}
