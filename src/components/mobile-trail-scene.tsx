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
    return () => io.disconnect();
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
      <svg className="mm-layer mm-mid" viewBox="0 0 1600 300" preserveAspectRatio="xMaxYMax slice" focusable="false">
        <path d="M0 300V258C200 236 360 252 520 242S900 262 1100 246 1450 240 1600 256V300Z" fill="currentColor" />
        <g fill="currentColor"><Tree x={1120} y={248} s={1.1} /><Tree x={1180} y={250} s={.8} /><Tree x={1500} y={246} s={1} /><Tree x={1330} y={252} s={.9} /></g>
        <path fill="currentColor" fillRule="evenodd" d="M790 270V238H822V226L940 192 1058 226V238H1090V270ZM830 270V246H840V270ZM856 270V246H866V270ZM882 270V246H892V270ZM908 270V246H918V270ZM934 270V246H944V270ZM960 270V246H970V270ZM986 270V246H996V270ZM1012 270V246H1022V270ZM1038 270V246H1048V270ZM920 214h40v8h-40Z" />
      </svg>
      <svg className="mm-layer mm-near" viewBox="0 0 1600 300" preserveAspectRatio="xMaxYMax slice" focusable="false">
        <path d="M0 300V270C220 252 420 268 640 260S1040 272 1260 258 1500 264 1600 268V300Z" fill="currentColor" />
        <Palm x={1010} s={.95} lean={-1} /><Palm x={1530} s={.82} /><Palm x={1250} s={.66} />
      </svg>
      <div className="mm-dim" />
      <div className="mm-warm" />
    </div>
  );
}
