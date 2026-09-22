"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { StoredPhoto } from "@/components/stored-photo";
import { ingestFile } from "@/lib/pulse/photos";

export function PhotoField({
  value,
  onChange,
  label = "Photo (optional)",
  onBusyChange,
}: {
  value?: string;
  onChange: (id?: string) => void;
  label?: string;
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">{label}</p>
      {value ? (
        <div className="relative w-40">
          <StoredPhoto
            id={value}
            alt="Selected photo"
            className="h-28 w-40 rounded-xl object-cover object-[center_72%]"
          />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute right-1 top-1 inline-flex size-9 items-center justify-center rounded-full bg-plate text-ink shadow-plate"
            aria-label="Remove photo"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-cool px-4 text-sm font-medium text-ink"
        >
          <ImagePlus className="size-4" />
          {busy ? "Preparing…" : "Add a photo"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (!file) return;
          setBusy(true);
          onBusyChange?.(true);
          setError("");
          try {
            const id = await ingestFile(file);
            onChange(id);
          } catch {
            setError("Could not prepare this photo. Try a JPG or PNG image.");
          } finally {
            setBusy(false);
            onBusyChange?.(false);
          }
        }}
      />
      {error ? <p role="alert" className="mt-2 text-sm text-neg">{error}</p> : null}
    </div>
  );
}
