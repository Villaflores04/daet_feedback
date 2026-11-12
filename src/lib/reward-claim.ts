import "server-only";
import { createHash, createHmac } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { FEEDBACK_PREVIEW_POINTS } from "./rewards";

/**
 * One-time reward per device. The server, not the browser, decides whether points are awarded.
 *
 * - A device earns points once, ever: the first original feedback. The claim is a row keyed by a
 *   one-way hash of the device key, so a second claim fails at the database.
 * - A network address may start at most IP_DAILY_CAP new claims per 24 hours. Only an HMAC of the
 *   address is stored. This slows spam from one network (for example repeated incognito windows)
 *   without blocking a whole venue that shares one Wi-Fi.
 *
 * Limits that remain: an anonymous system cannot recognise the same person across a private window,
 * another browser or a VPN. Tying points to one person needs a verified account.
 */
export const IP_DAILY_CAP = 10;

export type RewardResult = {
  awarded: boolean;
  points: number;
  reason?: "already" | "network-limit" | "no-device" | "unavailable";
};

function clientAddress(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || request.headers.get("x-real-ip") || "unknown";
}

export async function claimFeedbackReward(
  db: SupabaseClient,
  request: Request,
  deviceKey: unknown,
  feedbackId: string,
): Promise<RewardResult> {
  const none = (reason: NonNullable<RewardResult["reason"]>): RewardResult => ({ awarded: false, points: 0, reason });
  if (typeof deviceKey !== "string" || deviceKey.length < 16 || deviceKey.length > 80) return none("no-device");
  const deviceHash = createHash("sha256").update(`daet-reward:${deviceKey}`).digest("hex");
  const ipHash = createHmac("sha256", process.env.SUPABASE_SERVICE_ROLE_KEY || "daet")
    .update(`daet-ip:${clientAddress(request)}`).digest("hex");
  const win = { awarded: true, points: FEEDBACK_PREVIEW_POINTS } as const;
  try {
    const existing = async () => db.from("reward_claims").select("feedback_id").eq("device_hash", deviceHash).maybeSingle();
    let found = await existing();
    if (found.error) return none("unavailable");
    // A retry after a lost response is the same claim, not a second one.
    if (found.data) return found.data.feedback_id === feedbackId ? { ...win } : none("already");
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const recent = await db.from("reward_claims").select("device_hash", { count: "exact", head: true })
      .eq("ip_hash", ipHash).gte("created_at", since);
    if (recent.error) return none("unavailable");
    if ((recent.count ?? 0) >= IP_DAILY_CAP) return none("network-limit");
    const inserted = await db.from("reward_claims").insert({
      device_hash: deviceHash, ip_hash: ipHash, feedback_id: feedbackId, points: FEEDBACK_PREVIEW_POINTS,
    });
    if (!inserted.error) return { ...win };
    if (inserted.error.code === "23505") {
      found = await existing();
      return found.data?.feedback_id === feedbackId ? { ...win } : none("already");
    }
    return none("unavailable");
  } catch {
    // The feedback is already saved; a reward problem must never fail it.
    return none("unavailable");
  }
}
