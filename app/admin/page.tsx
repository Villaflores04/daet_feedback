import Link from "next/link";
import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";
import { fetchAnalytics } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";
import { AnalyticsView } from "@/components/AnalyticsView";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  if (!isAdminRequest()) redirect("/admin/login");
  const data = hasPublicEnv()
    ? await fetchAnalytics()
    : { totalReviews: 0, avgRating: 0, spotsCount: 0, sentiment: { negative: 0, mixed: 0, positive: 0 }, bySpot: [], recent: [] };

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">Authenticated</p>
          <h1 className="mt-2 font-display text-5xl">Officer desk</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/spots" className="rounded-full bg-gold px-4 py-2 text-sm font-semibold text-ink">Manage spots</Link>
          <Link href="/admin/comments" className="rounded-full border border-white/15 px-4 py-2 text-sm">Moderate comments</Link>
          <LogoutButton />
        </div>
      </div>
      <div className="mt-10"><AnalyticsView data={data} /></div>
    </div>
  );
}
