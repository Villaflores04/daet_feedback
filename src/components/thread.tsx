import { useEffect, useMemo, useRef, useState } from "react";
import { FacePicker } from "@/components/face-picker";
import { PhotoField } from "@/components/photo-field";
import { PulseCard } from "@/components/pulse-card";
import { Button } from "@/components/ui/button";
import { usePulse } from "@/lib/pulse/store";
import type { Channel, FaceId, Pulse } from "@/lib/pulse/types";
import { useCallsign } from "@/lib/pulse/visitor";
import { toast } from "sonner";

function ReplyForm({
  channel,
  parent,
  onDone,
}: {
  channel: Channel;
  parent: Pulse;
  onDone: () => void;
}) {
  const { callsign, setCallsign } = useCallsign();
  const addPulse = usePulse((s) => s.addPulse);
  const [face, setFace] = useState<FaceId | null>(null);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [name, setName] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (callsign) setName((current) => current || callsign);
  }, [callsign]);

  useEffect(() => {
    boxRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  return (
    <div
      ref={boxRef}
      className="mt-2 rounded-2xl border border-line bg-cool/60 p-3"
    >
      <p className="mb-2 text-xs text-muted">
        Replying to {parent.callsign}
      </p>
      <FacePicker value={face} onChange={setFace} caption={false} />
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Callsign"
        className="mt-3 h-11 w-full rounded-xl border border-line bg-plate px-3 text-sm text-ink outline-none focus:border-teal"
      />
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        rows={3}
        placeholder="Add a note (optional)"
        className="mt-2 w-full rounded-xl border border-line bg-plate px-3 py-2 text-sm text-ink outline-none focus:border-teal"
      />
      <div className="mt-2">
        <PhotoField value={photo} onChange={setPhoto} />
      </div>
      <div className="mt-3 flex gap-2">
        <Button
          type="button"
          className="h-11 flex-1"
          disabled={!face}
          onClick={() => {
            if (!face) return;
            const next = name.trim() || callsign || "Visitor";
            setCallsign(next);
            addPulse({
              channelId: channel.id,
              parentId: parent.id,
              callsign: next,
              face,
              body,
              photo,
            });
            toast("Reply sent");
            onDone();
          }}
        >
          Send
        </Button>
        <Button type="button" variant="ghost" className="h-11" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

export function PlaceThread({
  channel,
  replyTo,
}: {
  channel: Channel;
  replyTo?: string;
}) {
  const pulses = usePulse((s) => s.pulses);
  const [openReply, setOpenReply] = useState<string | null>(null);

  useEffect(() => {
    if (!replyTo) return;
    setOpenReply(replyTo);
    const el = document.getElementById(`pulse-${replyTo}`);
    el?.scrollIntoView({ block: "center", behavior: "smooth" });
  }, [replyTo]);

  const roots = useMemo(
    () =>
      pulses
        .filter((p) => p.channelId === channel.id && !p.parentId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [pulses, channel.id],
  );

  if (roots.length === 0) {
    return (
      <p className="rounded-2xl bg-plate px-4 py-8 text-center text-sm text-muted shadow-plate">
        No visitor voices on this place yet. Be the first face.
      </p>
    );
  }

  return (
    <ol className="space-y-3">
      {roots.map((root) => {
        const replies = pulses
          .filter((p) => p.parentId === root.id)
          .sort((a, b) => a.createdAt - b.createdAt);
        return (
          <li key={root.id}>
            <PulseCard
              pulse={root}
              channel={channel}
              hidePlace
              highlight={replyTo === root.id}
              onReply={() =>
                setOpenReply(openReply === root.id ? null : root.id)
              }
            />
            {openReply === root.id ? (
              <ReplyForm
                channel={channel}
                parent={root}
                onDone={() => setOpenReply(null)}
              />
            ) : null}
            {replies.length > 0 ? (
              <ol className="mt-2 space-y-2 border-l-2 border-cool pl-3">
                {replies.map((reply) => (
                  <li key={reply.id}>
                    <PulseCard pulse={reply} hidePlace compactPhoto />
                  </li>
                ))}
              </ol>
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
