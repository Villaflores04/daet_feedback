import type { ReactNode } from "react";

export type HeroStat = { value: string | number; label: string };

/** Shared banner for the public pages: the landing painting behind a short title, a one-line intro and live numbers. */
export function PageHero({ eyebrow, title, lede, stats, action }: { eyebrow: string; title: string; lede: string; stats?: HeroStat[]; action?: ReactNode }) {
  return (
    <header className="page-hero">
      <div className="page-hero-copy">
        <p className="page-hero-eyebrow"><span aria-hidden="true" />{eyebrow}</p>
        <h1>{title}</h1>
        <p className="page-hero-lede">{lede}</p>
        {stats?.length ? (
          <ul className="page-hero-stats" aria-label="At a glance">
            {stats.map(stat => <li key={stat.label}><strong>{stat.value}</strong><span>{stat.label}</span></li>)}
          </ul>
        ) : null}
      </div>
      {action ? <div className="page-hero-action">{action}</div> : null}
    </header>
  );
}
