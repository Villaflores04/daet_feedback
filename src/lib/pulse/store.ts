import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { OVERALL_CHANNEL, OVERALL_ID } from "./scope";
import { recordPreviewReward } from "../rewards";
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
  saveSharedChannel, deleteSharedChannel, deleteSharedPulse,
} from "./remote";
import type { Category, Channel, FaceId, Pulse, Wish } from "./types";
export const PULSE_KEY = "daet-pulse-v6";

type DraftPulse = {
  id?: string;
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
  syncStatus: "idle" | "connected" | "partial" | "error";
  syncError: string;
  addPulse: (draft: DraftPulse) => Promise<Pulse>;
  sendReply: (draft: DraftPulse) => Promise<Pulse>;
  reactPulse: (id: string, side: "up" | "down") => Promise<void>;
  addWish: (draft: DraftWish) => Promise<Wish>;
  acceptWish: (id: string) => Promise<Channel>;
  burnWish: (id: string) => Promise<void>;
  addChannel: (draft: DraftChannel, id?: string) => Promise<Channel>;
  updateChannel: (id: string, patch: Partial<Channel>) => Promise<void>;
  deleteChannel: (id: string) => Promise<void>;
  burnPulse: (id: string) => Promise<void>;
  setHydrated: () => void;
  syncShared: () => Promise<boolean>;
};

async function stripDataImage(value?: string) {
  if (value && value.startsWith("data:image")) return ingestDataUrl(value);
  return value;
}

async function sharedCover(photo?: string) {
  if (!photo) return "";
  if (isRemotePhoto(photo) || photo.startsWith("/")) return photo;
  const blob = await getPhotoBlob(photo);
  if (!blob) throw new Error("Please attach the cover photo again.");
  const uploaded = await uploadSharedPhoto(photo, blob);
  if (!uploaded.ok) throw new Error(uploaded.error);
  return uploaded.data;
}

export const usePulse = create<PulseState>()(
  persist(
    (set, get) => ({
      channels: [...SEED_CHANNELS, OVERALL_CHANNEL],
      pulses: SEED_PULSES,
      wishes: [],
      myReacts: {},
      hydrated: false,
      syncStatus: "idle",
      syncError: "",
      setHydrated: () => set({ hydrated: true }),
      syncShared: async () => {
        const snapshot = await fetchPulseSnapshot();
        if (!snapshot.ok) {
          set({ syncStatus: "error", syncError: snapshot.error });
          return false;
        }
        const { channels, pulses, wishes, issues = [] } = snapshot.data;
        set(state => ({
          channels: channels === null ? state.channels : [...channels.filter(c => c.id !== OVERALL_ID), OVERALL_CHANNEL],
          pulses: pulses === null ? state.pulses : pulses,
          wishes: wishes === null ? state.wishes : wishes,
          syncStatus: issues.length ? "partial" : "connected",
          syncError: issues.join(" "),
        }));
        return !issues.length;
      },
      addPulse: async (draft) => {
        const photo = await sharedCover(draft.photo);
        const pulse: Pulse = {
          id: draft.id ?? uid("p"),
          channelId: draft.channelId,
          parentId: draft.parentId ?? null,
          callsign: draft.callsign.trim() || "Visitor",
          face: draft.face,
          body: (draft.body ?? "").trim(),
          photo: photo || undefined,
          createdAt: Date.now(),
          reacts: { up: 0, down: 0 },
        };
        const saved = await saveSharedPulse(pulse);
        if (!saved.ok) throw new Error(saved.error);
        set((state) => ({
          pulses: [saved.data, ...state.pulses.filter(p => p.id !== saved.data.id)],
          channels: saved.data.channelId === OVERALL_ID && !state.channels.some(c => c.id === OVERALL_ID)
            ? [...state.channels, OVERALL_CHANNEL] : state.channels,
        }));
        recordPreviewReward(saved.data);
        return saved.data;
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
      reactPulse: async (id, side) => {
        const save = async () => {
          const next = get().myReacts[id] === side ? null : side;
          const response = await fetch("/api/pulse/reaction", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, side: next }) });
          const data = await response.json();
          if (!response.ok) throw new Error(data.error || "Could not save reaction.");
          set(state => {
            const myReacts = { ...state.myReacts };
            if (data.side) myReacts[id] = data.side; else delete myReacts[id];
            return { myReacts, pulses: state.pulses.map(p => p.id === id ? { ...p, reacts: data.reacts } : p) };
          });
        };
        if (typeof navigator !== "undefined" && navigator.locks) await navigator.locks.request(`daet-reaction-${id}`, save);
        else await save();
      },
      addWish: async (draft) => {
        const photo = await sharedCover(draft.photo);
        const wish: Wish = {
          id: uid("w"),
          name: draft.name.trim(),
          where: draft.where.trim(),
          why: draft.why.trim(),
          category: draft.category,
          callsign: draft.callsign.trim() || "Visitor",
          photo: photo || undefined,
          status: "open",
          createdAt: Date.now(),
        };
        const saved = await saveSharedWish(wish);
        if (!saved.ok) throw new Error(saved.error);
        set((state) => ({ wishes: [saved.data, ...state.wishes.filter(w => w.id !== saved.data.id)] }));
        return saved.data;
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
      addChannel: async (draft, id = uid("ch")) => {
        const cover = await sharedCover(draft.cover);
        const channel: Channel = { ...draft, id, slug: `${slugify(draft.name).slice(0, 70) || "place"}-${id.toLowerCase().replace(/_/g, "-")}`, cover, featured: Boolean(draft.featured) };
        const saved = await saveSharedChannel(channel, true);
        if (!saved.ok) throw new Error(saved.error);
        set(state => ({ channels: [...state.channels.filter(c => c.id !== id), saved.data] }));
        return saved.data;
      },
      updateChannel: async (id, patch) => {
        const current = get().channels.find(c => c.id === id);
        if (!current) throw new Error("This place is no longer available.");
        const cover = await sharedCover(patch.cover);
        const saved = await saveSharedChannel({ ...current, ...patch, cover, id, slug: current.slug }, false);
        if (!saved.ok) throw new Error(saved.error);
        set(state => ({ channels: state.channels.map(c => c.id === id ? saved.data : c) }));
      },
      deleteChannel: async (id) => {
        const result = await deleteSharedChannel(id);
        if (!result.ok) throw new Error(result.error);
        set(state => ({
          channels: state.channels.filter(c => c.id !== id),
          pulses: state.pulses.filter(p => p.channelId !== id),
          wishes: state.wishes.map(w => w.channelId === id ? { ...w, channelId: undefined } : w),
        }));
      },
      burnPulse: async (id) => {
        const result = await deleteSharedPulse(id);
        if (!result.ok) throw new Error(result.error);
        set(state => ({ pulses: state.pulses.filter(p => p.id !== id && p.parentId !== id) }));
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
  // The server is authoritative: replaying cached rows resurrected deleted comments.
  await usePulse.getState().syncShared();
  usePulse.getState().setHydrated();
}

export function channelBySlug(slug: string) {
  return usePulse.getState().channels.find((c) => c.slug === slug);
}

export function channelById(id: string) {
  return usePulse.getState().channels.find((c) => c.id === id);
}
