"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";
import { StoredPhoto } from "@/components/stored-photo";
import { ingestFile, recordPhotoConsent } from "@/lib/pulse/photos";

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
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-ink">{label}</p>
      <label className="mb-3 flex min-h-11 cursor-pointer items-start gap-3 rounded-xl bg-cool p-3 text-sm leading-5">
        <input type="checkbox" checked={consent} disabled={busy} className="mt-1 size-5 shrink-0 accent-blue-600" onChange={e => { setConsent(e.target.checked); if (!e.target.checked) onChange(undefined); }} />
        <span>I have permission to share this photo and allow it to be displayed publicly within DAET-CONNECT. Avoid private information or photos of people without their permission.</span>
      </label>
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
            className="absolute right-1 top-1 inline-flex size-11 items-center justify-center rounded-full bg-plate text-ink shadow-plate"
            aria-label="Remove photo"
          >
            <X className="size-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy || !consent}
          className="disabled:opacity-50 inline-flex h-12 items-center gap-2 rounded-xl bg-cool px-4 text-sm font-medium text-ink"
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
          if (!file || !consent) return;
          setBusy(true);
          onBusyChange?.(true);
          setError("");
          try {
            const id = await ingestFile(file);
            recordPhotoConsent(id);
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
