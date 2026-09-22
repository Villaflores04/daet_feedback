"use client";

import Link from "next/link";
import { useState } from "react";
import { Inbox, LayoutList, MapPinned, ScrollText } from "lucide-react";
import { Wordmark } from "@/components/mark";
import { useDesk } from "@/lib/pulse/desk";
import { usePulse } from "@/lib/pulse/store";

export function DeskIndex() {
  const unlocked = useDesk((s) => s.unlocked);
  if (!unlocked) return <DeskLogin />;
  return <DeskHome />;
}

function DeskLogin() {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const unlock = useDesk((s) => s.unlock);

  return (
    <main className="relative isolate min-h-svh overflow-hidden bg-page">
      <img
        src="/hero.jpg"
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-[center_68%]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-page via-page/82 to-ink/20" />
      <div className="relative mx-auto flex min-h-svh max-w-6xl flex-col justify-end px-4 pb-16 pt-16 sm:px-6 lg:justify-center lg:items-end lg:pb-20">
        <div className="rise w-full max-w-md rounded-2xl bg-white/95 p-7 shadow-plate">
          <Wordmark />
          <h1 className="mt-6 font-display text-[2.05rem] leading-[1.12] tracking-[-0.03em] text-ink sm:text-4xl">
            Municipal desk
          </h1>
          <p className="mt-3 text-base text-muted">
            Manage the guide and review visitor feedback on this device.
          </p>
          <form
            className="mt-6 rounded-2xl bg-plate p-5 shadow-plate"
            onSubmit={async (event) => {
              event.preventDefault();
              if (pending) return;
              setPending(true); setError("");
              try { await unlock(value); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not open the desk."); } finally { setPending(false); }
            }}
          >
            <p className="text-sm font-medium text-muted">
              Sign in once to manage suggestions and places.
            </p>
            <label className="mt-3 block">
              <span className="sr-only">Shared key</span>
              <input
                autoFocus
                type="password"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError("");
                }}
                className="h-12 w-full rounded-xl border border-line bg-page px-3 outline-none focus:border-teal"
                placeholder="Shared key"
                autoComplete="off"
              />
            </label>
            {error ? (
              <p className="mt-2 text-sm text-neg">
                {error}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={pending}
              className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal text-sm font-medium text-plate"
            >
              {pending ? "Opening…" : "Open desk"}
            </button>
          </form>
          <Link
            href="/"
            className="mt-4 inline-flex h-11 items-center text-sm font-medium text-action"
          >
            Back to visitor site
          </Link>
        </div>
      </div>
    </main>
  );
}

function DeskHome() {
  const openWishCount = usePulse((s) =>
    s.wishes.reduce((n, wish) => n + (wish.status === "open" ? 1 : 0), 0),
  );
  const ticketCount = usePulse((s) =>
    s.pulses.reduce((n, pulse) => n + (pulse.parentId ? 0 : 1), 0),
  );
  const placeCount = usePulse((s) => s.channels.length);

  const cards = [
    {
      to: "/desk/board" as const,
      label: "Sentiment",
      hint: "Emoji ratings & visitor notes",
      icon: LayoutList,
    },
    {
      to: "/desk/channels" as const,
      label: "Places",
      hint: `${placeCount} places`,
      icon: MapPinned,
    },
    {
      to: "/desk/wishes" as const,
      label: "Suggestions",
      hint: `${openWishCount} open`,
      icon: Inbox,
    },
    {
      to: "/desk/log" as const,
      label: "Activity",
      hint: `${ticketCount} tickets`,
      icon: ScrollText,
    },
  ];

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Officer</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">
        A view of the town.
      </h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Manage places, review visitor feedback, and follow up on suggestions.
        Suggestion approvals and removals are saved to the shared database.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.to}>
              <Link
                href={card.to}
                className="flex items-center gap-4 rounded-2xl bg-plate p-5 shadow-plate"
              >
                <span className="inline-flex size-11 items-center justify-center rounded-xl bg-cool text-teal">
                  <Icon className="size-5" />
                </span>
                <span>
                  <span className="block font-display text-xl tracking-tight">
                    {card.label}
                  </span>
                  <span className="text-sm text-muted">{card.hint}</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
