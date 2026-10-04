// Retry only replayable Storage uploads with upsert enabled, never database writes.
export async function storageFetch(input: RequestInfo | URL, init?: RequestInit) {
  const url = input instanceof Request ? input.url : String(input);
  const retryable = init?.method?.toUpperCase() === "POST"
    && new URL(url).pathname.startsWith("/storage/v1/object/")
    && new Headers(init.headers).get("x-upsert") === "true"
    && (init.body instanceof ArrayBuffer || init.body instanceof Blob || init.body instanceof FormData);
  if (!retryable) return fetch(input, init);

  for (let attempt = 0; attempt < 3; attempt++) {
    const timeout = AbortSignal.timeout(6000);
    const signal = init?.signal ? AbortSignal.any([init.signal, timeout]) : timeout;
    try {
      const response = await fetch(input, { ...init, signal });
      if (![408, 429, 500, 502, 503, 504].includes(response.status) || attempt === 2) return response;
      await response.body?.cancel();
    } catch (error) {
      if (init?.signal?.aborted || attempt === 2) throw error;
    }
    await new Promise(resolve => setTimeout(resolve, 250 * (attempt + 1)));
  }
  throw new Error("Image upload did not complete.");
}

export function storageFailure(error: unknown) {
  const item = error as { message?: string; status?: number; statusCode?: string; originalError?: unknown; cause?: unknown } | null;
  const message = String(item?.message || "");
  const status = Number(item?.statusCode || item?.status);
  if (status === 401 || status === 403 || /invalid.*key|jwt|unauthorized|row.level.security/i.test(message)) {
    return { code: "STORAGE_AUTH", error: "Image storage access was rejected. The site administrator needs to check SUPABASE_SERVICE_ROLE_KEY in Vercel." };
  }
  if (/bucket.*not found/i.test(message)) {
    return { code: "STORAGE_BUCKET", error: "The pulse-photos storage bucket is missing. The site administrator needs to restore it in Supabase." };
  }
  if (/not configured/i.test(message)) return { code: "STORAGE_CONFIG", error: message };
  if (status === 413 || /maximum.*size|too large/i.test(message)) return { code: "STORAGE_SIZE", error: "This image exceeds the storage limit. Try a smaller JPG or PNG." };
  if (status === 429) return { code: "STORAGE_BUSY", error: "Image storage is busy. Please wait a moment and save again." };
  return { code: "STORAGE_UNAVAILABLE", error: "The server could not reach Supabase image storage after retrying. Please save again. If it continues, the administrator should check the Supabase project status and Vercel Supabase URL." };
}

// Log diagnostic codes only: never credentials, request headers, or uploaded bytes.
export function storageDiagnostic(error: unknown): string {
  const item = error as { code?: string; status?: number; statusCode?: string; cause?: unknown; originalError?: unknown } | null;
  if (!item) return "UNKNOWN";
  if (item.code) return String(item.code).slice(0, 80);
  if (item.cause) return storageDiagnostic(item.cause);
  if (item.originalError) return storageDiagnostic(item.originalError);
  return String(item.statusCode || item.status || "UNKNOWN");
}
