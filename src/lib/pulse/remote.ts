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
