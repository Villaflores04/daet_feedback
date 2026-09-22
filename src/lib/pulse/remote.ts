import type { Channel, Pulse, Wish } from "./types";

export type PulseSnapshot = {
  channels: Channel[];
  pulses: Pulse[];
  wishes: Wish[];
};

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

async function request<T>(
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Result<T>> {
  try {
    const response = await fetch(input, {
      cache: "no-store",
      ...init,
      headers: { "content-type": "application/json", ...init?.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return {
        ok: false,
        error: String(data.error || "Shared feedback is unavailable."),
      };
    }
    return { ok: true, data: data as T };
  } catch {
    return { ok: false, error: "Could not reach the shared feedback service." };
  }
}

export function fetchPulseSnapshot() {
  return request<PulseSnapshot>("/api/pulse");
}

export function saveSharedPulse(pulse: Pulse) {
  return request<Pulse>("/api/pulse", {
    method: "POST",
    body: JSON.stringify({ action: "pulse", pulse }),
  });
}

export function saveSharedWish(wish: Wish) {
  return request<Wish>("/api/pulse", {
    method: "POST",
    body: JSON.stringify({ action: "wish", wish }),
  });
}

export function removeSharedWish(id: string, adminKey: string) {
  return request<{ id: string }>("/api/desk/wishes", {
    method: "DELETE",
    headers: { "x-admin-key": adminKey },
    body: JSON.stringify({ id }),
  });
}

export async function uploadSharedPhoto(id: string, file: Blob) {
  try {
    const form = new FormData();
    form.set("id", id);
    form.set("file", file, `${id}.jpg`);
    const response = await fetch("/api/pulse/photo", {
      method: "POST",
      body: form,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || typeof data.url !== "string") {
      return {
        ok: false as const,
        error: String(data.error || "Could not save the image."),
      };
    }
    return { ok: true as const, data: data.url };
  } catch {
    return { ok: false as const, error: "Could not reach the image service." };
  }
}
