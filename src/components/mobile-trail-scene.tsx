"use client";

import { useEffect, useRef } from "react";
import { Palm, STARS, Tree } from "./landing-trail";

/**
 * Phones and portrait tablets: a scene that stays put behind the three "How it works" cards.
 * It goes from morning (step 1) through sunset (step 2) to night (step 3). The step is read from which card
 * is in the middle of the screen and written as data-step on the section; CSS then fades layers (opacity and
 * transform only, so it stays on the compositor).
 */
export function MobileTrailScene() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const section = ref.current?.closest<HTMLElement>(".mt-inline");
    if (!section) return;
    section.dataset.step = "1";
    const cards = Array.from(section.querySelectorAll<HTMLElement>(".mt-card"));
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) section.dataset.step = String(cards.indexOf(e.target as HTMLElement) + 1);
      },
      { rootMargin: "-42% 0px -42% 0px" },
    );
    cards.forEach((c) => io.observe(c));

    const scene = ref.current!;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const q = (sel: string) => scene.querySelector<HTMLElement>(sel);
    const el = { clouds: q(".mm-clouds"), far: q(".mm-far"), mid: q(".mm-mid"), near: q(".mm-near"), stars: q(".mm-stars") };
    const depth: [HTMLElement | null, HTMLElement | null, number][] = [[q(".mm-t1"), null, 3], [q(".mm-t2"), null, 7], [q(".mm-t3"), null, 12]];

    // Browsers without scroll-driven CSS animations: move the layers from a throttled scroll handler instead.
    const nativeScroll = typeof CSS !== "undefined" && CSS.supports("animation-timeline: view()");
    let frame = 0;
    const drawScroll = () => {
      frame = 0;
      const r = section.getBoundingClientRect();
      const p = Math.max(0, Math.min(1, (window.innerHeight - r.top) / (r.height + window.innerHeight)));
      const k = p * 2 - 1; // -1 .. 1
      if (el.clouds) el.clouds.style.transform = `translate3d(${(-60 * k).toFixed(1)}px,0,0)`;
      if (el.far) el.far.style.transform = `translate3d(${(-16 * k).toFixed(1)}px,0,0)`;
      if (el.mid) el.mid.style.transform = `translate3d(${(-34 * k).toFixed(1)}px,0,0)`;
      if (el.near) el.near.style.transform = `translate3d(${(-70 * k).toFixed(1)}px,0,0)`;
      if (el.stars) el.stars.style.transform = `translate3d(0,${(14 * k).toFixed(1)}px,0)`;
      const steps = section.querySelector<HTMLElement>(".mt-steps");
      if (steps) {
        // The gold line follows a reading point about halfway down the screen.
        const sr = steps.getBoundingClientRect();
        section.style.setProperty("--ms", Math.max(0, Math.min(1, (window.innerHeight * 0.55 - sr.top) / sr.height)).toFixed(3));
      }
    };
    const onScroll = () => { if (!frame) frame = requestAnimationFrame(drawScroll); };
    if (!nativeScroll && !reduced.matches) { window.addEventListener("scroll", onScroll, { passive: true }); drawScroll(); }

    // Tilt: the layers shift a little with the phone, deeper layers more. Android needs no permission; iPhone only after the hero's Tilt button.
    // Skipped for reduced motion and weak phones, and paused while the page is scrolling.
    const weak = (navigator.hardwareConcurrency || 8) <= 4 || ((navigator as Navigator & { deviceMemory?: number }).deviceMemory || 8) <= 3;
    let visible = false, scrolling = false, scrollTimer = 0, g0 = 0, b0 = 0, haveBase = false, tx = 0, ty = 0, cx = 0, cy = 0, tiltFrame = 0;
    const vio = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
    vio.observe(section);
    const onScrollFlag = () => { scrolling = true; window.clearTimeout(scrollTimer); scrollTimer = window.setTimeout(() => { scrolling = false; }, 140); };
    const drawTilt = () => {
      tiltFrame = 0;
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      for (const [node, , k] of depth) if (node) node.style.translate = `${(cx * k).toFixed(2)}px ${(cy * k * 0.6).toFixed(2)}px`;
      if (Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002) tiltFrame = requestAnimationFrame(drawTilt);
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null || !visible || scrolling || document.hidden) return;
      if (!haveBase) { g0 = e.gamma; b0 = e.beta; haveBase = true; }
      g0 += (e.gamma - g0) * 0.015; b0 += (e.beta - b0) * 0.015;
      tx = Math.max(-1, Math.min(1, (e.gamma - g0) / 14));
      ty = Math.max(-1, Math.min(1, (e.beta - b0) / 14));
      if (!tiltFrame) tiltFrame = requestAnimationFrame(drawTilt);
    };
    const tiltOk = !weak && !reduced.matches && typeof DeviceOrientationEvent !== "undefined" && window.matchMedia("(pointer: coarse)").matches;
    if (tiltOk) {
      window.addEventListener("deviceorientation", onTilt, { passive: true });
      window.addEventListener("scroll", onScrollFlag, { passive: true });
    }

    return () => {
      io.disconnect(); vio.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scroll", onScrollFlag);
      window.removeEventListener("deviceorientation", onTilt);
      cancelAnimationFrame(frame); cancelAnimationFrame(tiltFrame); window.clearTimeout(scrollTimer);
    };
  }, []);

  return (
    <div ref={ref} className="mm-scene" aria-hidden="true">
      <div className="mm-sky" />
      <div className="mm-dusk" />
      <div className="mm-night" />
      <svg className="mm-stars" viewBox="0 0 100 60" preserveAspectRatio="none" focusable="false">
        {STARS.map(([x, y, rad], i) => <ellipse key={i} cx={x} cy={y * 0.6} rx={rad * 0.12} ry={rad * 0.2} fill="#fff" opacity={rad > 1 ? 0.95 : 0.7} />)}
      </svg>
      <div className="mm-sun" />
      <div className="mm-moon" />
      <div className="mm-t mm-t1">
      <svg className="mm-clouds" viewBox="0 0 1600 400" preserveAspectRatio="xMidYMin slice" focusable="false">
        <g fill="#fff">
          {[[300, 90, 1], [880, 170, 1.2], [1260, 80, .8], [620, 250, .7]].map(([x, y, k], i) => (
            <g key={i} transform={`translate(${x} ${y}) scale(${k})`} opacity=".92">
              <ellipse cx="0" cy="0" rx="90" ry="14" /><circle cx="-34" cy="-10" r="22" /><circle cx="2" cy="-22" r="30" /><circle cx="40" cy="-12" r="22" /><circle cx="68" cy="-3" r="14" />
            </g>
          ))}
        </g>
      </svg>
      <svg className="mm-layer mm-far" viewBox="0 0 1600 300" preserveAspectRatio="xMaxYMax slice" focusable="false">
        <defs><linearGradient id="mmg-far" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity=".6" /><stop offset="1" stopColor="currentColor" stopOpacity=".95" /></linearGradient></defs>
        <path d="M0 300V168C90 150 150 110 230 132S360 100 430 128 560 70 650 118 790 96 860 124C930 78 990 40 1052 30 1112 42 1176 92 1232 130 1330 110 1420 136 1500 120S1560 132 1600 128V300Z" fill="url(#mmg-far)" />
      </svg>
      </div>
      <div className="mm-t mm-t2">
      <svg className="mm-layer mm-mid" viewBox="0 0 1600 300" preserveAspectRatio="xMaxYMax slice" focusable="false">
        <path d="M0 300V258C200 236 360 252 520 242S900 262 1100 246 1450 240 1600 256V300Z" fill="currentColor" />
        <g fill="currentColor"><Tree x={1120} y={248} s={1.1} /><Tree x={1180} y={250} s={.8} /><Tree x={1500} y={246} s={1} /><Tree x={1330} y={252} s={.9} /></g>
        <path fill="currentColor" fillRule="evenodd" d="M790 270V238H822V226L940 192 1058 226V238H1090V270ZM830 270V246H840V270ZM856 270V246H866V270ZM882 270V246H892V270ZM908 270V246H918V270ZM934 270V246H944V270ZM960 270V246H970V270ZM986 270V246H996V270ZM1012 270V246H1022V270ZM1038 270V246H1048V270ZM920 214h40v8h-40Z" />
      </svg>
      </div>
      <div className="mm-t mm-t3">
      <svg className="mm-layer mm-near" viewBox="0 0 1600 300" preserveAspectRatio="xMaxYMax slice" focusable="false">
        <path d="M0 300V270C220 252 420 268 640 260S1040 272 1260 258 1500 264 1600 268V300Z" fill="currentColor" />
        <Palm x={1010} s={.95} lean={-1} /><Palm x={1530} s={.82} /><Palm x={1250} s={.66} />
      </svg>
      </div>
      <div className="mm-dim" />
      <div className="mm-warm" />
    </div>
  );
}
