import type { Source } from "./types";

/** Sources a public link may tag. Staff-only sources (walk-in) are not accepted from links. */
export const LINK_SOURCES: Source[] = ["facebook", "google", "tripadvisor", "survey", "qr", "other"];
const KEY = "connect-daet:src";

/** Remembers ?src=... from a shared link for this browser session, so it survives the trip from the landing page to the feedback form. */
export function captureSourceTag() {
  try {
    const raw = new URLSearchParams(window.location.search).get("src")?.toLowerCase();
    if (raw && (LINK_SOURCES as string[]).includes(raw)) sessionStorage.setItem(KEY, raw);
  } catch {
    /* storage can be blocked; feedback then counts as site feedback */
  }
}

export function getSourceTag(): Source | undefined {
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw && (LINK_SOURCES as string[]).includes(raw) ? (raw as Source) : undefined;
  } catch {
    return undefined;
  }
}
