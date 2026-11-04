"use client";

import { FEEDBACK_PREVIEW_POINTS } from "@/lib/rewards";
import { FACES } from "@/lib/pulse/faces";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight, Waves } from "lucide-react";
import { DriftingLeaves, GrassRow, LeafCluster } from "./hero-foliage";
import { TrailHead, TrailScenery, TrailSteps, type TrailData } from "./landing-trail";

/**
 * Landing hero: a painted Daet landmark with scroll-driven parallax.
 *
 * Where the browser supports CSS scroll-driven animations (Chrome/Edge/Android Chrome 115+, Safari 26+) the whole
 * parallax is declared in CSS (`animation-timeline`) and runs on the compositor thread, so it stays at the display
 * frame rate even when the main thread is busy and this component does no work while scrolling. Other browsers fall
 * back to one rAF loop that writes `transform` straight onto a handful of layers. Neither path uses CSS custom
 * properties, which would force a style recalculation of every foliage node on every frame.
 */
const POINTER: Record<string, [number, number]> = { bg: [-10, -6], ll: [16, 10], lr: [16, 10], gb: [-10, 0], gf: [-24, 0] };

/** Share of the scroll used by the hero itself; the rest belongs to the trail scene that rises out of the grass (desktop). */
const HERO = 0.22;
/** Scroll positions where each trail step switches on in the script fallback. */
const STEPS = [0.1, 0.36, 0.46, 0.62, 0.78, 0.9];

export function MonumentHero({ trail }: { trail: TrailData }) {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = root.current;
    const stage = node?.querySelector<HTMLElement>(".mh-stage");
    if (!node || !stage) return;
    const q = (selector: string) => stage.querySelector<HTMLElement>(selector);
    const layers = { bg: q(".mh-bg img"), ll: q(".mh-leaves-l"), lr: q(".mh-leaves-r"), gb: q(".mh-grass-back"), gf: q(".mh-grass-front") };
    const extras = { light: q(".mh-light"), ct: q(".mh-content"), prog: q(".mh-progress span") };
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const portrait = window.matchMedia("(max-width: 767px), (max-aspect-ratio: 1/1)");
    // In-app browsers (Messenger, Facebook, Instagram, 1DM and other Android WebViews) and weak phones lag with the full
    // scene. They get a "lite" mode: no endless animations or blur, and a lean JS-driven parallax of the main layers.
    const ua = navigator.userAgent;
    const inApp = /FBAN|FBAV|FB_IAB|FBIOS|Messenger|Instagram|Line\/|MicroMessenger|Snapchat|TikTok|1DM|IDM|; wv\)/i.test(ua);
    const weak = !finePointer.matches && ((navigator.hardwareConcurrency || 8) <= 4 || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8) <= 3);
    const supportsNative = typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()");
    const lite = !supportsNative || inApp || weak;
    const native = supportsNative && !lite;
    if (lite) { node.classList.add("mh-lite"); stage.classList.add("mh-lite"); }
    let past = false, steps = 0;
    let frame = 0, pointerFrame = 0, travel = 1, dirty = true, visible = true, p = -1;
    let tx = 0, ty = 0, mx = 0, my = 0; // pointer target / eased value, -1..1

    // Fallback only: same maths as the keyframes in globals.css.
    const draw = () => {
      frame = 0;
      if (document.hidden || !visible || reduced.matches) return;
      if (dirty) { travel = Math.max(1, node.offsetHeight - stage.offsetHeight); dirty = false; p = -1; }
      // Position is read fresh each frame: the sync notice above the hero can appear after load and shift it.
      const next = Math.min(1, Math.max(0, -node.getBoundingClientRect().top / travel));
      if (lite ? Math.round(next * 120) / 120 === p : next === p) return;
      const m = portrait.matches;
      const set = (el: HTMLElement | null, value: string) => { if (el) el.style.transform = value; };
      // Desktop: the hero uses the first part of the scroll, then the trail scene rises behind the grass. Phones: whole range.
      const hp = m ? next : Math.min(1, next / HERO);
      p = lite ? Math.round(next * 120) / 120 : next;
      // No zoom: layers only drift upward / sideways.
      set(layers.bg, m ? `translate3d(0,${-4 - 2 * hp}%,0) scale(1.12)` : `scale(1.04) translate3d(0,${-2 * hp}%,0)`);
      set(layers.ll, `translate3d(${hp * (m ? -80 : -150)}px,${hp * (m ? -60 : -110)}px,0)`);
      set(layers.lr, `translate3d(${hp * (m ? 80 : 150)}px,${hp * (m ? -60 : -110)}px,0)`);
      set(extras.ct, `translate3d(0,${hp * -70}px,0)`);
      if (!lite && extras.light) extras.light.style.opacity = String(1 - hp * 0.5);
      if (extras.prog) extras.prog.style.transform = `scaleX(${next})`;
      const isPast = !m && next > HERO;
      if (isPast !== past) { past = isPast; stage.classList.toggle("mh-past", isPast); }
      const n = m ? 0 : STEPS.filter(t => next >= t).length;
      if (n !== steps) { steps = n; for (let i = 1; i <= STEPS.length; i++) stage.classList.toggle(`st${i}`, i <= n); }
    };
    const update = () => { if (!frame && !native && visible && !document.hidden) frame = requestAnimationFrame(draw); };

    // Desktop pointer parallax uses the independent `translate` property, so it composes with the scroll transform.
    const drawPointer = () => {
      pointerFrame = 0;
      mx += (tx - mx) * 0.08; my += (ty - my) * 0.08;
      for (const [key, [fx, fy]] of Object.entries(POINTER)) {
        const el = layers[key as keyof typeof layers];
        if (el) el.style.translate = `${(mx * fx).toFixed(2)}px ${(my * fy).toFixed(2)}px`;
      }
      if (Math.abs(tx - mx) > 0.002 || Math.abs(ty - my) > 0.002) pointerFrame = requestAnimationFrame(drawPointer);
    };
    const onPointer = (e: PointerEvent) => {
      if (!finePointer.matches || reduced.matches || !visible) return;
      const r = stage.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
      if (!pointerFrame) pointerFrame = requestAnimationFrame(drawPointer);
    };

    const measure = () => { dirty = true; update(); };
    // Off-screen: pause the endless sway/drift animations (the CSS reads this class).
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; stage.classList.toggle("mh-idle", !visible); if (visible) update(); });
    const ro = new ResizeObserver(measure);
    io.observe(node); ro.observe(node); ro.observe(stage);
    if (!native) window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", measure, { passive: true });
    stage.addEventListener("pointermove", onPointer, { passive: true });
    reduced.addEventListener("change", measure);
    document.addEventListener("visibilitychange", update);
    update();
    return () => {
      io.disconnect(); ro.disconnect(); cancelAnimationFrame(frame); cancelAnimationFrame(pointerFrame);
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", measure);
      stage.removeEventListener("pointermove", onPointer);
      reduced.removeEventListener("change", measure);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);

  const goHow = (e: React.MouseEvent) => {
    const node = root.current;
    if (!node) return;
    e.preventDefault();
    const phone = window.matchMedia("(max-width: 767px), (max-aspect-ratio: 1/1)").matches;
    const target = phone ? document.getElementById("how-it-works") : null;
    const top = target ? target.getBoundingClientRect().top + window.scrollY - 70 : node.offsetTop + (node.offsetHeight - window.innerHeight) * 0.5;
    window.scrollTo({ top, behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  };

  return (
    <>
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
        <div className="mh-layer mh-leaves-l" aria-hidden="true"><LeafCluster seed={11} /></div>
        <div className="mh-layer mh-leaves-r" aria-hidden="true"><div className="mh-flip"><LeafCluster seed={29} /></div></div>
        <div className="mh-layer mh-grass-back" aria-hidden="true"><GrassRow seed={5} count={130} minH={60} maxH={130} palette={["#245c43", "#7fae4c"]} className="mh-grass" /></div>
        <div className="mh-layer mh-grass-front" aria-hidden="true"><GrassRow seed={9} count={80} minH={70} maxH={200} palette={["#143d33", "#4f8f46"]} flowers={7} className="mh-grass mh-sway-b" /></div>

        <div className="mh-content page-width">
          <div className="mh-copy">
            <p className="mh-eyebrow"><span aria-hidden="true" /> Daet, Camarines Norte</p>
            <h1>Your visit.<br />Your <em>voice.</em></h1>
            <div className="mh-card">
              <p className="mh-lede">How was your time in Daet?<br className="hidden sm:block" /> Choose a feeling.<span className="mh-lede-more"> Help shape a better visit.</span></p>
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

        <div className="mh-caption page-width">
          <a href="#how-it-works" className="scroll-cue" onClick={goHow}><ArrowDown size={16} /> How it works</a>
          <span className="mh-caption-note"><Waves size={18} /> Emoji feedback · Sentiment · Rewards preview</span>
        </div>
        <div className="mt-panel">
          <TrailScenery />
          <div className="mt-body page-width"><TrailHead /><TrailSteps data={trail} />
            <svg className="mt-trail" viewBox="0 0 1200 420" preserveAspectRatio="none" aria-hidden="true" focusable="false">
              <path className="mt-path-base" d="M-20 430C140 400 170 250 330 262S560 380 700 330 900 150 1030 170 1180 120 1230 60" />
              <path className="mt-path" pathLength="1" d="M-20 430C140 400 170 250 330 262S560 380 700 330 900 150 1030 170 1180 120 1230 60" />
            </svg>
          </div>
        </div>
        <div className="mh-progress" aria-hidden="true"><span /></div>
      </div>
    </section>
    <section id="how-it-works" className="mt-inline" aria-label="How it works">
      <div className="mt-hill" aria-hidden="true"><TrailScenery /></div>
      <div className="page-width">
        <TrailHead />
        <TrailSteps data={trail} />
        <div className="mt-end">
          <Link href="/feedback" className="primary-link">Share how it felt <ArrowUpRight size={18} /></Link>
          <Link href="/spots" className="text-link">Browse places <ArrowUpRight size={16} /></Link>
        </div>
      </div>
    </section>
    </>
  );
}
