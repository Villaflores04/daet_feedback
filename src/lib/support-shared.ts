/** Shared types and small helpers for Help & Support (safe for client and server). */
export const CONTACT_KINDS = ["phone", "email", "messenger", "facebook", "other"] as const;
export type ContactKind = (typeof CONTACT_KINDS)[number];
export const CONTACT_LABELS: Record<ContactKind, string> = { phone: "Phone", email: "Email", messenger: "Messenger", facebook: "Facebook", other: "Other" };
export type SupportContact = { id: string; kind: ContactKind; label: string; value: string; note: string; sort: number };

export const REPORT_KINDS = ["bug", "improve"] as const;
export type ReportKind = (typeof REPORT_KINDS)[number];
export const REPORT_AREAS = ["Places", "Stories", "Sentiment", "Feedback", "Map", "Rewards preview", "Desk sign-in", "Other"] as const;
export const REPORT_STATUSES = ["new", "progress", "resolved"] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];
export type SupportReport = {
  id: string; kind: ReportKind; area: string; message: string; page: string; mood: string | null;
  device: string; contact: string; photo?: string; status: ReportStatus; adminNote: string; createdAt: number;
};

/** The link a visitor taps: tel:, mailto:, or the https address. Plain-text "other" entries have no link. */
export function contactHref(c: Pick<SupportContact, "kind" | "value">): string | null {
  if (c.kind === "phone") return `tel:${c.value.replace(/[^\d+]/g, "")}`;
  if (c.kind === "email") return `mailto:${c.value}`;
  return c.value.startsWith("https://") ? c.value : null;
}
