"use client";
import { useEffect, useState } from "react";

/** Number of unread Help & Support reports for the desk badge. Fails quietly (for example before the SQL has been run). */
export function useNewReports(refreshKey: string) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let live = true;
    const load = () => fetch("/api/desk/support/reports?status=new", { cache: "no-store" })
      .then(r => (r.ok ? r.json() : null))
      .then(b => { if (live && b && typeof b.newCount === "number") setCount(b.newCount); })
      .catch(() => {});
    load();
    const timer = window.setInterval(load, 60000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    window.addEventListener("desk-support-changed", onFocus);
    return () => { live = false; clearInterval(timer); window.removeEventListener("focus", onFocus); window.removeEventListener("desk-support-changed", onFocus); };
  }, [refreshKey]);
  return count;
}
