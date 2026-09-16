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
