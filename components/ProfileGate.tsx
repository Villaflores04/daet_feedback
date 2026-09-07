"use client";

import { useEffect, useState } from "react";

const KEY = "daet_profile_name";

export function useProfileName() {
  const [name, setName] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setName(localStorage.getItem(KEY) || "");
    setReady(true);
  }, []);

  function save(next: string) {
    const clean = next.trim();
    setName(clean);
    if (clean) localStorage.setItem(KEY, clean);
    else localStorage.removeItem(KEY);
  }

  return { name, ready, save };
}

export function ProfileChip({
  name,
  onEdit
}: {
  name: string;
  onEdit: () => void;
}) {
  if (!name) {
    return (
      <button onClick={onEdit} className="btn-ghost shrink-0 text-[11px]">
        Set name
      </button>
    );
  }
  return (
    <button onClick={onEdit} className="btn-ghost shrink-0 text-[11px]">
      {name}
    </button>
  );
}

export function NameModal({
  open,
  initial,
  onClose,
  onSave
}: {
  open: boolean;
  initial: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) {
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/35 p-4" onClick={onClose}>
      <div className="card w-full max-w-sm p-4" onClick={(e) => e.stopPropagation()}>
        <p className="eyebrow">Public nickname</p>
        <h3 className="mt-1">This name appears with your pulse</h3>
        <p className="mt-1 text-[12px] text-ink-soft">No account. Saved only on this phone or computer.</p>
        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="e.g. Ana from Naga"
          maxLength={40}
          className="mt-3 w-full px-3 py-2 text-sm outline-none"
        />
        <div className="mt-3 flex gap-2">
          <button onClick={onClose} className="btn-ghost flex-1">
            Cancel
          </button>
          <button
            onClick={() => {
              if (value.trim().length >= 2) onSave(value.trim());
            }}
            className="btn-gold flex-1"
          >
            Save name
          </button>
        </div>
      </div>
    </div>
  );
}
