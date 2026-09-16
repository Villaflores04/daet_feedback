"use client";

import type { ReactNode } from "react";
import { BootSplash } from "@/components/boot-splash";
import { HydratePulse } from "@/components/hydrate-pulse";
import { ToasterHost } from "@/components/toaster-host";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <HydratePulse />
      <ToasterHost />
      <BootSplash>{children}</BootSplash>
    </>
  );
}
