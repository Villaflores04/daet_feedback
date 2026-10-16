"use client";

import { FEEDBACK_PREVIEW_POINTS } from "@/lib/rewards";
import { FACES } from "@/lib/pulse/faces";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight, Waves } from "lucide-react";

/** Scenery transforms are scoped to this landing-only component. */
export function CoastalHero() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const stage = node.querySelector<HTMLElement>(".coastal-stage");
    if (!stage) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const mobile = window.matchMedia("(max-width: 767px)");
    const selectors = ["sun", "orbit", "clouds", "town", "water", "surf", "frond-left", "frond-right", "content", "location"];
    const layers = selectors.map(name => node.querySelector<HTMLElement | SVGElement>(`.coastal-${name}`));
    const progressBar = node.querySelector<HTMLElement>(".journey-progress span");
    let frame = 0;
    let top = 0;
    let travel = 1;
    let visible = true;
    let dirty = true;
    let previous = -1;

    const draw = () => {
      frame = 0;
      if (document.hidden) return;
      // Geometry is read only after resize, never during ordinary scrolling.
      if (dirty) {
        top = node.getBoundingClientRect().top + window.scrollY;
        travel = Math.max(0, node.offsetHeight - stage.offsetHeight);
        dirty = false;
        previous = -1;
      }
      const p = reduced.matches || !travel ? 0 : Math.min(1, Math.max(0, (window.scrollY - top) / travel));
      if (p === previous) return;
      previous = p;
      const m = mobile.matches;
      const d = p * (m ? 0.55 : 1);
      const move = (x: number, y: number) => `translate3d(${x * d}px, ${y * d}px, 0)`;
      const transforms = [
        move(0, -60), move(0, -100), move(-160, -45),
        `${move(-22, -65)} scale(${1 + d * 0.2})`,
        `${move(-80, 70)} scale(${1 + d * 0.15})`,
        `${move(100, -35)} scale(${1 + d * 0.3})`,
        `rotate(18deg) ${move(-170, 150)} scale(${1 + d * 0.35})`,
        `scaleX(-1) rotate(5deg) ${move(-170, 180)} scale(${1 + d * 0.4})`,
        m ? `translate3d(0, ${p * -20}px, 0)` : move(-25, -85),
        `translate3d(0, ${45 - p * 45}px, 0)`,
      ];
      layers.forEach((layer, i) => { if (layer) layer.style.transform = transforms[i]; });
      if (layers[9]) layers[9].style.opacity = String(p);
      if (progressBar) progressBar.style.transform = `scaleX(${p})`;
    };
    const update = () => {
      if (!frame && !document.hidden) frame = requestAnimationFrame(draw);
    };
    const subscribe = () => {
      window.removeEventListener("scroll", update);
      const active = visible && !reduced.matches && !document.hidden;
      node.classList.toggle("parallax-active", active);
      if (active) window.addEventListener("scroll", update, { passive: true });
      if (!active) { cancelAnimationFrame(frame); frame = 0; }
      update();
    };
    const measure = () => { dirty = true; update(); };
    const observer = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      subscribe();
    });
    const sizes = new ResizeObserver(measure);
    observer.observe(node);
    sizes.observe(node);
    sizes.observe(stage);
    window.addEventListener("resize", measure, { passive: true });
    mobile.addEventListener("change", measure);
    reduced.addEventListener("change", subscribe);
    document.addEventListener("visibilitychange", subscribe);
    subscribe();
    return () => {
      observer.disconnect();
      sizes.disconnect();
      cancelAnimationFrame(frame);
      node.classList.remove("parallax-active");
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
      mobile.removeEventListener("change", measure);
      reduced.removeEventListener("change", subscribe);
      document.removeEventListener("visibilitychange", subscribe);
    };
  }, []);

  return (
    <section
      ref={root}
      className="coastal-journey daet-photo-hero"
      aria-label="DAET-CONNECT visitor feedback"
    >
      <div className="coastal-stage">
        <div className="coastal-sky" aria-hidden="true" />
        <div className="coastal-sun" aria-hidden="true" />
        <div className="coastal-orbit" aria-hidden="true" />
        <div className="coastal-clouds" aria-hidden="true">
          <svg viewBox="0 0 1440 500" preserveAspectRatio="none">
            <path
              d="M790 160c40-38 74-27 102-8 26-53 84-57 120-13 51-24 88-9 109 21Z M280 80c27-25 46-22 67-10 30-29 64-25 83 10Z"
              fill="white"
              opacity=".7"
            />
          </svg>
        </div>
        <img
          src="/daet-hero-desktop.webp"
          srcSet="/daet-hero-mobile.webp 960w, /daet-hero-desktop.webp 1920w"
          sizes="(max-width: 767px) 160vw, 100vw"
          decoding="async"
          alt=""
          className="coastal-town"
          fetchPriority="high"
        />
        <div className="coastal-wash" aria-hidden="true" />
        <svg
          className="coastal-water"
          viewBox="0 0 1440 350"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="water-fade" x2="0" y2="1">
              <stop stopColor="#bce8ed" stopOpacity=".12" />
              <stop offset="1" stopColor="#348c9c" stopOpacity=".75" />
            </linearGradient>
          </defs>
          <path
            d="M0 110C220 160 430 85 670 120s550 105 770 5v225H0Z"
            fill="url(#water-fade)"
          />
          <path
            d="M520 155c270-72 410 94 920-13M700 188c240-20 360 56 740 1M950 240c160 30 330 10 490-20"
            fill="none"
            stroke="#e7fcff"
            strokeWidth="2"
            opacity=".65"
          />
        </svg>
        <svg className="coastal-surf" viewBox="0 0 1440 260" preserveAspectRatio="none" aria-hidden="true">
          <path d="M-100 90C180 4 310 218 630 125S1120 35 1550 122V300H-100Z" fill="#298b9926" />
          <path d="M-100 95C180 9 310 223 630 130S1120 40 1550 127" stroke="#efffff" strokeWidth="3" fill="none" />
          <path d="M-100 165C180 79 310 293 630 200S1120 110 1550 197" stroke="#efffff80" strokeWidth="1.5" fill="none" />
        </svg>
        <div className="coastal-content page-width">
          <p className="eyebrow">
            <span className="inline-block h-px w-8 bg-teal" /> Daet, Camarines
            Norte
          </p>
          <h1>
            Your visit.
            <br />
            Your <em>voice.</em>
          </h1>
          <p className="hero-description">
            How was your time in Daet?
            <br className="hidden sm:block" /> Choose a feeling. Help shape a better visit.
          </p>
          <div className="hero-feelings" aria-label="Choose a feeling to start feedback">
            {FACES.map(face => <Link key={face.id} href={`/feedback?feeling=${face.id}`} aria-label={`Give ${face.label.toLowerCase()} feedback`}><span aria-hidden="true">{face.glyph}</span><small>{face.label}</small></Link>)}
          </div>
          <p className="hero-reward-note">+{FEEDBACK_PREVIEW_POINTS} demo points with saved feedback <span>· Preview only</span></p>
          <div className="hero-actions">
            <Link href="/feedback" className="primary-link">
              Give feedback <ArrowUpRight size={18} />
            </Link>
            <Link href="/board" className="text-link">
              See visitor sentiment <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="coastal-location" aria-hidden="true"><span>BAGASBAS BEACH, DAET</span><p>A better visit<br />starts with <em>you.</em></p><small>Daet · Camarines Norte · Philippines</small></div>
        <div className="coastal-caption page-width">
          <a href="#discover" className="scroll-cue">
            <ArrowDown size={16} /> Visitor experiences
          </a>
          <span className="hidden items-center gap-2 sm:flex">
            <Waves size={18} /> Emoji feedback · Sentiment · Rewards preview
          </span>
        </div>
        <div className="journey-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
