import { useEffect } from "react";
import { X } from "lucide-react";
import { StoredPhoto } from "@/components/stored-photo";

export function Lightbox({
  id,
  alt,
  onClose,
}: {
  id: string;
  alt?: string;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/80 p-4">
      <button
        type="button"
        className="absolute inset-0"
        aria-label="Close photo"
        onClick={onClose}
      />
      <figure className="relative z-10 max-h-[90svh] max-w-[min(92vw,960px)]">
        <StoredPhoto
          id={id}
          alt={alt ?? "Visitor photo"}
          className="max-h-[90svh] w-auto max-w-full rounded-lg object-contain"
        />
      </figure>
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-20 inline-flex size-11 items-center justify-center rounded-full bg-plate text-ink"
        aria-label="Close"
      >
        <X className="size-5" />
      </button>
    </div>
  );
}
