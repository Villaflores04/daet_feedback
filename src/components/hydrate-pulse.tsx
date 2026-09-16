import { useEffect } from "react";
import { rehydratePulse } from "@/lib/pulse/store";
import { useDesk } from "@/lib/pulse/desk";

export function HydratePulse() {
  useEffect(() => {
    rehydratePulse();
    useDesk.getState().hydrate();
  }, []);

  return null;
}
