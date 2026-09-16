import { useEffect, useState, type ReactNode } from "react";
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

  useEffect(() => {
    if (!landing) return;
    const onScroll = () => setScrolled(window.scrollY > 48);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [landing]);

  return (
    <div className="min-h-svh bg-page text-ink">
      <SiteHeader landing={landing} scrolled={scrolled} />
      {children}
      <SiteFooter />
      <SiteDock />
    </div>
  );
}
