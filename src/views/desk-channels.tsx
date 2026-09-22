"use client";

import { useState } from "react";
import { toast } from "sonner";
import { PhotoField } from "@/components/photo-field";
import { StoredPhoto } from "@/components/stored-photo";
import { Button } from "@/components/ui/button";
import { usePulse } from "@/lib/pulse/store";
import { CATEGORIES, type Category, type Channel } from "@/lib/pulse/types";
import { cn } from "@/lib/utils";
import { uid } from "@/lib/pulse/ids";
import { createPortal } from "react-dom";

export function DeskChannels() {
  const channels = usePulse((s) => s.channels);
  const addChannel = usePulse((s) => s.addChannel);
  const updateChannel = usePulse((s) => s.updateChannel);
  const deleteChannel = usePulse((s) => s.deleteChannel);
  const [editing, setEditing] = useState<Channel | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">
            Place management
          </p>
          <h1 className="mt-1 font-display text-3xl tracking-tight">Places</h1>
        </div>
        <Button type="button" onClick={() => setEditing("new")}>
          Add place
        </Button>
      </div>

      <ul className="mt-6 grid gap-4 xl:grid-cols-2">
        {channels.map((channel) => (
          <li
            key={channel.id}
            className="flex gap-3 overflow-hidden rounded-2xl bg-plate p-3 shadow-plate"
          >
            <StoredPhoto
              id={channel.cover}
              alt=""
              className="h-20 w-24 shrink-0 rounded-xl object-cover object-[center_72%]"
            />
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{channel.name}</p>
              <p className="text-xs uppercase tracking-[0.12em] text-muted">
                {channel.category}
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  className="h-10 px-2 text-sm text-action"
                  onClick={() => setEditing(channel)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="h-10 px-2 text-sm text-neg"
                  disabled={Boolean(deleting)}
                  onClick={async () => {
                    if (confirm(`Delete ${channel.name} and all its comments and replies?`)) {
                      setDeleting(channel.id);
                      try { await deleteChannel(channel.id); toast("Place deleted"); }
                      catch (cause) { toast.error(cause instanceof Error ? cause.message : "Could not delete place."); }
                      finally { setDeleting(null); }
                    }
                  }}
                >
                  {deleting === channel.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {editing ? (
        <ChannelEditor
          channel={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (draft, id) => {
            if (editing === "new") {
              await addChannel(draft, id);
              toast("Place added");
            } else {
              await updateChannel(editing.id, draft);
              toast("Place updated");
            }
            setEditing(null);
          }}
        />
      ) : null}
    </div>
  );
}

function ChannelEditor({
  channel,
  onClose,
  onSave,
}: {
  channel: Channel | null;
  onClose: () => void;
  onSave: (draft: {
    name: string;
    category: Category;
    blurb: string;
    about: string;
    cover?: string;
  }, id: string) => Promise<void>;
}) {
  const [name, setName] = useState(channel?.name ?? "");
  const [category, setCategory] = useState<Category>(
    channel?.category ?? "Park",
  );
  const [blurb, setBlurb] = useState(channel?.blurb ?? "");
  const [about, setAbout] = useState(channel?.about ?? "");
  const [cover, setCover] = useState<string | undefined>(channel?.cover);
  const [id] = useState(() => channel?.id || uid("ch"));
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState("");

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center lg:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-ink/45"
        aria-label="Close"
        disabled={saving || photoBusy}
        onClick={onClose}
      />
      <div className="relative z-10 max-h-[92svh] w-full overflow-y-auto rounded-t-2xl bg-page p-4 lg:max-w-lg lg:rounded-2xl">
        <h2 className="font-display text-xl tracking-tight">
          {channel ? "Edit place" : "Add place"}
        </h2>
        <fieldset disabled={saving} className="mt-4 space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            aria-label="Place name"
            maxLength={120}
            className="h-12 w-full rounded-xl border border-line bg-plate px-3 outline-none focus:border-teal"
          />
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setCategory(item)}
                className={cn(
                  "h-10 rounded-full px-3 text-sm",
                  category === item ? "bg-teal text-plate" : "bg-cool",
                )}
              >
                {item}
              </button>
            ))}
          </div>
          <textarea
            value={blurb}
            onChange={(e) => setBlurb(e.target.value)}
            placeholder="Blurb"
            aria-label="Short description"
            maxLength={1000}
            rows={2}
            className="w-full rounded-xl border border-line bg-plate px-3 py-2 outline-none focus:border-teal"
          />
          <textarea
            value={about}
            onChange={(e) => setAbout(e.target.value)}
            placeholder="About"
            aria-label="About this place"
            maxLength={5000}
            rows={4}
            className="w-full rounded-xl border border-line bg-plate px-3 py-2 outline-none focus:border-teal"
          />
          <PhotoField value={cover} onChange={setCover} label="Cover photo" onBusyChange={setPhotoBusy} />
          {error ? <p role="alert" className="text-sm text-neg">{error} Your changes are still here.</p> : null}
          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              className="h-12 flex-1"
              disabled={name.trim().length < 2 || saving || photoBusy}
              onClick={async () => {
                if (saving || photoBusy) return;
                setSaving(true); setError("");
                try { await onSave({ name, category, blurb, about, cover }, id); }
                catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save place."); setSaving(false); }
              }}
            >
              {saving ? "Saving…" : photoBusy ? "Preparing photo…" : "Save"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-12"
              onClick={onClose}
              disabled={saving || photoBusy}
            >
              Cancel
            </Button>
          </div>
        </fieldset>
      </div>
    </div>, document.body
  );
}
