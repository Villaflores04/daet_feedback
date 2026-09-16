"use client";

import { Toaster } from "sonner";

export function ToasterHost() {
  return (
    <Toaster
      position="bottom-center"
      offset={88}
      toastOptions={{
        className:
          "!bg-ink !text-plate !border-ink !rounded-xl !font-[Figtree,sans-serif]",
      }}
    />
  );
}
