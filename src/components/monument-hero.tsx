"use client";

import { FEEDBACK_PREVIEW_POINTS } from "@/lib/rewards";
import { FACES } from "@/lib/pulse/faces";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { ArrowDown, ArrowUpRight, Waves } from "lucide-react";
import { DriftingLeaves, GrassRow, LeafCluster } from "./hero-foliage";

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

export function MonumentHero() {
  const root = useRef<HTMLElement>(null);
  useEffect(() => {
    const node = root.current;
    const stage = node?.querySelector<HTMLElement>(".mh-stage");
    if (!node || !stage) return;
    const q = (selector: string) => stage.querySelector<HTMLElement>(selector);
    const layers = { bg: q(".mh-bg img"), ll: q(".mh-leaves-l"), lr: q(".mh-leaves-r"), gb: q(".mh-grass-back"), gf: q(".mh-grass-front") };
    const extras = { light: q(".mh-light"), ct: q(".mh-content"), tag: q(".mh-tagline"), prog: q(".mh-progress span") };
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
    let tagOn = false;
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
      if (lite) {
        // Lean path: scale-led (little translation), so a scroll event arriving a frame late is hard to notice.
        p = Math.round(next * 120) / 120;
        set(layers.bg, m ? `translate3d(0,-4%,0) scale(${1.12 + p * 0.26})` : `scale(${1.04 + p * 0.3})`);
        set(layers.ll, `translate3d(${p * (m ? -45 : -85)}px,${p * (m ? -35 : -60)}px,0) scale(${1 + p * (m ? 0.2 : 0.4)})`);
        set(layers.lr, `translate3d(${p * (m ? 45 : 85)}px,${p * (m ? -35 : -60)}px,0) scale(${1 + p * (m ? 0.2 : 0.4)})`);
        set(layers.gb, `scale(${1 + p * 0.12})`);
        set(layers.gf, `translate3d(0,${p * (m ? 30 : 50)}px,0) scale(${1 + p * (m ? 0.2 : 0.35)})`);
        if (extras.prog) extras.prog.style.transform = `scaleX(${p})`;
        const on = p > 0.45;
        if (on !== tagOn) { tagOn = on; stage.classList.toggle("mh-tag-on", on); }
        return;
      }
      p = next;
      set(layers.bg, m ? `translate3d(0,-4%,0) scale(${1.12 + p * 0.32})` : `scale(${1.04 + p * 0.36})`);
      set(layers.ll, `translate3d(${p * (m ? -90 : -170)}px,${p * (m ? -70 : -120)}px,0) scale(${1 + p * (m ? 0.3 : 0.6)})`);
      set(layers.lr, `translate3d(${p * (m ? 90 : 170)}px,${p * (m ? -70 : -120)}px,0) scale(${1 + p * (m ? 0.3 : 0.6)})`);
      set(layers.gb, `translate3d(0,${p * (m ? 24 : 34)}px,0) scale(${1 + p * (m ? 0.15 : 0.3)})`);
      set(layers.gf, `translate3d(0,${p * (m ? 50 : 80)}px,0) scale(${1 + p * (m ? 0.3 : 0.55)})`);
      set(extras.ct, `translate3d(0,${p * -70}px,0)`);
      if (extras.light) extras.light.style.opacity = String(1 - p * 0.5);
      if (extras.tag) { extras.tag.style.opacity = String(Math.min(1, Math.max(0, (p - 0.3) * 2.6))); extras.tag.style.transform = `translate3d(0,${(1 - p) * 34}px,0)`; }
      if (extras.prog) extras.prog.style.transform = `scaleX(${p})`;
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
        <div className="mh-layer mh-leaves-l" aria-hidden="true"><LeafCluster seed={11} /></div>
        <div className="mh-layer mh-leaves-r" aria-hidden="true"><div className="mh-flip"><LeafCluster seed={29} /></div></div>
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
