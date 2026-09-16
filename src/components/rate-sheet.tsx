import { useEffect, useState } from "react";
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
  const { callsign, setCallsign } = useCallsign();
  const addPulse = usePulse((s) => s.addPulse);
  const [face, setFace] = useState<FaceId | null>(null);
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [name, setName] = useState("");

  useEffect(() => {
    if (callsign) setName((current) => current || callsign);
  }, [callsign]);

  const submit = () => {
    if (!face) {
      toast("Pick one official face.");
      return;
    }
    const nextName = name.trim() || callsign || "Visitor";
    setCallsign(nextName);
    const pulse = addPulse({
      channelId: channel.id,
      parentId,
      callsign: nextName,
      face,
      body,
      photo,
    });
    setFace(null);
    setBody("");
    setPhoto(undefined);
    onClose();
    onSent?.(pulse.id);
    toast(parentId ? "Reply sent" : "Pulse sent");
  };

  return (
    <SheetFrame
      open={open}
      onClose={onClose}
      title={parentId ? "Reply" : "Rate this spot"}
    >
      <div className="space-y-4">
        <p className="text-sm text-muted">{channel.name}</p>
        <FacePicker value={face} onChange={setFace} />
        <label className="block">
          <span className="mb-1.5 block text-sm font-medium text-ink">
            Callsign
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
        <PhotoField value={photo} onChange={setPhoto} />
        <Button
          type="button"
          className="h-12 w-full"
          disabled={!face}
          onClick={submit}
        >
          Send
        </Button>
      </div>
    </SheetFrame>
  );
}
