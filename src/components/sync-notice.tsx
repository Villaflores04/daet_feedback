"use client";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { usePulse } from "@/lib/pulse/store";
export function SyncNotice() {
  const status = usePulse(s => s.syncStatus);
  const error = usePulse(s => s.syncError);
  const [retrying, setRetrying] = useState(false);
  if (status !== "error" && status !== "partial") return null;
  return <aside className="sync-notice" role="status">
    <div><strong>{status === "partial" ? "Some shared data could not refresh" : "Shared data is temporarily unavailable"}</strong>
      <p>{error} Last loaded data is kept on this browser; the page may be incomplete.</p>
    </div>
    <button type="button" disabled={retrying} onClick={async () => {
      setRetrying(true); try { await usePulse.getState().syncShared(); } finally { setRetrying(false); }
    }}><RefreshCw size={16} />{retrying ? "Retrying…" : "Retry"}</button>
  </aside>;
}
