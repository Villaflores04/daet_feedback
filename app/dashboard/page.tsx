import { LivePulse } from "@/components/LivePulse";
import { fetchAnalytics } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardPage() {
  if (!hasPublicEnv()) {
    return (
      <div>
        <h1>Town pulse</h1>
        <p className="mt-1 text-[13px] text-ink-soft">Connect Supabase to populate analytics.</p>
      </div>
    );
  }
  const data = await fetchAnalytics();
  return (
    <div>
      <p className="eyebrow">Town pulse</p>
      <h1 className="mt-0.5">How Daet feels</h1>
      <p className="mt-1 max-w-xl text-[13px] text-ink-soft">
        Emoji Mood is official visitor sentiment. Comment Wording Mood is a secondary keyword indicator. They stay separate.
      </p>
      <div className="mt-3">
        <LivePulse initial={data} />
      </div>
    </div>
  );
}
