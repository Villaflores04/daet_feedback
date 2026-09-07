import Link from "next/link";

function Mark() {
  return (
    <svg viewBox="0 0 32 32" className="h-7 w-7 shrink-0" aria-hidden>
      <circle cx="16" cy="10.5" r="5.2" fill="var(--dp-gold)" />
      <path d="M4 19.5c3.6-3.1 7.2-4.6 12-4.6s8.4 1.5 12 4.6" fill="none" stroke="var(--dp-tide)" strokeWidth="2" strokeLinecap="round" />
      <path d="M6 24.2c3.1-2.2 6.4-3.2 10-3.2s6.9 1 10 3.2" fill="none" stroke="var(--dp-tide)" strokeWidth="1.5" strokeLinecap="round" opacity="0.45" />
    </svg>
  );
}

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-[var(--line)] bg-shell/92 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-3 py-2 md:px-5">
        <Link href="/" className="flex min-w-0 items-center gap-2">
          <Mark />
          <span>
            <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-ink-soft">Municipality of Daet</p>
            <p className="font-display text-[1.05rem] leading-none text-ink">DAET Pulse</p>
          </span>
        </Link>
        <nav className="flex shrink-0 items-center gap-1">
          <Link href="/spots" className="btn-gold">
            Places
          </Link>
          <Link href="/dashboard" className="btn-ghost">
            Town pulse
          </Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-8">
      <div className="horizon-rule" />
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-3 py-6 text-[11px] text-ink-soft sm:flex-row sm:items-center sm:justify-between md:px-5">
        <p>Visitor pulse desk · Camarines Norte</p>
        <p>Visitors never sign in.</p>
      </div>
    </footer>
  );
}
