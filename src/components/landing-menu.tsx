"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Menu, X } from "lucide-react";
import { LINKS } from "@/components/site-header";

/**
 * Desktop-only menu over the landing hero. Phones already have the bottom bar.
 * It is static and has no blur, so it adds nothing to the parallax scroll work. The page unmounts it once the normal header takes over.
 */
export function LandingMenu() {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") { setOpen(false); button.current?.focus(); }
    };
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => { document.removeEventListener("keydown", onKey); document.removeEventListener("pointerdown", onPointer); };
  }, [open]);

  return (
    <div className="landing-menu" ref={root}>
      <button ref={button} type="button" className="landing-menu-button" aria-expanded={open} aria-controls="landing-menu-panel" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
        {open ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
      </button>
      {open ? (
        <nav id="landing-menu-panel" className="landing-menu-panel" aria-label="Main navigation">
          <ul>
            {LINKS.map((link) => (
              <li key={link.to}><Link href={link.to} onClick={() => setOpen(false)} aria-current={link.to === "/" ? "page" : undefined}>{link.label}</Link></li>
            ))}
          </ul>
          <Link href="/feedback" className="landing-menu-cta" onClick={() => setOpen(false)}>Give feedback <ArrowUpRight size={16} aria-hidden="true" /></Link>
        </nav>
      ) : null}
    </div>
  );
}
