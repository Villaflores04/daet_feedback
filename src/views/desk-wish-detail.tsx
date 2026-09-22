"use client";

import { useRouter, useParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { StoredPhoto } from "@/components/stored-photo";
import { Button } from "@/components/ui/button";
import { usePulse } from "@/lib/pulse/store";

export function WishDetail() {
  const params = useParams();
  const id = String(params.id ?? "");
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");
  const hydrated = usePulse(s => s.hydrated);
  const wish = usePulse((s) => s.wishes.find((item) => item.id === id));
  const acceptWish = usePulse((s) => s.acceptWish);
  const burnWish = usePulse((s) => s.burnWish);
  const channel = usePulse((s) =>
    wish?.channelId
      ? s.channels.find((c) => c.id === wish.channelId)
      : undefined,
  );

  if (!wish || wish.status === "burned") return <div className="py-8"><p>{!hydrated ? "Loading suggestion…" : removing ? "Returning to suggestions…" : "This suggestion is no longer available."}</p><Link href="/desk/wishes" className="inline-flex min-h-11 items-center text-teal">Back to suggestions</Link></div>;

  return (
    <article className="mx-auto max-w-xl">
      <Link
        href="/desk/wishes"
        className="inline-flex h-11 items-center text-sm text-action"
      >
        All suggestions
      </Link>
      <h1 className="mt-3 font-display text-3xl tracking-tight">{wish.name}</h1>
      <p className="mt-1 text-sm text-muted">
        {wish.category} · {wish.callsign} · {wish.status}
      </p>
      {wish.photo ? (
        <StoredPhoto
          id={wish.photo}
          alt={wish.name}
          className="mt-4 h-48 w-full rounded-2xl object-cover object-[center_72%]"
        />
      ) : null}
      <dl className="mt-5 space-y-3 text-sm">
        <div>
          <dt className="text-muted">Where in Daet</dt>
          <dd className="mt-1 text-ink">{wish.where || "—"}</dd>
        </div>
        <div>
          <dt className="text-muted">Why visitors recommend it</dt>
          <dd className="mt-1 text-ink">{wish.why || "—"}</dd>
        </div>
      </dl>
      {channel ? (
        <p className="mt-4 text-sm text-pos">Kept as {channel.name}.</p>
      ) : null}
      <div className="mt-6 flex gap-2">
        {wish.status === "open" ? (
          <Button
            type="button"
            className="h-12 flex-1"
            disabled={removing || adding}
            onClick={async () => {
              if (adding || removing) return;
              setAdding(true); setError("");
              try {
                const created = await acceptWish(wish.id);
                toast(`Added ${created.name} to places`);
              } catch (cause) {
                setError(cause instanceof Error ? cause.message : "Could not add this place.");
              } finally { setAdding(false); }
            }}
          >
            {adding ? "Adding…" : "Add to places"}
          </Button>
        ) : null}
        <Button
          type="button"
          variant="danger"
          className="h-12 flex-1"
          disabled={removing || adding}
          onClick={async () => {
            if (removing || adding) return;
            setRemoving(true); setError("");
            try {
              await burnWish(wish.id);
              toast("Suggestion removed");
              router.replace("/desk/wishes");
            } catch (cause) {
              setError(cause instanceof Error ? cause.message : "Could not remove suggestion.");
              setRemoving(false);
            }
          }}
        >
          {removing ? "Removing…" : "Remove suggestion"}
        </Button>
      </div>
      {error ? <p role="alert" className="mt-3 text-sm text-neg">{error} <Link href="/desk" className="underline">Open admin desk</Link></p> : null}
      {channel ? <Link href={`/spots/${channel.slug}`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-teal">View place</Link> : null}
    </article>
  );
}
