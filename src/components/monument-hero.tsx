"use client";

import { FEEDBACK_PREVIEW_POINTS } from "@/lib/rewards";
import { FACES } from "@/lib/pulse/faces";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight, Waves } from "lucide-react";
import { DriftingLeaves, GrassRow, LeafCluster } from "./hero-foliage";

/**
 * Landing hero: a painted Daet landmark with scroll-driven parallax.
 * One rAF loop writes three CSS variables on the stage (--p scroll progress, --mx/--my pointer); every layer
 * derives its transform from them in CSS, so there is one style write per frame and no per-layer JS.
 */
export function MonumentHero() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = root.current;
    const stage = node?.querySelector<HTMLElement>(".mh-stage");
    if (!node || !stage) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    let frame = 0, top = 0, travel = 1, dirty = true, visible = true;
    let p = -1;
    let tx = 0, ty = 0, mx = 0, my = 0; // pointer target / eased value, -1..1

    const draw = () => {
      frame = 0;
      if (document.hidden) return;
      if (dirty) { // geometry is measured on resize only, never while scrolling
        top = node.getBoundingClientRect().top + window.scrollY;
        travel = Math.max(1, node.offsetHeight - stage.offsetHeight);
        dirty = false; p = -1;
      }
      const next = reduced.matches ? 0 : Math.min(1, Math.max(0, (window.scrollY - top) / travel));
      let moving = false;
      if (!reduced.matches && finePointer.matches) {
        mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
        moving = Math.abs(tx - mx) > 0.002 || Math.abs(ty - my) > 0.002;
      }
      if (next !== p || moving) {
        p = next;
        stage.style.setProperty("--p", p.toFixed(4));
        stage.style.setProperty("--mx", mx.toFixed(4));
        stage.style.setProperty("--my", my.toFixed(4));
      }
      if (moving) frame = requestAnimationFrame(draw);
    };
    const update = () => { if (!frame && visible && !document.hidden) frame = requestAnimationFrame(draw); };
    const onPointer = (e: PointerEvent) => {
      if (!finePointer.matches || reduced.matches) return;
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      update();
    };
    const measure = () => { dirty = true; update(); };
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) update(); });
    const ro = new ResizeObserver(measure);
    io.observe(node); ro.observe(node); ro.observe(stage);
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    stage.addEventListener("pointermove", onPointer, { passive: true });
    reduced.addEventListener("change", measure);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      io.disconnect(); ro.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
      stage.removeEventListener("pointermove", onPointer);
      reduced.removeEventListener("change", measure);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  return (
    <section ref={root} className="mh-journey" aria-label="DAET-CONNECT visitor feedback">
      <div className="mh-stage">
        <div className="mh-bg" aria-hidden="true">
          <picture>
            <source media="(max-width: 767px), (max-aspect-ratio: 1/1)" srcSet="/daet-monument-mobile.webp" />
            <img src="/daet-monument-desktop.webp" alt="" decoding="async" fetchPriority="high" />
          </picture>
        </div>
        <div className="mh-light" aria-hidden="true" />
        <div className="mh-shade" aria-hidden="true" />
        <DriftingLeaves />
        <div className="mh-layer mh-leaves-l" aria-hidden="true"><LeafCluster seed={11} className="mh-sway" /></div>
        <div className="mh-layer mh-leaves-r" aria-hidden="true"><div className="mh-flip"><LeafCluster seed={29} className="mh-sway mh-sway-b" /></div></div>
        <div className="mh-layer mh-grass-back" aria-hidden="true"><GrassRow seed={5} count={130} minH={60} maxH={130} palette={["#245c43", "#7fae4c"]} className="mh-grass" /></div>
        <div className="mh-layer mh-grass-front" aria-hidden="true"><GrassRow seed={9} count={80} minH={70} maxH={200} palette={["#143d33", "#4f8f46"]} flowers={7} className="mh-grass mh-sway-b" /></div>

        <div className="mh-content page-width">
          <div className="mh-copy">
            <p className="mh-eyebrow"><span aria-hidden="true" /> Daet, Camarines Norte</p>
            <h1>Your visit.<br />Your <em>voice.</em></h1>
            <div className="mh-card">
              <p className="mh-lede">How was your time in Daet?<br className="hidden sm:block" /> Choose a feeling. Help shape a better visit.</p>
              <div className="hero-feelings mh-feelings" aria-label="Choose a feeling to start feedback">
                {FACES.map(face => <Link key={face.id} href={`/feedback?feeling=${face.id}`} aria-label={`Give ${face.label.toLowerCase()} feedback`}><span aria-hidden="true">{face.glyph}</span><small>{face.label}</small></Link>)}
              </div>
              <p className="mh-reward">+{FEEDBACK_PREVIEW_POINTS} demo points with saved feedback <span>· Preview only</span></p>
              <div className="mh-actions">
                <Link href="/feedback" className="primary-link">Give feedback <ArrowUpRight size={18} /></Link>
                <Link href="/board" className="text-link">See visitor sentiment <ArrowUpRight size={16} /></Link>
              </div>
            </div>
          </div>
        </div>

        <div className="mh-tagline" aria-hidden="true"><span>Daet landmark</span><p>A better visit<br />starts with <em>you.</em></p><small>Daet · Camarines Norte · Philippines</small></div>
        <div className="mh-caption page-width">
          <a href="#discover" className="scroll-cue"><ArrowDown size={16} /> Visitor experiences</a>
          <span className="mh-caption-note"><Waves size={18} /> Emoji feedback · Sentiment · Rewards preview</span>
        </div>
        <div className="mh-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
  );
}
