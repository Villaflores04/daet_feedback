"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EMOJIS } from "@/lib/sentiment";
import type { Feedback } from "@/lib/types";
import { NameModal, ProfileChip, useProfileName } from "./ProfileGate";

export function FeedbackForm({
  spotId,
  spotName,
  onPosted
}: {
  spotId: string;
  spotName: string;
  onPosted?: (row: Feedback) => void;
}) {
  const profile = useProfileName();
  const router = useRouter();
  const [askName, setAskName] = useState(false);
  const [rating, setRating] = useState(5);
  const [emoji, setEmoji] = useState<(typeof EMOJIS)[number]>("🤩");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function submit() {
    setError("");
    setOk(false);
    if (!profile.name) {
      setAskName(true);
      return;
    }
    if (comment.trim().length < 8) {
      setError("Write at least 8 characters so the desk can act on it.");
      return;
    }
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spot_id: spotId,
          display_name: profile.name,
          rating,
          emoji,
          comment: comment.trim()
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Could not post. Check the comment length and try again.");
        return;
      }
      setComment("");
      setOk(true);
      if (json && json.id) onPosted?.(json as Feedback);
      router.refresh();
      setTimeout(() => setOk(false), 3200);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = comment.trim().length;

  return (
    <div className="glass rounded-3xl p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Leave a pulse</p>
          <h3 className="font-display text-2xl">{spotName}</h3>
        </div>
        <ProfileChip name={profile.name} onEdit={() => setAskName(true)} />
      </div>
      <div className="mt-6 flex flex-wrap gap-2">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} className={`h-11 w-11 rounded-full text-sm font-semibold ${rating === n ? "bg-gold text-ink" : "border border-white/10 text-sand/70 hover:bg-white/5"}`}>{n}</button>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {EMOJIS.map((e) => (
          <button key={e} type="button" onClick={() => setEmoji(e)} className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl ${emoji === e ? "bg-white/15 ring-1 ring-gold" : "bg-white/5"}`}>{e}</button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={600} placeholder="What should the tourism desk know? Crowds, cleanliness, staff, sunset…" className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-ink/40 px-4 py-3 text-sm outline-none ring-gold/30 focus:ring-2" />
      <p className={`mt-2 text-xs ${remaining < 8 ? "text-coral/80" : "text-sand/40"}`}>{remaining}/600 · minimum 8 characters</p>
      {error && <p className="mt-3 text-sm text-coral">{error}</p>}
      {ok && <p className="mt-3 text-sm text-foam">Logged. Your pulse is on this page now.</p>}
      <button type="button" onClick={submit} disabled={busy} className="mt-4 w-full rounded-full bg-sand py-3 font-semibold text-ink hover:bg-white disabled:opacity-60">
        {profile.name ? (busy ? "Sending…" : "Publish review") : "Set name, then review"}
      </button>
      <NameModal open={askName} initial={profile.name} onClose={() => setAskName(false)} onSave={(n) => { profile.save(n); setAskName(false); }} />
    </div>
  );
}
