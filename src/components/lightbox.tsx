"use client";
import { X } from "lucide-react";
import { createPortal } from "react-dom";
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
  // Escape the animated feed's stacking context so navigation cannot cover Close.
  return createPortal(
    <div
      ref={ref}
      role="dialog"
      aria-modal="true"
      aria-label={alt ?? "Visitor photo"}
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-ink/90 px-4 pb-8 pt-24"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <figure className="relative z-10 max-h-[70dvh] max-w-[min(92vw,960px)]">
        <StoredPhoto
          id={id}
          alt={alt ?? "Visitor photo"}
          className="max-h-[70dvh] w-auto max-w-full rounded-lg object-contain"
        />
      </figure>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-[max(1rem,env(safe-area-inset-top))] z-20 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-plate px-5 text-sm font-semibold text-ink shadow-lg"
        aria-label="Close photo"
      >
        <X size={20} />
        Back to comments
      </button>
    </div>,
    document.body,
  );
}
