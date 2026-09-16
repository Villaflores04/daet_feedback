import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Inbox, LayoutList, MapPinned, ScrollText } from "lucide-react";
import { Wordmark } from "@/components/mark";
import { matchesDeskKey, useDesk } from "@/lib/pulse/desk";
import { usePulse } from "@/lib/pulse/store";

export const Route = createFileRoute("/desk/")({
  component: DeskIndex,
});

function DeskIndex() {
  const unlocked = useDesk((s) => s.unlocked);
  if (!unlocked) return <DeskLogin />;
  return <DeskHome />;
}

function DeskLogin() {
  const [value, setValue] = useState("");
  const [error, setError] = useState(false);
  const unlock = useDesk((s) => s.unlock);

  return (
    <main className="relative flex min-h-svh items-center justify-center bg-page px-4">
      <div className="w-full max-w-sm">
        <form
          className="rounded-2xl bg-plate p-6 shadow-plate"
          onSubmit={(event) => {
            event.preventDefault();
            if (!matchesDeskKey(value)) {
              setError(true);
              return;
            }
            unlock();
          }}
        >
          <Wordmark />
          <h1 className="mt-6 font-display text-2xl tracking-tight">
            Type the shared key
          </h1>
          <p className="mt-2 text-sm text-muted">
            Hint visible: <span className="font-medium text-ink">daet</span>
          </p>
          <input
            autoFocus
            type="password"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(false);
            }}
            className="mt-5 h-12 w-full rounded-xl border border-line bg-page px-3 outline-none focus:border-teal"
            placeholder="Shared key"
            autoComplete="off"
          />
          {error ? (
            <p className="mt-2 text-sm text-neg">That key does not open the desk.</p>
          ) : null}
          <button
            type="submit"
            className="mt-4 inline-flex h-12 w-full items-center justify-center rounded-xl bg-teal text-sm font-medium text-plate"
          >
            Open desk
          </button>
        </form>
        <Link
          to="/"
          className="mt-4 inline-flex h-11 w-full items-center justify-center text-sm font-medium text-action"
        >
          Back to visitor site
        </Link>
      </div>
    </main>
  );
}

function DeskHome() {
  const openWishCount = usePulse(
    (s) => s.wishes.reduce((n, wish) => n + (wish.status === "open" ? 1 : 0), 0),
  );
  const ticketCount = usePulse(
    (s) => s.pulses.reduce((n, pulse) => n + (pulse.parentId ? 0 : 1), 0),
  );
  const placeCount = usePulse((s) => s.channels.length);

  const cards = [
    {
      to: "/desk/board" as const,
      label: "Board",
      hint: "Two instruments",
      icon: LayoutList,
    },
    {
      to: "/desk/channels" as const,
      label: "Channels",
      hint: `${placeCount} places`,
      icon: MapPinned,
    },
    {
      to: "/desk/wishes" as const,
      label: "Wishes",
      hint: `${openWishCount} open`,
      icon: Inbox,
    },
    {
      to: "/desk/log" as const,
      label: "Log",
      hint: `${ticketCount} tickets`,
      icon: ScrollText,
    },
  ];

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Officer</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">Desk</h1>
      <p className="mt-2 max-w-lg text-sm text-muted">
        Shared kiosk key. Charts load when Board is opened. This device only.
      </p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <li key={card.to}>
              <Link
                to={card.to}
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
