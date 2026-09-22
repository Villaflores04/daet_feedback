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
  const [confirming, setConfirming] = useState(false);
  const [adminKey, setAdminKey] = useState("");
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
            disabled={removing}
            onClick={() => {
              const created = acceptWish(wish.id);
              toast(created ? `Kept as ${created.name}` : "Already kept");
            }}
          >
            Add to places
          </Button>
        ) : null}
        <Button
          type="button"
          variant="danger"
          className="h-12 flex-1"
          disabled={removing}
          onClick={() => setConfirming(true)}
        >
          Remove suggestion
        </Button>
      </div>
      {confirming ? <form className="mt-4 rounded-xl border border-line p-4" onSubmit={async event => {
        event.preventDefault();
        if (removing) return;
        setRemoving(true); setError("");
        try {
          await burnWish(wish.id, adminKey);
          setAdminKey("");
          toast("Suggestion removed");
          router.replace("/desk/wishes");
        } catch (cause) {
          setError(cause instanceof Error ? cause.message : "Could not remove suggestion.");
          setRemoving(false);
        }
      }}>
        <p className="text-sm">Remove this suggestion from the inbox? Any accepted place and its feedback will remain.</p>
        <label className="mt-3 block text-sm">Admin removal key<input type="password" autoComplete="off" required value={adminKey} disabled={removing} onChange={e => setAdminKey(e.target.value)} className="mt-1 h-11 w-full rounded-lg border border-line bg-plate px-3" /></label>
        {error ? <p role="alert" className="mt-3 text-sm text-neg">{error}</p> : null}
        <div className="mt-3 flex gap-2"><Button type="submit" variant="danger" disabled={removing}>{removing ? "Removing…" : "Confirm removal"}</Button><Button type="button" variant="ghost" disabled={removing} onClick={() => { setConfirming(false); setAdminKey(""); setError(""); }}>Cancel</Button></div>
      </form> : null}
    </article>
  );
}
