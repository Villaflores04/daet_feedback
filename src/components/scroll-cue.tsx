"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

/** A small "scroll down" arrow on the right edge of the landing page. It disappears near the end of the page. */
export function ScrollCue() {
  const [show, setShow] = useState(true);
  const last = useRef(true);
  useEffect(() => {
    let raf = 0;
    const check = () => {
      raf = 0;
      const left = document.documentElement.scrollHeight - window.innerHeight - window.scrollY;
      const next = left > 240;
      if (next !== last.current) { last.current = next; setShow(next); }
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
      className="scroll-cue"
      data-show={show ? "1" : "0"}
      aria-label="Scroll down for more"
      tabIndex={show ? 0 : -1}
      onClick={() => window.scrollBy({ top: Math.round(window.innerHeight * 0.85), behavior: "smooth" })}
    >
      <span className="scroll-cue-label">Scroll</span>
      <ChevronDown className="scroll-cue-arrow" size={22} aria-hidden="true" />
    </button>
  );
}
