"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SiteDock } from "@/components/site-dock";
import { SiteFooter } from "@/components/site-footer";
import { LandingMenu } from "@/components/landing-menu";
import { SiteHeader } from "@/components/site-header";

export function PublicChrome({
  children,
  landing = false,
}: {
  children: ReactNode;
  landing?: boolean;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [scrolling, setScrolling] = useState(false);

  useEffect(() => {
    if (!landing) return;
    let idle: ReturnType<typeof setTimeout> | undefined;
    let raf = 0, heroH = 0;
    let lastScrolled = false, lastScrolling = false;
    // The hero height is measured once (and on resize), never inside the scroll handler: reading it there forced a
    // synchronous layout on every scroll event while the hero was also changing classes, which is what made fast
    // back-and-forth scrolling stutter on phones.
    const compact = window.matchMedia("(max-width: 1023px)");
    const hero = document.querySelector<HTMLElement>(".mh-journey");
    const measure = () => { heroH = hero ? hero.offsetHeight : 0; };
    const ro = hero && typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (hero) ro?.observe(hero);
    measure();
    const run = () => {
      raf = 0;
      const y = window.scrollY;
      // Phones: the bar leaves and becomes the fixed bar on the same first pixel, so it never pops between the two states mid-swipe.
      const sc = y > (compact.matches ? 2 : 48);
      if (sc !== lastScrolled) { lastScrolled = sc; setScrolled(sc); }
      // Hide the header only while the hero is moving; it returns shortly after scrolling stops.
      if (y > 2 && heroH && y < heroH) {
        if (!lastScrolling) { lastScrolling = true; setScrolling(true); }
        clearTimeout(idle);
        idle = setTimeout(() => { lastScrolling = false; setScrolling(false); }, 260);
      } else {
        clearTimeout(idle);
        if (lastScrolling) { lastScrolling = false; setScrolling(false); }
      }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(run); };
    run();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(idle); if (raf) cancelAnimationFrame(raf); ro?.disconnect(); };
  }, [landing]);

  return (
    <div className="public-shell min-h-svh bg-page text-ink">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {process.env.NEXT_PUBLIC_FEEDBACK_SHARED_SHELL !== "true" && <SiteHeader landing={landing} scrolled={scrolled} hiding={landing && scrolling} />}
      {process.env.NEXT_PUBLIC_FEEDBACK_SHARED_SHELL !== "true" ? (landing && !scrolled ? <LandingMenu /> : <LandingMenu compact />) : null}
      {children}
      {process.env.NEXT_PUBLIC_FEEDBACK_SHARED_SHELL !== "true" && <><SiteFooter /><SiteDock /></>}
    </div>
  );
}
