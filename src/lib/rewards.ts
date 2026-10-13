/** Preview only. Replace the award boundary with Team 11's verified server service.
 * Never import this browser ledger into a real wallet or use it as award evidence.
 */
export const FEEDBACK_PREVIEW_POINTS = 15;
const KEY = "daet-connect:feedback-reward-preview:v1";
const CHANGE = "daet-connect:reward-preview-changed";
export type PreviewReward = { feedbackId: string; source: "feedback"; points: number; mode: "preview" };

export function nextPreviewRewards(events: PreviewReward[], feedback: { id: string; parentId: string | null }): PreviewReward[] {
  if (feedback.parentId || events.some(event => event.feedbackId === feedback.id)) return events;
  return [...events, { feedbackId: feedback.id, source: "feedback", points: FEEDBACK_PREVIEW_POINTS, mode: "preview" }];
}
function readPreviewRewards(): PreviewReward[] {
  if (typeof window === "undefined") return [];
  try {
    const value: unknown = JSON.parse(localStorage.getItem(KEY) || "[]");
    if (!Array.isArray(value)) return [];
    const seen = new Set<string>();
    return value.filter((event): event is PreviewReward => {
      if (!event || typeof event.feedbackId !== "string" || event.mode !== "preview" || event.source !== "feedback" || event.points !== FEEDBACK_PREVIEW_POINTS || seen.has(event.feedbackId)) return false;
      seen.add(event.feedbackId); return true;
    });
  } catch { return []; }
}
export function previewPoints() {
  return readPreviewRewards().reduce((total, event) => total + event.points, 0);
}
export function subscribePreviewPoints(update: () => void) {
  window.addEventListener("storage", update);
  window.addEventListener(CHANGE, update);
  return () => { window.removeEventListener("storage", update); window.removeEventListener(CHANGE, update); };
}
export function recordPreviewReward(feedback: { id: string; parentId: string | null }) {
  if (typeof window === "undefined" || feedback.parentId) return;
  try {
    localStorage.setItem(KEY, JSON.stringify(nextPreviewRewards(readPreviewRewards(), feedback)));
    window.dispatchEvent(new Event(CHANGE));
  } catch { /* A blocked preview ledger must never fail a saved feedback submission. */ }
}
