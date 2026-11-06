"use client";

import { useEffect, useRef, useState } from "react";

/** Small "scroll" hint on the right edge of the landing page: a thin track with a dot that falls along it. */
export function ScrollHint() {
  const [state, setState] = useState({ show: true, dark: false });
  const last = useRef("1-0");
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const y = window.scrollY;
      const left = document.documentElement.scrollHeight - window.innerHeight - y;
      const show = left > 240;
      const dark = y > window.innerHeight * 0.85; // past the photo hero, the page background is light
      const key = `${show ? 1 : 0}-${dark ? 1 : 0}`;
      if (key !== last.current) { last.current = key; setState({ show, dark }); }
    };
    const on = () => { if (!raf) raf = requestAnimationFrame(check); };
    check();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => { window.removeEventListener("scroll", on); window.removeEventListener("resize", on); if (raf) cancelAnimationFrame(raf); };
  }, []);
  return (
    <button
      type="button"
      className="scroll-hint"
      data-show={state.show ? "1" : "0"}
      data-tone={state.dark ? "dark" : "light"}
      aria-label="Scroll down for more"
      tabIndex={state.show ? 0 : -1}
      onClick={() => window.scrollBy({ top: Math.round(window.innerHeight * 0.85), behavior: "smooth" })}
    >
      <span className="scroll-hint-label">Scroll</span>
      <span className="scroll-hint-track"><span className="scroll-hint-dot" /></span>
      <span className="scroll-hint-arrow" aria-hidden="true" />
    </button>
  );
}
