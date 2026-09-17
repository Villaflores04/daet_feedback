"use client";
import { useId, type ReactNode } from "react";
import { X } from "lucide-react";
import { useDialogFocus } from "@/hooks/use-dialog-focus";
import { cn } from "@/lib/utils";
export function SheetFrame({
  open,
  onClose,
  title,
  children,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  wide?: boolean;
}) {
  const ref = useDialogFocus(open, onClose);
  const titleId = useId();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6">
      <div
        className="sheet-backdrop absolute inset-0 bg-ink/45 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "sheet-panel relative z-10 flex max-h-[92dvh] w-full flex-col rounded-t-2xl bg-page shadow-plate sm:max-h-[86dvh] sm:rounded-xl",
          wide ? "sm:max-w-xl" : "sm:max-w-lg",
        )}
      >
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-line px-5 py-4">
          <h2 id={titleId} className="font-display text-2xl tracking-tight">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex size-11 items-center justify-center rounded-full bg-cool"
            aria-label="Close dialog"
          >
            <X size={19} />
          </button>
        </header>
        <div className="overflow-y-auto overscroll-contain px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
