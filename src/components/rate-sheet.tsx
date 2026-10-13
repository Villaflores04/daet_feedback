"use client";

import { useEffect, useRef, useState } from "react";
import { FEEDBACK_PREVIEW_POINTS } from "@/lib/rewards";
import { uid } from "@/lib/pulse/ids";
import { toast } from "sonner";
import { FacePicker } from "@/components/face-picker";
import { PhotoField } from "@/components/photo-field";
import { SheetFrame } from "@/components/sheet-frame";
import { Button } from "@/components/ui/button";
import { usePulse } from "@/lib/pulse/store";
import type { Channel, FaceId } from "@/lib/pulse/types";
import { useCallsign } from "@/lib/pulse/visitor";

export function RateSheet({
  open,
  onClose,
  channel,
  parentId = null,
  onSent,
}: {
  open: boolean;
  onClose: () => void;
  channel: Channel;
  parentId?: string | null;
  onSent?: (pulseId: string) => void;
}) {
  const draftId = useRef<string | null>(null);
  const { callsign, setCallsign } = useCallsign();
  const addPulse = usePulse((s) => s.addPulse);
  const [sending, setSending] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [face, setFace] = useState<FaceId | null>(null);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [name, setName] = useState("");

  useEffect(() => {
    if (callsign) setName((current) => current || callsign);
  }, [callsign]);

  const submit = async () => {
    if (sending || photoBusy) return;
    if (!face) {
      toast("Choose how your visit felt.");
      return;
    }
    const nextName = name.trim() || callsign || "Visitor";
    setCallsign(nextName);
    setSending(true);
    try {
      draftId.current ??= uid("p");
      const pulse = await addPulse({
        id: draftId.current,
        channelId: channel.id,
        parentId,
        callsign: nextName,
        face,
        body,
        photo,
      });
      draftId.current = null;
      setFace(null);
      setBody("");
      setPhoto(undefined);
      onClose();
      onSent?.(pulse.id);
      toast(parentId ? "Reply sent" : `Feedback saved · +${FEEDBACK_PREVIEW_POINTS} demo points (preview only).`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save. Your draft is still here.");
    } finally { setSending(false); }
  };

  return (
    <SheetFrame
      open={open}
      onClose={() => { if (!sending && !photoBusy) onClose(); }}
      title={parentId ? "Reply" : "Rate this spot"}
    >
      <fieldset className="space-y-4" disabled={sending}>
        <p className="text-sm text-muted">{channel.name}</p>
        <FacePicker value={face} onChange={setFace} />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Nickname (optional)
          </span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your nickname"
            className="h-12 w-full rounded-xl border border-line bg-plate px-3 text-ink outline-none focus:border-teal"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Note (optional)
          </span>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            placeholder="What did you notice?"
            className="w-full rounded-xl border border-line bg-plate px-3 py-3 text-ink outline-none focus:border-teal"
          />
        </label>
        <PhotoField value={photo} onChange={setPhoto} onBusyChange={setPhotoBusy} />
        <Button
          type="button"
          className="h-12 w-full"
          disabled={!face || sending || photoBusy}
          onClick={submit}
        >
          {sending ? "Saving…" : "Share experience"}
        </Button>
      </fieldset>
    </SheetFrame>
  );
}
