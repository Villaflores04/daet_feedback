import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { FacePicker } from "@/components/face-picker";
import { PhotoField } from "@/components/photo-field";
import { PublicChrome } from "@/components/public-chrome";
import { StoredPhoto } from "@/components/stored-photo";
import { Button } from "@/components/ui/button";
import { usePulse } from "@/lib/pulse/store";
import type { FaceId } from "@/lib/pulse/types";
import { useCallsign } from "@/lib/pulse/visitor";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/transmit")({ component: TransmitPage });

function TransmitPage() {
  const channels = usePulse((s) => s.channels);
  const addPulse = usePulse((s) => s.addPulse);
  const navigate = useNavigate();
  const { callsign, setCallsign } = useCallsign();
  const [channelId, setChannelId] = useState<string | null>(
    channels[0]?.id ?? null,
  );
  const [face, setFace] = useState<FaceId | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();

  useEffect(() => {
    if (callsign && !name) setName(callsign);
  }, [callsign, name]);

  const send = () => {
    if (!channelId) {
      toast("Pick a place.");
      return;
    }
    if (!face) {
      toast("Pick one official face.");
      return;
    }
    const next = name.trim() || callsign || "Visitor";
    setCallsign(next);
    const pulse = addPulse({
      channelId,
      callsign: next,
      face,
      body,
      photo,
    });
    toast("Pulse sent");
    void navigate({ to: "/live", search: { pulse: pulse.id } });
  };

  return (
    <PublicChrome>
      <main className="mx-auto max-w-xl px-4 py-5 sm:px-6">
        <p className="text-xs uppercase tracking-[0.18em] text-muted">Share</p>
        <h1 className="mt-1 font-display text-3xl tracking-tight">
          Share your experience
        </h1>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {channels.map((channel) => {
            const selected = channel.id === channelId;
            return (
              <button
                key={channel.id}
                type="button"
                onClick={() => setChannelId(channel.id)}
                className={cn(
                  "flex h-[4.5rem] items-center gap-2 overflow-hidden rounded-xl bg-plate pr-2 text-left shadow-plate",
                  selected && "ring-2 ring-teal",
                )}
              >
                <StoredPhoto
                  id={channel.cover}
                  alt=""
                  className="h-full w-16 shrink-0 object-cover object-[center_72%]"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium leading-tight">
                    {channel.name}
                  </span>
                  <span className="text-[0.65rem] uppercase tracking-[0.12em] text-muted">
                    {channel.category}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <FacePicker value={face} onChange={setFace} />
        </div>

        <div className="mt-5 space-y-3">
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">Callsign</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your nickname"
              className="h-12 w-full rounded-xl border border-line bg-plate px-3 outline-none focus:border-teal"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-sm font-medium">
              Note (optional)
            </span>
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              placeholder="What did you notice?"
              className="w-full rounded-xl border border-line bg-plate px-3 py-3 outline-none focus:border-teal"
            />
          </label>
          <PhotoField value={photo} onChange={setPhoto} />
          <Button
            type="button"
            className="h-12 w-full"
            disabled={!face || !channelId}
            onClick={send}
          >
            Send
          </Button>
        </div>
      </main>
    </PublicChrome>
  );
}
