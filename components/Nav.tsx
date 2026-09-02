import Link from "next/link";

export function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#07131c]/75 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Link href="/" className="group">
          <p className="text-[10px] uppercase tracking-[0.28em] text-gold/80">Municipality of Daet</p>
          <p className="font-display text-2xl tracking-tight text-sand group-hover:text-gold">DAET Pulse</p>
        </Link>
        <nav className="flex items-center gap-2 text-sm">
          <Link href="/spots" className="rounded-full px-4 py-2 text-sand/80 hover:bg-white/5 hover:text-sand">Spots</Link>
          <Link href="/dashboard" className="rounded-full bg-gold px-4 py-2 font-semibold text-ink hover:bg-[#f0d48a]">Live pulse</Link>
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-20 border-t border-white/5">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-5 py-10 text-sm text-sand/50 sm:flex-row sm:items-center sm:justify-between">
        <p>Tourist sentiment desk · Camarines Norte</p>
        <p>Visitors never sign in. Officers use the <a href="/admin" className="text-gold/70 hover:text-gold">tourism desk</a>.</p>
      </div>
    </footer>
  );
}
