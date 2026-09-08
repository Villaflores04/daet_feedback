import { fetchAnalytics, fetchSpots } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";
import { ExplorePlaces } from "@/components/ExplorePlaces";
export const dynamic="force-dynamic"; export const revalidate=0;
export default async function SpotsPage(){
  if(!hasPublicEnv()) return <div className="page-shell"><h1>Places</h1><p className="mt-2 text-sm text-[var(--muted)]">Connect Supabase to load destinations.</p></div>;
  const [spots,analytics]=await Promise.all([fetchSpots(),fetchAnalytics()]);
  return <ExplorePlaces spots={spots} analytics={analytics}/>;
}