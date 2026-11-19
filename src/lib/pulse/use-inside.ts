import { useMemo } from "react";
import { usePulse } from "./store";
import { isOutside } from "./types";

/** Feedback given on this site (feedback form, QR scans). Imported outside feedback is analysed separately. */
export function useInsidePulses() {
  const all = usePulse((s) => s.pulses);
  return useMemo(() => all.filter((p) => !isOutside(p)), [all]);
}
