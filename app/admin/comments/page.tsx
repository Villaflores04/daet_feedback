import { redirect } from "next/navigation";
import { isAdminRequest } from "@/lib/admin-auth";
import { fetchFeedback } from "@/lib/data";
import { hasPublicEnv } from "@/lib/supabase";
import { CommentManager } from "@/components/CommentManager";

export const dynamic = "force-dynamic";

export default async function AdminCommentsPage() {
  if (!isAdminRequest()) redirect("/admin/login");
  const rows = hasPublicEnv() ? await fetchFeedback() : [];
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Moderate</p>
      <h1 className="mt-2 font-display text-5xl">Comments</h1>
      <p className="mt-3 text-sand/60">
        Edit wording or delete pulses that should not stay public.
      </p>
      <div className="mt-8">
        <CommentManager initial={rows} />
      </div>
    </div>
  );
}
