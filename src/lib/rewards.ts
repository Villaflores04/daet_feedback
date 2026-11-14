/** Preview only. Replace the award boundary with Team 11's verified server service.
 * Never import this browser ledger into a real wallet or use it as award evidence.
 */
export const FEEDBACK_PREVIEW_POINTS = 15;
const KEY = "daet-connect:feedback-reward-preview:v2";
// v1 let a browser collect unlimited points. Points are reset: the old ledger is deleted on next visit.
const OLD_KEY = "daet-connect:feedback-reward-preview:v1";
const CHANGE = "daet-connect:reward-preview-changed";
export type PreviewReward = { feedbackId: string; source: "feedback"; points: number; mode: "preview"; at?: number };

export function nextPreviewRewards(events: PreviewReward[], feedback: { id: string; parentId: string | null }): PreviewReward[] {
  // One award per device: the ledger can never hold more than one event (15 points).
  if (feedback.parentId || events.length >= 1) return events;
  return [...events, { feedbackId: feedback.id, source: "feedback", points: FEEDBACK_PREVIEW_POINTS, mode: "preview" }];
}
function readPreviewRewards(): PreviewReward[] {
  if (typeof window === "undefined") return [];
  try {
    localStorage.removeItem(OLD_KEY);
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value.filter((event): event is PreviewReward => {
      if (!event || typeof event.feedbackId !== "string" || event.mode !== "preview" || event.source !== "feedback" || event.points !== FEEDBACK_PREVIEW_POINTS || seen.has(event.feedbackId)) return false;
      seen.add(event.feedbackId); return true;
    }).slice(0, 1);
  } catch { return []; }
}
export function previewPoints() {
  return readPreviewRewards().reduce((total, event) => total + event.points, 0);
}
/** The Municipal Desk can reset everyone's points. The server keeps the time of the last reset; any
 * award earned before it is dropped from this browser the next time the balance is shown. */
function syncRewardReset() {
  fetch("/api/rewards/epoch", { cache: "no-store" }).then(r => r.ok ? r.json() : null).then(body => {
    const epoch = Number(body?.epoch);
    if (!epoch) return;
    const events = readPreviewRewards();
    const kept = events.filter(event => (event.at ?? 0) >= epoch);
    if (kept.length === events.length) return;
    localStorage.setItem(KEY, JSON.stringify(kept));
    window.dispatchEvent(new Event(CHANGE));
  }).catch(() => { /* offline: try again next time */ });
}
export function subscribePreviewPoints(update: () => void) {
  syncRewardReset();
  window.addEventListener("storage", update);
  window.addEventListener(CHANGE, update);
  return () => { window.removeEventListener("storage", update); window.removeEventListener(CHANGE, update); };
}
export function recordPreviewReward(feedback: { id: string; parentId: string | null }) {
  if (typeof window === "undefined" || feedback.parentId) return;
  try {
    const before = readPreviewRewards();
    const after = nextPreviewRewards(before, feedback);
    if (after.length > before.length) after[after.length - 1] = { ...after[after.length - 1], at: Date.now() };
    localStorage.setItem(KEY, JSON.stringify(after));
    window.dispatchEvent(new Event(CHANGE));
  } catch { /* A blocked preview ledger must never fail a saved feedback submission. */ }
}
