"use client";
import { useEffect, useState } from "react";
import type { Analytics } from "@/lib/types";
import { AnalyticsView } from "./AnalyticsView";

export function LivePulse({ initial, endpoint = "/api/analytics" }: { initial: Analytics; endpoint?: string }) {
  const [data, setData] = useState(initial);
  useEffect(() => {
    let on = true;
    async function refresh() {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        const json = await res.json();
        if (on && json && typeof json.totalReviews === "number") setData(json);
      } catch {}
    }
    refresh();
    const timer = window.setInterval(refresh, 12000);
    return () => { on = false; window.clearInterval(timer); };
  }, [endpoint]);
  return <AnalyticsView data={data} />;
}
