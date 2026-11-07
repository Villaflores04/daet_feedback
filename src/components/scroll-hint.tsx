"use client";

import { useEffect, useRef, useState } from "react";
import { glideTo } from "@/lib/glide";

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
  // Click: glide down through the whole journey (the day-to-night scene on desktop) at a gentle pace.
  const play = () => {
    const journey = document.querySelector<HTMLElement>(".mh-journey");
    const endY = journey ? journey.getBoundingClientRect().bottom + window.scrollY - window.innerHeight : window.scrollY + window.innerHeight * 0.85;
    glideTo(endY);
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
