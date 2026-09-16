const DB_NAME = "daet-pulse-photos";
const STORE = "files";
const MAX_EDGE = 1400;

const urlCache = new Map<string, string>();
const listeners = new Set<() => void>();

function notify() {
  for (const fn of listeners) fn();
}

export function subscribePhotos(fn: () => void) {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function isRemotePhoto(id: string) {
  return (
    id.startsWith("/") || id.startsWith("http") || id.startsWith("blob:")
  );
}

export async function putPhoto(id: string, blob: Blob) {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  const prev = urlCache.get(id);
  if (prev) URL.revokeObjectURL(prev);
  urlCache.set(id, URL.createObjectURL(blob));
  notify();
}

export async function getPhotoUrl(id: string): Promise<string | null> {
  if (!id) return null;
  if (isRemotePhoto(id)) return id;
  const cached = urlCache.get(id);
  if (cached) return cached;
  try {
    const db = await openDb();
    const blob = await new Promise<Blob | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(id);
      req.onsuccess = () => resolve(req.result as Blob | undefined);
      req.onerror = () => reject(req.error);
    });
    if (!blob) return null;
    const url = URL.createObjectURL(blob);
    urlCache.set(id, url);
    notify();
    return url;
  } catch {
    return null;
  }
}

export function peekPhotoUrl(id: string | undefined) {
  if (!id) return null;
  if (isRemotePhoto(id)) return id;
  return urlCache.get(id) ?? null;
}

export async function resizeFile(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) return file;
  ctx.drawImage(bitmap, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob((b) => resolve(b), "image/jpeg", 0.84),
  );
  bitmap.close();
  return blob ?? file;
}

export async function ingestFile(file: File): Promise<string> {
  const blob = await resizeFile(file);
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `ph-${Date.now()}`;
  await putPhoto(id, blob);
  return id;
}

export async function ingestDataUrl(dataUrl: string): Promise<string> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `ph-${Date.now()}`;
  await putPhoto(id, blob);
  return id;
}

export async function deletePhoto(id: string) {
  if (!id || isRemotePhoto(id)) return;
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  const prev = urlCache.get(id);
  if (prev) URL.revokeObjectURL(prev);
  urlCache.delete(id);
}
