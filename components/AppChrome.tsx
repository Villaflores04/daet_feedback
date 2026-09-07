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
      <main className="mx-auto min-h-[70vh] max-w-6xl px-4 py-5 md:px-5 md:py-10">{children}</main>
      {isAdmin ? null : <Footer />}
    </>
  );
}
