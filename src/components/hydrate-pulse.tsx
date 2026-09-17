"use client";

import { useEffect } from "react";
import { rehydratePulse, usePulse } from "@/lib/pulse/store";
import { useDesk } from "@/lib/pulse/desk";

export function HydratePulse() {
  useEffect(() => {
    void rehydratePulse();
    useDesk.getState().hydrate();
    const poll = window.setInterval(() => {
      void usePulse.getState().syncShared();
    }, 10_000);
    const refresh = () => void usePulse.getState().syncShared();
    window.addEventListener("focus", refresh);
    return () => {
      window.clearInterval(poll);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  return null;
}
