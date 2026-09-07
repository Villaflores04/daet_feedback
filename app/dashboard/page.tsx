import { LivePulse } from "@/components/LivePulse";
import { fetchAnalytics } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  if (!hasPublicEnv()) {
    return (
      <div>
        <h1 className="font-display text-5xl">Town pulse</h1>
        <p className="mt-4 text-ink-soft">Connect Supabase to populate analytics.</p>
      </div>
    );
  }
  const data = await fetchAnalytics();
  return (
    <div>
      <h1 className="font-display text-4xl md:text-5xl">Town pulse</h1>
      <p className="mt-3 max-w-2xl text-ink-soft">
        Emoji Mood is official visitor sentiment. Comment Wording Mood is a secondary keyword indicator. They are calculated separately.
      </p>
      <div className="horizon-rule mt-8" />
      <div className="mt-10">
        <LivePulse initial={data} />
      </div>
    </div>
  );
}
