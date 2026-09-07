import { supabaseAdmin } from "./supabase";

export async function logAdmin(action: string, targetType?: string, targetId?: string, detail?: string) {
  try {
    await supabaseAdmin().from("admin_events").insert({
      actor: "tourism-desk",
      action,
      target_type: targetType || null,
      target_id: targetId || null,
      detail: detail || null
    });
  } catch {
    // Table missing until step2_4.sql is run.
  }
}
