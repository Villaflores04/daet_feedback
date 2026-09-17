"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ArrowUpRight, MapPin } from "lucide-react";
import { FacePicker } from "@/components/face-picker";
import { PhotoField } from "@/components/photo-field";
import { PublicChrome } from "@/components/public-chrome";
import { StoredPhoto } from "@/components/stored-photo";
import { Button } from "@/components/ui/button";
import { usePulse } from "@/lib/pulse/store";
import type { FaceId } from "@/lib/pulse/types";
import { useCallsign } from "@/lib/pulse/visitor";
export function TransmitPage() {
  const channels = usePulse((s) => s.channels),
    addPulse = usePulse((s) => s.addPulse);
  const router = useRouter();
  const { callsign, setCallsign } = useCallsign();
  const [channelId, setChannelId] = useState<string>(channels[0]?.id ?? "");
  const [face, setFace] = useState<FaceId | null>(null),
    [name, setName] = useState(""),
    [body, setBody] = useState("");
  const [photo, setPhoto] = useState<string | undefined>();
  const [error, setError] = useState("");
  const channel = channels.find((c) => c.id === channelId);
  useEffect(() => {
    if (callsign) setName((current) => current || callsign);
  }, [callsign]);
  useEffect(() => {
    if (!channelId && channels.length) setChannelId(channels[0].id);
  }, [channels, channelId]);
  const send = () => {
    if (!channel || !face) {
      setError(
        !channel
          ? "Choose the place you visited."
          : "Choose how your visit felt.",
      );
      return;
    }
    try {
      const next = name.trim() || callsign || "Visitor";
      setCallsign(next);
      const pulse = addPulse({ channelId, callsign: next, face, body, photo });
      toast.success("Your experience has been shared.");
      router.push(`/live?pulse=${pulse.id}`);
    } catch {
      setError(
        "We couldn’t save your experience. Your draft is still here. Please try again.",
      );
    }
  };
  return (
    <PublicChrome>
      <main id="main-content" className="page-width">
        <header className="page-intro">
          <p className="eyebrow">A moment worth sharing</p>
          <h1>How did Daet feel?</h1>
          <p>
            Your perspective helps the next visitor. Pick a place, choose a
            feeling, and tell as much or as little as you like.
          </p>
        </header>
        <div className="share-layout">
          <form
            className="form-panel space-y-7"
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
          >
            <div>
              <label htmlFor="share-place" className="form-step">
                <span>1</span> Where did you go?
              </label>
              <select
                id="share-place"
                required
                value={channelId}
                onChange={(e) => {
                  setChannelId(e.target.value);
                  setError("");
                }}
                className="h-12 w-full rounded-lg border border-line bg-page px-3"
              >
                <option value="" disabled>
                  Choose a place
                </option>
                {channels.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} · {c.category}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <p className="form-step">
                <span>2</span> How was your visit?
              </p>
              <FacePicker
                value={face}
                onChange={(value) => {
                  setFace(value);
                  setError("");
                }}
              />
              <p className="mt-2 text-xs text-muted">
                Choose one feeling to continue.
              </p>
            </div>
            <div>
              <p className="form-step">
                <span>3</span> Add your story{" "}
                <small className="font-normal text-muted">Optional</small>
              </p>
              <label className="block">
                <span className="mb-2 block text-sm font-medium">
                  Your note
                </span>
                <textarea
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  rows={4}
                  placeholder="What stood out? What would you tell a friend?"
                  className="w-full rounded-lg border border-line bg-page px-3 py-3"
                />
              </label>
              <div className="mt-4">
                <PhotoField value={photo} onChange={setPhoto} />
              </div>
            </div>
            <label className="block">
              <span className="mb-2 block text-sm font-medium">
                Nickname{" "}
                <span className="font-normal text-muted">(optional)</span>
              </span>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Visitor"
                autoComplete="nickname"
                className="h-12 w-full rounded-lg border border-line bg-page px-3"
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-neg">
                {error}
              </p>
            )}
            <div>
              <Button
                type="submit"
                className="h-12 w-full"
                disabled={!face || !channel}
              >
                Share my experience <ArrowUpRight size={17} />
              </Button>
              <p className="mt-3 text-center text-xs text-muted">
                Your feedback stays on this device.
              </p>
            </div>
          </form>
          <aside className="share-preview" aria-label="Selected place">
            {channel ? (
              <>
                <StoredPhoto id={channel.cover} alt={channel.name} />
                <p className="eyebrow mt-5">
                  <MapPin size={14} />
                  {channel.category}
                </p>
                <h2 className="mt-2 font-display text-3xl tracking-tight">
                  {channel.name}
                </h2>
                <p className="preview-about mt-3 text-sm leading-relaxed text-muted">
                  {channel.blurb}
                </p>
              </>
            ) : (
              <p className="text-muted">Choose a place to get started.</p>
            )}
            <div className="preview-about mt-7 border-t border-line pt-5">
              <p className="font-display text-xl">
                A little honesty goes a long way.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-muted">
                Share what you noticed, celebrate what you loved, or suggest
                what could be better.
              </p>
            </div>
          </aside>
        </div>
      </main>
    </PublicChrome>
  );
}
