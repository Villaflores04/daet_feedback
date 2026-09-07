import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";
import { fetchSpots } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";
import { SpotManager } from "@/components/SpotManager";

export const dynamic = "force-dynamic";

export default async function AdminSpotsPage() {
  if (!isAdminRequest()) redirect("/admin/login");
  const spots = hasPublicEnv() ? await fetchSpots({ privileged: true }) : [];
  return (
    <div>
      <p className="eyebrow">Manage</p>
      <h1 className="mt-0.5">Tourism spots</h1>
      <p className="mt-1 text-[13px] text-ink-soft">Insert, edit, or remove places the public can pulse.</p>
      <div className="mt-3">
        <SpotManager initial={spots} />
      </div>
    </div>
  );
}
