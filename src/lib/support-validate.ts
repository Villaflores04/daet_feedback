import { CONTACT_KINDS, REPORT_AREAS, REPORT_KINDS, type ContactKind, type ReportKind } from "./support-shared";

type Ok<T> = { ok: true; value: T };
type Bad = { ok: false; error: string };
const clean = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max) : "");

const MESSENGER_HOSTS = new Set(["m.me", "messenger.com", "www.messenger.com"]);
const FACEBOOK_HOSTS = new Set(["facebook.com", "www.facebook.com", "m.facebook.com", "web.facebook.com", "fb.com", "www.fb.com", "fb.me"]);

function httpsUrl(raw: string, hosts?: Set<string>): URL | null {
  try {
    const url = new URL(/^[a-z]+:\/\//i.test(raw) ? raw : `https://${raw}`);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    if (hosts && !hosts.has(url.hostname.toLowerCase())) return null;
    return url;
  } catch { return null; }
}

export function cleanContact(input: unknown): Ok<{ kind: ContactKind; label: string; value: string; note: string }> | Bad {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const kind = CONTACT_KINDS.find(k => k === o.kind);
  if (!kind) return { ok: false, error: "Choose what kind of contact this is." };
  const label = clean(o.label, 60);
  if (label.length < 2) return { ok: false, error: "Add a short name, for example “Tourism Office”." };
  const note = clean(o.note, 120);
  const raw = clean(o.value, 200);
  if (!raw) return { ok: false, error: "Enter the contact detail." };
  let value = "";
  if (kind === "phone") {
    const digits = raw.replace(/\D/g, "");
    if (!/^\+?[\d\s()\-]{7,24}$/.test(raw) || digits.length < 7 || digits.length > 15) return { ok: false, error: "Enter a valid phone number, for example +63 912 345 6789." };
    value = raw;
  } else if (kind === "email") {
    value = raw.toLowerCase();
    if (!/^[^\s@<>"]{1,64}@[^\s@<>"]+\.[^\s@<>"]{2,}$/.test(value) || value.length > 120) return { ok: false, error: "Enter a valid email address." };
  } else if (kind === "messenger") {
    const bare = /^[A-Za-z0-9.]{3,60}$/.test(raw) ? `https://m.me/${raw}` : raw;
    const url = httpsUrl(bare, MESSENGER_HOSTS);
    if (!url || url.pathname.length < 2) return { ok: false, error: "Use a Messenger link such as https://m.me/yourpage, or just the page username." };
    value = `https://${url.hostname}${url.pathname}`.replace(/\/$/, "");
  } else if (kind === "facebook") {
    const bare = /^[A-Za-z0-9.]{3,60}$/.test(raw) ? `https://facebook.com/${raw}` : raw;
    const url = httpsUrl(bare, FACEBOOK_HOSTS);
    if (!url || (url.pathname.length < 2 && !url.search)) return { ok: false, error: "Use a Facebook page or profile link, for example https://facebook.com/yourpage." };
    value = `https://${url.hostname}${url.pathname}${url.search}`.slice(0, 200);
  } else {
    const url = /^https?:\/\//i.test(raw) ? httpsUrl(raw) : null;
    if (/^http:\/\//i.test(raw)) return { ok: false, error: "Links must start with https://." };
    if (/^[a-z][a-z0-9+.-]*:/i.test(raw) && !url) return { ok: false, error: "Only https:// links or plain text are allowed." };
    value = url ? url.toString().slice(0, 200) : raw;
  }
  return { ok: true, value: { kind, label, value, note } };
}

export function cleanReport(input: unknown): Ok<{ kind: ReportKind; area: string; message: string; page: string; mood: string | null; device: string; contact: string; photo: string | null }> | Bad {
  const o = (input && typeof input === "object" ? input : {}) as Record<string, unknown>;
  const kind = REPORT_KINDS.find(k => k === o.kind);
  if (!kind) return { ok: false, error: "Choose whether this is a problem or an improvement idea." };
  const message = clean(o.message, 2000);
  if (message.length < 10) return { ok: false, error: "Please write at least a short sentence (10 characters or more)." };
  const area = REPORT_AREAS.find(a => a === o.area) ?? "Other";
  const page = typeof o.page === "string" && /^\/[A-Za-z0-9\-_/]{0,118}$/.test(o.page.split(/[?#]/)[0]) ? o.page.split(/[?#]/)[0] : "";
  const mood = typeof o.mood === "string" && ["wow", "happy", "medium", "sad"].includes(o.mood) ? o.mood : null;
  const photo = typeof o.photo === "string" && /^[a-zA-Z0-9_-]{8,120}$/.test(o.photo) ? o.photo : null;
  return { ok: true, value: { kind, area, message, page, mood, device: clean(o.device, 200), contact: clean(o.contact, 120), photo } };
}
