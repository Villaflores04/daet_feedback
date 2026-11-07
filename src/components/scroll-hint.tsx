"use client";

import { useEffect, useRef, useState } from "react";

/** Small "scroll" hint on the right edge of the landing page: a thin track with a dot that falls along it. */
export function ScrollHint() {
  const [state, setState] = useState({ show: true, dark: false });
  const last = useRef("1");
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const y = window.scrollY;
      const show = y < 40; // only a hint for the first moment; gone as soon as the visitor scrolls
      const key = show ? "1" : "0";
      if (key !== last.current) { last.current = key; setState({ show, dark: false }); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  // Click: glide down through the whole journey (the day-to-night scene on desktop) at a gentle, constant pace.
  // Any touch, wheel, key press or scrollbar drag by the visitor stops it immediately.
  const playing = useRef(false);
  const play = () => {
    if (playing.current) return;
    const journey = document.querySelector<HTMLElement>(".mh-journey");
    const startY = window.scrollY;
    const endY = journey ? Math.round(journey.getBoundingClientRect().bottom + startY - window.innerHeight) : startY + window.innerHeight * 0.85;
    const dist = endY - startY;
    if (dist < 40) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) { window.scrollTo({ top: endY, behavior: "auto" }); return; }
    playing.current = true;
    const SPEED = 520; // px per second on average: slow enough to enjoy each scene
    const dur = Math.min(16000, Math.max(2800, (dist / SPEED) * 1000));
    const t0 = performance.now();
    let last = startY, raf = 0;
    const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2); // gentle start and stop
    const stop = () => {
      playing.current = false;
      cancelAnimationFrame(raf);
      for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) window.removeEventListener(ev, stop);
    };
    for (const ev of ["wheel", "touchstart", "keydown", "pointerdown"]) window.addEventListener(ev, stop, { passive: true });
    const step = (now: number) => {
      if (!playing.current) return;
      if (Math.abs(window.scrollY - last) > 4) { stop(); return; } // the visitor moved the page themselves
      const t = Math.min(1, (now - t0) / dur);
      last = Math.round(startY + dist * ease(t));
      window.scrollTo({ top: last, behavior: "instant" as ScrollBehavior });
      if (t < 1) raf = requestAnimationFrame(step); else stop();
    };
    raf = requestAnimationFrame(step);
  };
  return (
    <button
      type="button"
      className="scroll-hint"
      data-show={state.show ? "1" : "0"}
      data-tone={state.dark ? "dark" : "light"}
      aria-label="Scroll down: play the journey"
      tabIndex={state.show ? 0 : -1}
      onClick={play}
    >
      <span className="scroll-hint-label">Scroll</span>
      <span className="scroll-hint-track"><span className="scroll-hint-dot" /></span>
      <span className="scroll-hint-arrow" aria-hidden="true" />
    </button>
  );
}
