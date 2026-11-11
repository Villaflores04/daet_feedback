import { useEffect, useState } from "react";

const CALLSIGN_KEY = "daet-pulse-callsign";

export function readCallsign() {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(CALLSIGN_KEY) ?? "";
}

export function writeCallsign(name: string) {
  const next = name.trim().slice(0, 32);
  if (typeof window !== "undefined") {
    if (next) localStorage.setItem(CALLSIGN_KEY, next);
    else localStorage.removeItem(CALLSIGN_KEY);
  }
  return next;
}

export function useCallsign() {
  const [callsign, setCallsign] = useState("");
  useEffect(() => {
    setCallsign(readCallsign());
  }, []);
  return {
    callsign,
    setCallsign: (name: string) => setCallsign(writeCallsign(name)),
  };
}

const DEVICE_KEY = "daet-pulse-device";

/** A random per-browser token. The server stores only a one-way hash of it, so it cannot be used to impersonate anyone. */
export function getDeviceKey() {
  if (typeof window === "undefined") return "";
  try {
    let key = localStorage.getItem(DEVICE_KEY);
    if (!key || key.length < 16) {
      key = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}-${Math.random()}`).replace(/-/g, "");
      localStorage.setItem(DEVICE_KEY, key);
    }
    return key;
  } catch { return ""; }
}

let authorHashPromise: Promise<string> | null = null;
/** Same one-way hash the server stores, so a card can tell whether it was written from this browser. */
function myAuthorHash(): Promise<string> {
  if (authorHashPromise) return authorHashPromise;
  const key = getDeviceKey();
  if (!key || typeof crypto === "undefined" || !crypto.subtle) return Promise.resolve("");
  authorHashPromise = crypto.subtle
    .digest("SHA-256", new TextEncoder().encode(`daet-author:${key}`))
    .then((buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("").slice(0, 16))
    .catch(() => "");
  return authorHashPromise;
}

/** True when this story or reply was written from the current browser. */
export function useIsOwnPulse(authorKey?: string) {
  const [own, setOwn] = useState(false);
  useEffect(() => {
    let live = true;
    if (!authorKey) { setOwn(false); return; }
    void myAuthorHash().then((hash) => { if (live) setOwn(Boolean(hash) && hash === authorKey); });
    return () => { live = false; };
  }, [authorKey]);
  return own;
}
