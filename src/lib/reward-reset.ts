import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";

/** Marker row inside reward_claims: its created_at is the time of the last reset (no extra table). */
const MARKER = "__reset__";

export async function resetAllRewards(db: SupabaseClient) {
  const wiped = await db.from("reward_claims").delete().neq("device_hash", MARKER);
  if (wiped.error) throw wiped.error;
  const at = new Date().toISOString();
  const marked = await db.from("reward_claims").upsert({ device_hash: MARKER, ip_hash: "reset", feedback_id: "reset", points: 0, created_at: at });
  if (marked.error) throw marked.error;
  return at;
}

export async function lastRewardReset(db: SupabaseClient): Promise<number> {
  const { data } = await db.from("reward_claims").select("created_at").eq("device_hash", MARKER).maybeSingle();
  const t = data?.created_at ? Date.parse(String(data.created_at)) : 0;
  return Number.isFinite(t) ? t : 0;
}
