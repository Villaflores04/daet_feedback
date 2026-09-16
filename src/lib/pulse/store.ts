import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { uid, slugify } from "./ids";
import { ingestDataUrl } from "./photos";
import { SEED_CHANNELS, SEED_PULSES } from "./seed";
import type { Category, Channel, FaceId, Pulse, Wish } from "./types";

export const PULSE_KEY = "daet-pulse-v6";

type DraftPulse = {
  channelId: string;
  parentId?: string | null;
  callsign: string;
  face: FaceId;
  body?: string;
  photo?: string;
};

type DraftWish = {
  name: string;
  where: string;
  why: string;
  category: Category;
  callsign: string;
  photo?: string;
};

type DraftChannel = {
  name: string;
  category: Category;
  blurb: string;
  about: string;
  cover?: string;
  featured?: boolean;
};

type PulseState = {
  channels: Channel[];
  pulses: Pulse[];
  wishes: Wish[];
  myReacts: Record<string, "up" | "down">;
  hydrated: boolean;
  addPulse: (draft: DraftPulse) => Pulse;
  reactPulse: (id: string, side: "up" | "down") => void;
  addWish: (draft: DraftWish) => Wish;
  acceptWish: (id: string) => Channel | null;
  burnWish: (id: string) => void;
  addChannel: (draft: DraftChannel) => Channel;
  updateChannel: (id: string, patch: Partial<Channel>) => void;
  deleteChannel: (id: string) => void;
  burnPulse: (id: string) => void;
  setHydrated: () => void;
};

async function stripDataImage(value?: string) {
  if (value && value.startsWith("data:image")) return ingestDataUrl(value);
  return value;
}

export const usePulse = create<PulseState>()(
  persist(
    (set, get) => ({
      channels: SEED_CHANNELS,
      pulses: SEED_PULSES,
      wishes: [],
      myReacts: {},
      hydrated: false,
      setHydrated: () => set({ hydrated: true }),
      addPulse: (draft) => {
        const pulse: Pulse = {
          id: uid("p"),
          channelId: draft.channelId,
          parentId: draft.parentId ?? null,
          callsign: draft.callsign.trim() || "Visitor",
          face: draft.face,
          body: (draft.body ?? "").trim(),
          photo: draft.photo,
          createdAt: Date.now(),
          reacts: { up: 0, down: 0 },
        };
        set((state) => ({ pulses: [pulse, ...state.pulses] }));
        return pulse;
      },
      reactPulse: (id, side) => {
        set((state) => {
          const current = state.myReacts[id];
          const pulses = state.pulses.map((pulse) => {
            if (pulse.id !== id) return pulse;
            const reacts = { ...pulse.reacts };
            if (current === side) {
              reacts[side] = Math.max(0, reacts[side] - 1);
              return { ...pulse, reacts };
            }
            if (current) {
              reacts[current] = Math.max(0, reacts[current] - 1);
            }
            reacts[side] += 1;
            return { ...pulse, reacts };
          });
          const myReacts = { ...state.myReacts };
          if (current === side) delete myReacts[id];
          else myReacts[id] = side;
          return { pulses, myReacts };
        });
      },
      addWish: (draft) => {
        const wish: Wish = {
          id: uid("w"),
          name: draft.name.trim(),
          where: draft.where.trim(),
          why: draft.why.trim(),
          category: draft.category,
          callsign: draft.callsign.trim() || "Visitor",
          photo: draft.photo,
          status: "open",
          createdAt: Date.now(),
        };
        set((state) => ({ wishes: [wish, ...state.wishes] }));
        return wish;
      },
      acceptWish: (id) => {
        const wish = get().wishes.find((item) => item.id === id);
        if (!wish || wish.status !== "open") return null;
        const slugBase = slugify(wish.name);
        const taken = new Set(get().channels.map((c) => c.slug));
        let slug = slugBase;
        let n = 2;
        while (taken.has(slug)) {
          slug = `${slugBase}-${n}`;
          n += 1;
        }
        const about = [wish.where, wish.why].filter(Boolean).join(" — ");
        const channel: Channel = {
          id: uid("ch"),
          slug,
          name: wish.name,
          category: wish.category,
          featured: false,
          cover: wish.photo || "",
          blurb: wish.why || wish.where || "Added from a visitor wish.",
          about: about || wish.name,
        };
        set((state) => ({
          channels: [...state.channels, channel],
          wishes: state.wishes.map((item) =>
            item.id === id
              ? { ...item, status: "kept" as const, channelId: channel.id }
              : item,
          ),
        }));
        return channel;
      },
      burnWish: (id) => {
        const wish = get().wishes.find((item) => item.id === id);
        if (!wish) return;
        set((state) => {
          let channels = state.channels;
          let pulses = state.pulses;
          if (wish.channelId) {
            channels = channels.filter((c) => c.id !== wish.channelId);
            pulses = pulses.filter((p) => p.channelId !== wish.channelId);
          }
          return {
            channels,
            pulses,
            wishes: state.wishes.filter((item) => item.id !== id),
          };
        });
      },
      addChannel: (draft) => {
        const slugBase = slugify(draft.name);
        const taken = new Set(get().channels.map((c) => c.slug));
        let slug = slugBase;
        let n = 2;
        while (taken.has(slug)) {
          slug = `${slugBase}-${n}`;
          n += 1;
        }
        const channel: Channel = {
          id: uid("ch"),
          slug,
          name: draft.name.trim(),
          category: draft.category,
          featured: Boolean(draft.featured),
          cover: draft.cover || "",
          blurb: draft.blurb.trim(),
          about: draft.about.trim() || draft.blurb.trim(),
        };
        set((state) => ({ channels: [...state.channels, channel] }));
        return channel;
      },
      updateChannel: (id, patch) => {
        set((state) => ({
          channels: state.channels.map((channel) =>
            channel.id === id ? { ...channel, ...patch, id: channel.id } : channel,
          ),
        }));
      },
      deleteChannel: (id) => {
        set((state) => ({
          channels: state.channels.filter((c) => c.id !== id),
          pulses: state.pulses.filter((p) => p.channelId !== id),
          wishes: state.wishes.map((wish) =>
            wish.channelId === id
              ? { ...wish, channelId: undefined }
              : wish,
          ),
        }));
      },
      burnPulse: (id) => {
        set((state) => ({
          pulses: state.pulses.filter(
            (pulse) => pulse.id !== id && pulse.parentId !== id,
          ),
        }));
      },
    }),
    {
      name: PULSE_KEY,
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? {
              getItem: () => null,
              setItem: () => {},
              removeItem: () => {},
            }
          : localStorage,
      ),
      skipHydration: true,
      partialize: (state) => ({
        channels: state.channels,
        pulses: state.pulses,
        wishes: state.wishes,
        myReacts: state.myReacts,
      }),
      onRehydrateStorage: () => async (state) => {
        if (!state) {
          usePulse.getState().setHydrated();
          return;
        }
        try {
          const channels = await Promise.all(
            state.channels.map(async (channel) => ({
              ...channel,
              cover: (await stripDataImage(channel.cover)) ?? "",
            })),
          );
          const pulses = await Promise.all(
            state.pulses.map(async (pulse) => ({
              ...pulse,
              photo: await stripDataImage(pulse.photo),
            })),
          );
          const wishes = await Promise.all(
            state.wishes.map(async (wish) => ({
              ...wish,
              photo: await stripDataImage(wish.photo),
            })),
          );
          usePulse.setState({ channels, pulses, wishes });
        } catch {
          /* keep rehydrated JSON */
        }
        usePulse.getState().setHydrated();
      },
    },
  ),
);

export function rehydratePulse() {
  if (typeof window !== "undefined") {
    const FLAG = "daet-pulse-empty-v6";
    if (localStorage.getItem(FLAG) !== "1") {
      for (const key of Object.keys(localStorage)) {
        if (key.startsWith("daet-pulse") && key !== FLAG) {
          localStorage.removeItem(key);
        }
      }
      try {
        indexedDB.deleteDatabase("daet-pulse-photos");
      } catch {
        /* ignore */
      }
      localStorage.setItem(FLAG, "1");
    }
  }
  void usePulse.persist.rehydrate();
}

export function channelBySlug(slug: string) {
  return usePulse.getState().channels.find((c) => c.slug === slug);
}

export function channelById(id: string) {
  return usePulse.getState().channels.find((c) => c.id === id);
}
