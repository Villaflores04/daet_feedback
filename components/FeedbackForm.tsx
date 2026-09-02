"use client";
import { useState } from "react";
import { EMOJIS } from "@/lib/sentiment";
import { NameModal, ProfileChip, useProfileName } from "./ProfileGate";

export function FeedbackForm({ spotId, spotName, onPosted }: { spotId: string; spotName: string; onPosted?: () => void }) {
  const profile = useProfileName();
  const [askName, setAskName] = useState(false);
  const [rating, setRating] = useState(5);
  const [emoji, setEmoji] = useState<(typeof EMOJIS)[number]>("🤩");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  async function submit() {
    setError("");
    if (!profile.name) { setAskName(true); return; }
    setBusy(true);
    const res = await fetch("/api/feedback", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ spot_id: spotId, display_name: profile.name, rating, emoji, comment })
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { setError(json.error || "Could not post."); return; }
    setComment("");
    setOk(true);
    onPosted?.();
    setTimeout(() => setOk(false), 2400);
  }

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
        {[1,2,3,4,5].map((n) => (
          <button key={n} onClick={() => setRating(n)} className={`h-11 w-11 rounded-full text-sm font-semibold ${rating === n ? "bg-gold text-ink" : "border border-white/10 text-sand/70 hover:bg-white/5"}`}>{n}</button>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        {EMOJIS.map((e) => (
          <button key={e} onClick={() => setEmoji(e)} className={`grid h-12 w-12 place-items-center rounded-2xl text-2xl ${emoji === e ? "bg-white/15 ring-1 ring-gold" : "bg-white/5"}`}>{e}</button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="What should the tourism desk know? Crowds, cleanliness, staff, sunset…" className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-ink/40 px-4 py-3 text-sm outline-none ring-gold/30 focus:ring-2" />
      {error && <p className="mt-3 text-sm text-coral">{error}</p>}
      {ok && <p className="mt-3 text-sm text-foam">Logged. Thank you.</p>}
      <button onClick={submit} disabled={busy} className="mt-4 w-full rounded-full bg-sand py-3 font-semibold text-ink hover:bg-white disabled:opacity-60">
        {profile.name ? (busy ? "Sending…" : "Publish review") : "Set name, then review"}
      </button>
      <NameModal open={askName} initial={profile.name} onClose={() => setAskName(false)} onSave={(n) => { profile.save(n); setAskName(false); }} />
    </div>
  );
}
