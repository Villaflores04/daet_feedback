import { create } from "zustand";

type DeskState = {
  ready: boolean; unlocked: boolean; opening: boolean;
  hydrate: () => Promise<void>;
  unlock: (password: string) => Promise<void>;
  lock: () => Promise<void>;
  setOpening: (value: boolean) => void;
};
export const useDesk = create<DeskState>((set) => ({
  ready: false, unlocked: false, opening: false,
  hydrate: async () => {
    try {
      const response = await fetch("/api/desk/session", { cache: "no-store" });
      const data = await response.json();
      set({ ready: true, unlocked: response.ok && data.unlocked === true });
    } catch { set({ ready: true, unlocked: false }); }
  },
  unlock: async (password) => {
    const response = await fetch("/api/desk/session", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ password }) });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not open the desk.");
    set({ unlocked: true, opening: true });
  },
  lock: async () => {
    const response = await fetch("/api/desk/session", { method: "DELETE" });
    if (!response.ok) throw new Error("Could not lock the desk. Please try again.");
    set({ unlocked: false, opening: false });
  },
  setOpening: (value) => set({ opening: value }),
}));
