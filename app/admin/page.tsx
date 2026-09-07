import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";
import { fetchAnalytics } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";
import { LivePulse } from "@/components/LivePulse";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!isAdminRequest()) redirect("/admin/login");
  const data = hasPublicEnv()
    ? await fetchAnalytics({ privileged: true })
    : {
        totalReviews: 0,
        avgRating: 0,
        spotsCount: 0,
        sentiment: { negative: 0, mixed: 0, positive: 0 },
        wording: { negative: 0, mixed: 0, positive: 0 },
        bySpot: [],
        recent: []
      };

  return (
    <div>
      <p className="eyebrow">Desk</p>
      <h1 className="mt-0.5">Officer desk</h1>
      <p className="mt-1 text-[13px] text-ink-soft">Emoji mood is official. Wording is a secondary keyword scan.</p>
      <div className="mt-3">
        <LivePulse initial={data} endpoint="/api/admin/analytics" />
      </div>
    </div>
  );
}
