import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { uid, slugify } from "./ids";
import { getPhotoBlob, ingestDataUrl, isRemotePhoto } from "./photos";
import { SEED_CHANNELS, SEED_PULSES } from "./seed";
import {
  fetchPulseSnapshot,
  saveSharedPulse,
  saveSharedWish,
  uploadSharedPhoto,
  removeSharedWish,
  acceptSharedWish,
} from "./remote";
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
  sendReply: (draft: DraftPulse) => Promise<Pulse>;
  reactPulse: (id: string, side: "up" | "down") => void;
  addWish: (draft: DraftWish) => Wish;
  acceptWish: (id: string) => Promise<Channel>;
  burnWish: (id: string) => Promise<void>;
  addChannel: (draft: DraftChannel) => Channel;
  updateChannel: (id: string, patch: Partial<Channel>) => void;
  deleteChannel: (id: string) => void;
  burnPulse: (id: string) => void;
  setHydrated: () => void;
  syncShared: () => Promise<boolean>;
};

async function stripDataImage(value?: string) {
  if (value && value.startsWith("data:image")) return ingestDataUrl(value);
  return value;
}

async function publishPulse(pulse: Pulse, get: () => PulseState) {
  let shared = pulse;
  if (pulse.photo && !isRemotePhoto(pulse.photo)) {
    const blob = await getPhotoBlob(pulse.photo);
    if (blob) {
      const uploaded = await uploadSharedPhoto(pulse.photo, blob);
      if (uploaded.ok) shared = { ...pulse, photo: uploaded.data };
    }
  }
  const saved = await saveSharedPulse(shared);
  if (saved.ok) void get().syncShared();
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
      syncShared: async () => {
        const snapshot = await fetchPulseSnapshot();
        if (!snapshot.ok) return false;
        set({
          channels: snapshot.data.channels.length
            ? snapshot.data.channels
            : get().channels,
          pulses: snapshot.data.pulses,
          wishes: snapshot.data.wishes,
        });
        return true;
      },
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
        void publishPulse(pulse, get);
        return pulse;
      },
      sendReply: async (draft) => {
        if (!draft.parentId) throw new Error("Choose a story to reply to.");
        let photo = draft.photo;
        if (photo && !isRemotePhoto(photo)) {
          const blob = await getPhotoBlob(photo);
          if (!blob) throw new Error("Please attach your photo again.");
          const uploaded = await uploadSharedPhoto(photo, blob);
          if (!uploaded.ok) throw new Error(uploaded.error);
          photo = uploaded.data;
        }
        const pulse: Pulse = {
          ...draft, parentId: draft.parentId, id: uid("p"), photo,
          callsign: draft.callsign.trim() || "Visitor",
          body: (draft.body ?? "").trim(),
          createdAt: Date.now(), reacts: { up: 0, down: 0 },
        };
        const saved = await saveSharedPulse(pulse);
        if (!saved.ok) throw new Error(saved.error);
        set((state) => ({ pulses: [saved.data, ...state.pulses.filter((p) => p.id !== saved.data.id)] }));
        return saved.data;
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
        void saveSharedWish(wish).then((saved) => {
          if (saved.ok) void get().syncShared();
        });
        return wish;
      },
      acceptWish: async (id) => {
        const result = await acceptSharedWish(id);
        if (!result.ok) throw new Error(result.error);
        const channel = result.data.channel;
        set(state => ({
          channels: [...state.channels.filter(c => c.id !== channel.id), channel],
          wishes: state.wishes.map(w => w.id === id ? { ...w, status: "kept" as const, channelId: channel.id } : w),
        }));
        return channel;
      },
      burnWish: async (id) => {
        const result = await removeSharedWish(id);
        if (!result.ok) throw new Error(result.error);
        set((state) => ({ wishes: state.wishes.map(wish => wish.id === id ? { ...wish, status: "burned" as const } : wish) }));
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
            channel.id === id
              ? { ...channel, ...patch, id: channel.id }
              : channel,
          ),
        }));
      },
      deleteChannel: (id) => {
        set((state) => ({
          channels: state.channels.filter((c) => c.id !== id),
          pulses: state.pulses.filter((p) => p.channelId !== id),
          wishes: state.wishes.map((wish) =>
            wish.channelId === id ? { ...wish, channelId: undefined } : wish,
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
      },
    },
  ),
);

export async function rehydratePulse() {
  await usePulse.persist.rehydrate();
  const local = usePulse.getState();
  const snapshot = await fetchPulseSnapshot();
  if (snapshot.ok) {
    // Bring forward feedback that was created before the shared database was restored.
    await Promise.all(local.pulses.map((pulse) => saveSharedPulse(pulse)));
    await Promise.all(local.wishes.map((wish) => saveSharedWish(wish)));
    await usePulse.getState().syncShared();
  }
  usePulse.getState().setHydrated();
}

export function channelBySlug(slug: string) {
  return usePulse.getState().channels.find((c) => c.slug === slug);
}

export function channelById(id: string) {
  return usePulse.getState().channels.find((c) => c.id === id);
}
