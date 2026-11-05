import "server-only";
import { supabaseStorageServer } from "@/lib/supabase-server";
import type { ReportStatus, SupportContact, SupportReport } from "@/lib/support-shared";

/** Service-role client: reports are never readable with the public key. */
export const supportDb = () => supabaseStorageServer();

/** True when the Help & Support tables have not been created yet (migration not run). */
export function missingTable(error: { code?: string; message?: string } | null | undefined) {
  return Boolean(error && (error.code === "42P01" || error.code === "PGRST205" || /could not find the table|does not exist/i.test(error.message || "")));
}

export const contactFromRow = (r: Record<string, unknown>): SupportContact => ({
  id: String(r.id), kind: r.kind as SupportContact["kind"], label: String(r.label), value: String(r.value), note: String(r.note || ""), sort: Number(r.sort || 0),
});
export const reportFromRow = (r: Record<string, unknown>): SupportReport => ({
  id: String(r.id), kind: r.kind as SupportReport["kind"], area: String(r.area || "Other"), message: String(r.message), page: String(r.page || ""),
  mood: r.mood ? String(r.mood) : null, device: String(r.device || ""), contact: String(r.contact || ""), photo: r.photo ? String(r.photo) : undefined,
  status: r.status as ReportStatus, adminNote: String(r.admin_note || ""), createdAt: Date.parse(String(r.created_at)) || Date.now(),
});

/** Best-effort per-instance limiter (keeps a runaway script from flooding the inbox). */
const hits = new Map<string, number[]>();
export function tooMany(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const list = (hits.get(key) ?? []).filter(t => now - t < windowMs);
  if (list.length >= max) { hits.set(key, list); return true; }
  list.push(now); hits.set(key, list);
  if (hits.size > 2000) for (const [k, v] of hits) if (!v.some(t => now - t < windowMs)) hits.delete(k);
  return false;
}
