/**
 * Smooth, interruptible page glide with an eased start and stop. Any wheel, touch, key press or scrollbar drag by the
 * visitor cancels it at once. Returns false when it did nothing (already there, or reduced motion jumped instead).
 */
let active = false;
export function glideTo(endY: number, speed = 1560): boolean {
  if (active || typeof window === "undefined") return false;
  const startY = window.scrollY;
  const dist = Math.round(endY) - startY;
  if (Math.abs(dist) < 40) return false;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { window.scrollTo({ top: endY, behavior: "auto" }); return false; }
  active = true;
  const dur = Math.min(9000, Math.max(1800, (Math.abs(dist) / speed) * 1000));
  const t0 = performance.now();
  let last = startY, raf = 0;
  const events = ["wheel", "touchstart", "keydown", "pointerdown"] as const;
  const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
  const stop = () => {
    active = false;
    cancelAnimationFrame(raf);
    for (const ev of events) window.removeEventListener(ev, stop);
  };
  for (const ev of events) window.addEventListener(ev, stop, { passive: true });
  const step = (now: number) => {
    if (!active) return;
    if (Math.abs(window.scrollY - last) > 4) { stop(); return; } // the visitor moved the page themselves
    const t = Math.min(1, (now - t0) / dur);
    last = Math.round(startY + dist * ease(t));
    window.scrollTo({ top: last, behavior: "instant" as ScrollBehavior });
    if (t < 1) raf = requestAnimationFrame(step); else stop();
  };
  raf = requestAnimationFrame(step);
  return true;
}
