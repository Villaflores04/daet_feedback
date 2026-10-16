"use client";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { Gift } from "lucide-react";
import { FEEDBACK_PREVIEW_POINTS, previewPoints, subscribePreviewPoints } from "@/lib/rewards";
const serverPoints = () => 0;
export function RewardPreview({ compact = false }: { compact?: boolean }) {
  const total = useSyncExternalStore(subscribePreviewPoints, previewPoints, serverPoints);
  return <section className={compact ? "reward-preview reward-preview-compact" : "reward-preview"} aria-label="Reward points preview">
    <div className="reward-preview-icon"><Gift size={22} /></div>
    <div className="reward-preview-copy">
      <p className="reward-preview-label">Rewards preview</p>
      <p className="reward-preview-value" aria-live="polite">{total}<span> demo points</span></p>
      <p>+{FEEDBACK_PREVIEW_POINTS} for each saved feedback.</p>
      {!compact && <small>Placeholder balance on this browser. Not redeemable or connected to the main wallet yet.</small>}
      {compact && <small>Demo only · Main wallet integration coming soon</small>}
    </div>
  </section>;
}

export function RewardBalanceLink() {
  const total = useSyncExternalStore(subscribePreviewPoints, previewPoints, serverPoints);
  return <Link href="/rewards" className="reward-balance-link" aria-label={`${total} demo reward points. View points and rewards information.`}><Gift size={16} /><span><strong>{total} pts</strong><small>Demo points</small></span></Link>;
}
