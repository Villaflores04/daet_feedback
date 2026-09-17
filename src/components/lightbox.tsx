"use client";
import { X } from "lucide-react";
import { StoredPhoto } from "@/components/stored-photo";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
export function Lightbox({
  id,
  alt,
  onClose,
}: {
  id: string;
  alt?: string;
  onClose: () => void;
}) {
  const ref = useDialogFocus(true, onClose);
  return (
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={alt ?? "Visitor photo"}
      tabIndex={-1}
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/90 p-4"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <figure className="relative z-10 max-h-[85dvh] max-w-[min(92vw,960px)]">
        <StoredPhoto
          id={id}
          alt={alt ?? "Visitor photo"}
          className="max-h-[85dvh] w-auto max-w-full rounded-lg object-contain"
        />
      </figure>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-20 inline-flex size-11 items-center justify-center rounded-full bg-plate text-ink"
        aria-label="Close photo"
      >
        <X size={20} />
      </button>
    </div>
  );
}
