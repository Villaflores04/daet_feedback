import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";
import { fetchSpots } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";
import { SpotManager } from "@/components/SpotManager";

export const dynamic = "force-dynamic";

export default async function AdminSpotsPage() {
  if (!isAdminRequest()) redirect("/admin/login");
  const spots = hasPublicEnv() ? await fetchSpots() : [];
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-gold">CRUD</p>
      <h1 className="mt-2 font-display text-5xl">Tourism spots</h1>
      <p className="mt-3 text-sand/60">Insert, edit, or remove places the public can rate.</p>
      <div className="mt-8"><SpotManager initial={spots} /></div>
    </div>
  );
}
