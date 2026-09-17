"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight, Waves } from "lucide-react";

/** Scenery transforms are scoped to this landing-only component. */
export function CoastalHero() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = root.current;
    if (!node) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0;
    const draw = () => {
      frame = 0;
      const rect = node.getBoundingClientRect();
      const travel = Math.max(1, node.offsetHeight - window.innerHeight);
      const progress = reduced.matches
        ? 0
        : Math.min(1, Math.max(0, -rect.top / travel));
      node.style.setProperty("--journey", String(progress));
    };
    const update = () => {
      if (!frame) frame = requestAnimationFrame(draw);
    };
    const observer = new IntersectionObserver(([entry]) => {
      window.removeEventListener("scroll", update);
      if (entry.isIntersecting)
        window.addEventListener("scroll", update, { passive: true });
      update();
    });
    observer.observe(node);
    window.addEventListener("resize", update);
    reduced.addEventListener("change", update);
    draw();
    return () => {
      observer.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  return (
    <section
      ref={root}
      className="coastal-journey"
      aria-label="Welcome to Daet"
    >
      <div className="coastal-stage">
        <div className="coastal-sky" aria-hidden="true" />
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
          src="/hero.jpg"
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
        <svg
          className="coastal-frond coastal-frond-left"
          viewBox="0 0 360 500"
          aria-hidden="true"
        >
          <g fill="#0a4e60">
            <path d="M-10 510Q20 190 300 15Q80 215 25 510Z" />
            <path d="M58 361Q-80 210 22 158Q20 275 58 361M92 283Q-25 116 87 84Q49 205 92 283M138 208Q67 49 177 18Q115 140 138 208M188 141Q164 15 271 0Q193 84 188 141M50 383Q218 218 267 315Q141 323 50 383M78 302Q264 123 306 217Q177 229 78 302M126 217Q295 79 339 162Q234 161 126 217M195 131Q329 39 357 107Q266 97 195 131" />
          </g>
        </svg>
        <svg
          className="coastal-frond coastal-frond-right"
          viewBox="0 0 360 500"
          aria-hidden="true"
        >
          <g fill="#126b73">
            <path d="M0 510Q30 170 295 10Q98 226 26 510Z" />
            <path d="M50 370Q-66 218 32 153Q7 283 50 370M96 266Q-8 102 107 65Q60 185 96 266M162 169Q105 28 220 4Q151 109 162 169M55 357Q241 192 289 291Q152 294 55 357M111 241Q286 85 328 184Q213 183 111 241M183 150Q311 16 360 111Q263 93 183 150" />
          </g>
        </svg>
        <div className="coastal-content page-width">
          <p className="eyebrow">
            <span className="inline-block h-px w-8 bg-teal" /> Daet, Camarines
            Norte
          </p>
          <h1>
            Find your
            <br />
            kind of <em>Daet.</em>
          </h1>
          <p className="hero-description">
            Salt in the air. Stories in every corner.
            <br className="hidden sm:block" /> Discover the places, and the way
            they make you feel.
          </p>
          <div className="hero-actions">
            <Link href="/spots" className="primary-link">
              Explore the places <ArrowUpRight size={18} />
            </Link>
            <Link href="/transmit" className="text-link">
              Share an experience <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>
        <div className="coastal-caption page-width">
          <a href="#discover" className="scroll-cue">
            <ArrowDown size={16} /> Scroll to discover
          </a>
          <span className="hidden items-center gap-2 sm:flex">
            <Waves size={18} /> A town best experienced.
          </span>
        </div>
      </div>
    </section>
  );
}
