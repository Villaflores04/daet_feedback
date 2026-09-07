import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 bg-shell/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="group">
          <p className="text-[10px] uppercase tracking-[0.22em] text-ink-soft">Municipality of Daet</p>
          <p className="font-display text-2xl tracking-tight text-ink group-hover:text-tide">DAET Pulse</p>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/spots" className="btn-gold px-4 py-2">Places</Link>
          <Link href="/dashboard" className="btn-ghost px-4 py-2">Town pulse</Link>
        </nav>
      </div>
      <div className="horizon-rule" />
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20">
      <div className="horizon-rule" />
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-ink-soft sm:flex-row sm:items-center sm:justify-between">
        <p>Emoji pulse desk · Camarines Norte</p>
        <p>Visitors never sign in.</p>
      </div>
    </footer>
  );
}
