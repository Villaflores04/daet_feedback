import { create } from "zustand";

const KEY = "daet-pulse-desk";
export const DESK_PASSWORD = "daet";

function readFlag() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(KEY) === "1";
}

type DeskState = {
  ready: boolean;
  unlocked: boolean;
  opening: boolean;
  hydrate: () => void;
  unlock: () => void;
  lock: () => void;
  setOpening: (value: boolean) => void;
};

export const useDesk = create<DeskState>((set) => ({
  ready: false,
  unlocked: false,
  opening: false,
  hydrate: () => set({ ready: true, unlocked: readFlag() }),
  unlock: () => {
    localStorage.setItem(KEY, "1");
    set({ unlocked: true, opening: true });
  },
  lock: () => {
    localStorage.removeItem(KEY);
    set({ unlocked: false, opening: false });
  },
  setOpening: (value) => set({ opening: value }),
}));

export function matchesDeskKey(value: string) {
  return value.trim().toLowerCase() === DESK_PASSWORD;
}
