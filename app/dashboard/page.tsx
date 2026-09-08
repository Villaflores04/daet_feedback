import { LivePulse } from "@/components/LivePulse";
import { fetchAnalytics } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";
export const dynamic="force-dynamic"; export const revalidate=0;
export default async function DashboardPage(){if(!hasPublicEnv())return <div className="page-shell"><h1>Town pulse</h1><p className="mt-2 text-sm text-[var(--muted)]">Connect Supabase to populate analytics.</p></div>;const data=await fetchAnalytics();return <div className="page-shell pb-12"><p className="eyebrow">Public intelligence</p><h1 className="mt-3">The town pulse.</h1><p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">A living view of visitor sentiment across Daet. Emoji Mood is official; Comment Wording Mood remains a separate secondary signal.</p><div className="mt-8"><LivePulse initial={data}/></div></div>}
