import Link from "next/link";
import { PublicChrome } from "@/components/public-chrome";

export function NotFoundPage() {
  return (
    <PublicChrome>
      <main className="px-4 py-20 text-center sm:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">404</p>
        <h1 className="mt-3 font-display text-4xl tracking-tight">
          That spot is off the board.
        </h1>
        <p className="mx-auto mt-4 max-w-md text-muted">
          The page is missing. The beach, the pylon, and the desk are still here.
        </p>
        <Link href="/"
          className="mt-8 inline-flex h-12 items-center rounded-xl bg-teal px-6 text-sm font-medium text-plate"
        >
          Back to Daet
        </Link>
      </main>
    </PublicChrome>
  );
}
