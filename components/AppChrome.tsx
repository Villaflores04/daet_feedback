"use client";

import { usePathname } from "next/navigation";
import { AdminNav } from "./AdminNav";
import { Footer, Nav } from "./Nav";

export function AppChrome({ children }: { children: React.ReactNode }) {
  const path = usePathname() || "/";
  const isAdmin = path.startsWith("/admin");

  return (
    <>
      {isAdmin ? <AdminNav /> : <Nav />}
      <main className="mx-auto min-h-[70vh] max-w-6xl px-3 py-4 md:px-5 md:py-6">{children}</main>
      {isAdmin ? null : <Footer />}
    </>
  );
}
