"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Check, ChevronDown, MapPin } from "lucide-react";

export type DestinationOption = { id: string; name: string; note?: string };

/** A phone-friendly replacement for a native <select>: the list opens inside the card, wraps long names and never spills past the screen. */
export function DestinationPicker({ options, value, onChange, disabled }: {
  options: DestinationOption[]; value: string; onChange: (id: string) => void; disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const listId = useId();
  const selected = options.find(o => o.id === value);

  useEffect(() => {
    if (!open) return;
    const away = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("pointerdown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  return <div className="dest-picker" ref={root}>
    <button type="button" className="dest-trigger" aria-haspopup="listbox" aria-expanded={open} aria-controls={listId}
      disabled={disabled} data-empty={!selected} onClick={() => setOpen(o => !o)}>
      <MapPin size={18} aria-hidden />
      <span>{selected?.name || "Choose a destination"}</span>
      <ChevronDown size={18} aria-hidden className="dest-chevron" />
    </button>
    {open && <ul id={listId} className="dest-list" role="listbox" aria-label="Destination">
      {options.map(o => <li key={o.id} role="option" aria-selected={o.id === value}>
        <button type="button" onClick={() => { onChange(o.id); setOpen(false); }}>
          <span>{o.name}{o.note && <small>{o.note}</small>}</span>
          {o.id === value && <Check size={18} aria-hidden />}
        </button>
      </li>)}
    </ul>}
  </div>;
}
