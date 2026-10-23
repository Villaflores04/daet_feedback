"use client";

import { useEffect, useState, type ReactNode } from "react";
import { SyncNotice } from "@/components/sync-notice";
import { SiteDock } from "@/components/site-dock";
import { SiteFooter } from "@/components/site-footer";
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
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 48);
      // Hide the header only while the hero is moving; it returns shortly after scrolling stops.
      const hero = document.querySelector<HTMLElement>(".mh-journey");
      if (y > 2 && hero && y < hero.offsetHeight) {
        setScrolling(true);
        clearTimeout(idle);
        idle = setTimeout(() => setScrolling(false), 260);
      } else {
        clearTimeout(idle);
        setScrolling(false);
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => { window.removeEventListener("scroll", onScroll); clearTimeout(idle); };
  }, [landing]);

  return (
    <div className="public-shell min-h-svh bg-page text-ink">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      {process.env.NEXT_PUBLIC_FEEDBACK_SHARED_SHELL !== "true" && <SiteHeader landing={landing} scrolled={scrolled} hiding={landing && scrolling} />}
      <SyncNotice />
      {children}
      {process.env.NEXT_PUBLIC_FEEDBACK_SHARED_SHELL !== "true" && <><SiteFooter /><SiteDock /></>}
    </div>
  );
}
