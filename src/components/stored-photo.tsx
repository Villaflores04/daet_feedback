"use client";

import { useEffect, useState, type ImgHTMLAttributes } from "react";
import { getPhotoUrl, peekPhotoUrl, subscribePhotos } from "@/lib/pulse/photos";
import { cn } from "@/lib/utils";

export function StoredPhoto({
  id,
  alt,
  className,
  ...props
}: { id?: string } & Omit<ImgHTMLAttributes<HTMLImageElement>, "src">) {
  const [src, setSrc] = useState<string | null>(() => peekPhotoUrl(id));

  useEffect(() => {
    if (!id) {
      setSrc(null);
      return;
    }
    const cached = peekPhotoUrl(id);
    if (cached) setSrc(cached);
    let alive = true;
    void getPhotoUrl(id).then((url) => {
      if (alive && url) setSrc(url);
    });
    const unsub = subscribePhotos(() => {
      const next = peekPhotoUrl(id);
      if (next) setSrc(next);
    });
    return () => {
      alive = false;
      unsub();
    };
  }, [id]);

  if (!id || !src) {
    return (
      <div
        className={cn("bg-cool", className)}
        aria-hidden
        role="presentation"
      />
    );
  }

  return (
    <img
      loading="lazy"
      decoding="async"
      src={src}
      alt={alt ?? ""}
      className={cn("spot-photo", className)}
      {...props}
    />
  );
}
