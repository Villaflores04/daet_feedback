import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";
import { fetchFeedback, fetchSpots } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";
import { CommentManager } from "@/components/CommentManager";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  if (!isAdminRequest()) redirect("/admin/login");
  const [rows, spots] = hasPublicEnv()
    ? await Promise.all([fetchFeedback(undefined, { privileged: true }), fetchSpots({ privileged: true })])
    : [[], []];
  return (
    <div>
      <p className="eyebrow">Moderate</p>
      <h1 className="mt-0.5">Comments</h1>
      <p className="mt-1 text-[13px] text-ink-soft">Filter by tourism spot first, then mood.</p>
      <div className="mt-3">
        <CommentManager initial={rows} spots={spots} />
      </div>
    </div>
  );
}
