import { AnalyticsView } from "@/components/AnalyticsView";
import { fetchAnalytics } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!hasPublicEnv()) {
    return (
      <div>
        <h1 className="font-display text-5xl">Live pulse</h1>
        <p className="mt-4 text-sand/60">Connect Supabase to populate analytics.</p>
      </div>
    );
  }
  const data = await fetchAnalytics();
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Public desk</p>
      <h1 className="mt-2 font-display text-5xl">Live pulse</h1>
      <p className="mt-3 max-w-2xl text-sand/60">Anyone can read the town's tourism sentiment. Officers moderate from the tourism desk.</p>
      <div className="mt-10"><AnalyticsView data={data} /></div>
    </div>
  );
}
