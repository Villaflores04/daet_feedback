import { createFileRoute, Link } from "@tanstack/react-router";
import { StoredPhoto } from "@/components/stored-photo";
import { usePulse } from "@/lib/pulse/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/desk/wishes")({
  component: DeskWishes,
});

function DeskWishes() {
  const wishes = usePulse((s) => s.wishes);

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-muted">Inbox</p>
      <h1 className="mt-1 font-display text-3xl tracking-tight">Wishes</h1>
      {wishes.length === 0 ? (
        <p className="mt-8 rounded-2xl bg-plate px-4 py-10 text-center text-sm text-muted shadow-plate">
          No wishes on the desk.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {wishes.map((wish) => (
            <li key={wish.id}>
              <Link
                to="/desk/wishes/$id"
                params={{ id: wish.id }}
                className="flex gap-3 rounded-2xl bg-plate p-3 shadow-plate"
              >
                <StoredPhoto
                  id={wish.photo}
                  alt=""
                  className="h-20 w-20 shrink-0 rounded-xl object-cover object-[center_72%]"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{wish.name}</p>
                  <p className="truncate text-sm text-muted">{wish.where}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-muted">{wish.why}</p>
                  <p className="mt-1 text-xs text-muted">
                    {wish.callsign}
                    <span
                      className={cn(
                        "ml-2 uppercase tracking-[0.12em]",
                        wish.status === "open" && "text-action",
                        wish.status === "kept" && "text-pos",
                      )}
                    >
                      {wish.status}
                    </span>
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
