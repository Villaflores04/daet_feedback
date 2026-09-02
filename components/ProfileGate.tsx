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

export function ProfileChip({ name, onEdit }: { name: string; onEdit: () => void }) {
  if (!name) {
    return (
      <button onClick={onEdit} className="rounded-full border border-gold/40 px-4 py-2 text-sm text-gold hover:bg-gold/10">
        Set your name to review
      </button>
    );
  }
  return (
    <button onClick={onEdit} className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-sand/80 hover:bg-white/10">
      Reviewing as <span className="text-gold">{name}</span>
    </button>
  );
}

export function NameModal({ open, initial, onClose, onSave }: { open: boolean; initial: string; onClose: () => void; onSave: (name: string) => void }) {
  const [value, setValue] = useState(initial);
  useEffect(() => setValue(initial), [initial, open]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/70 p-4 backdrop-blur-sm">
      <div className="glass w-full max-w-md rounded-3xl p-6 shadow-glow">
        <p className="text-xs uppercase tracking-[0.22em] text-gold">Before you speak</p>
        <h3 className="mt-2 font-display text-3xl text-sand">Set a profile name</h3>
        <p className="mt-2 text-sm text-sand/65">No account. No email. Just a name that appears on your rating and comment. Stored only in this browser.</p>
        <input autoFocus value={value} onChange={(e) => setValue(e.target.value)} placeholder="e.g. Ana from Naga" maxLength={40} className="mt-5 w-full rounded-2xl border border-white/10 bg-ink/50 px-4 py-3 outline-none ring-gold/40 focus:ring-2" />
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onClose} className="rounded-full px-4 py-2 text-sand/60 hover:text-sand">Cancel</button>
          <button onClick={() => { if (value.trim().length >= 2) onSave(value.trim()); }} className="rounded-full bg-gold px-5 py-2 font-semibold text-ink">Continue</button>
        </div>
      </div>
    </div>
  );
}
