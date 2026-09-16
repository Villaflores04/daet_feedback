"use client";

import { useRouter, useParams, notFound } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { StoredPhoto } from "@/components/stored-photo";
import { Button } from "@/components/ui/button";
import { usePulse } from "@/lib/pulse/store";

export function WishDetail() {
  const params = useParams();
  const id = String(params.id ?? "");
  const router = useRouter();
  const wish = usePulse((s) => s.wishes.find((item) => item.id === id));
  const acceptWish = usePulse((s) => s.acceptWish);
  const burnWish = usePulse((s) => s.burnWish);
  const channel = usePulse((s) =>
    wish?.channelId
      ? s.channels.find((c) => c.id === wish.channelId)
      : undefined,
  );

  if (!wish) throw notFound();

  return (
    <article className="mx-auto max-w-xl">
      <Link href="/desk/wishes" className="inline-flex h-11 items-center text-sm text-action">
        All wishes
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
          <dt className="text-muted">Why it should be on the board</dt>
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
            onClick={() => {
              const created = acceptWish(wish.id);
              toast(created ? `Kept as ${created.name}` : "Already kept");
            }}
          >
            Accept
          </Button>
        ) : null}
        <Button
          type="button"
          variant="danger"
          className="h-12 flex-1"
          onClick={() => {
            burnWish(wish.id);
            toast("Wish burned");
            router.push("/desk/wishes");
          }}
        >
          Burn
        </Button>
      </div>
    </article>
  );
}
