"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EMOJI_META, EMOJIS, sentimentFromEmoji, type PulseEmoji } from "@/lib/sentiment";
import type { Feedback } from "@/lib/types";
import { NameModal, ProfileChip, useProfileName } from "./ProfileGate";

export function FeedbackForm({ spotId, spotName, onPosted }: { spotId: string; spotName: string; onPosted?: (row: Feedback) => void }) {
  const profile = useProfileName();
  const router = useRouter();
  const [askName, setAskName] = useState(false);
  const [emoji, setEmoji] = useState<PulseEmoji | "">("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Feedback | null>(null);

  async function submit() {
    setError("");
    setSaved(null);
    if (!profile.name) { setAskName(true); return; }
    if (!emoji) { setError("Choose one emoji first. That is your official pulse."); return; }
    if (comment.trim().length < 8) { setError("Mag-iwan ng maikling komento / write at least 8 characters."); return; }
    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spot_id: spotId, display_name: profile.name, rating: rating || undefined, emoji, comment: comment.trim() })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || "Your pulse could not be saved. Please try again."); return; }
      setComment(""); setEmoji(""); setRating(0);
      setSaved(json as Feedback);
      onPosted?.(json as Feedback);
      router.refresh();
    } catch {
      setError("Your pulse could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const remaining = comment.trim().length;
  return (
    <div className="glass rounded-3xl p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Visitor pulse</p>
          <h3 className="font-display text-2xl">{spotName}</h3>
        </div>
        <ProfileChip name={profile.name} onEdit={() => setAskName(true)} />
      </div>
      <p className="mt-6 text-base font-medium text-sand">How did your visit feel?</p>
      <p className="text-sm text-sand/60">Kumusta ang experience mo?</p>
      <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {EMOJIS.map((e) => {
          const on = emoji === e;
          return (
            <button key={e} type="button" onClick={() => setEmoji(e)} className={`min-h-[92px] rounded-2xl border px-2 py-3 ${on ? "border-gold bg-gold/15 ring-2 ring-gold" : "border-white/10 bg-white/5"}`}>
              <span className="block text-4xl">{e}</span>
              <span className="mt-1 block text-xs text-sand">{EMOJI_META[e].label}</span>
              <span className="block text-[10px] text-sand/50">{EMOJI_META[e].fil}</span>
              {on && <span className="mt-1 block text-xs text-gold">✓ selected</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-6 text-xs text-sand/45">Optional: give a numeric score — not the official mood.</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} className={`grid h-12 w-12 place-items-center rounded-full text-xl ${rating >= n ? "text-gold" : "text-sand/25"}`}>★</button>
        ))}
      </div>
      <p className="mt-5 text-sm text-sand/70">Add a short comment / Mag-iwan ng maikling komento</p>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={600} placeholder="Crowds, linis, staff, sunset…" className="mt-2 w-full resize-none rounded-2xl border border-white/10 bg-ink/40 px-4 py-3 text-base outline-none ring-gold/30 focus:ring-2" />
      <p className={`mt-2 text-xs ${remaining < 8 ? "text-coral/80" : "text-sand/40"}`}>{remaining}/600</p>
      {error && <p className="mt-3 text-sm text-coral">{error}</p>}
      {saved && (
        <div className="mt-4 rounded-2xl border border-foam/40 bg-foam/10 p-4 text-sm">
          <p className="font-semibold text-foam">Your pulse is counted ✓</p>
          <p className="text-sand/70">Naitala ang iyong pulse.</p>
          <p className="mt-2 text-lg">{saved.emoji} {EMOJI_META[saved.emoji as PulseEmoji]?.label || sentimentFromEmoji(saved.emoji)}</p>
          <p className="mt-2 whitespace-pre-wrap text-sand/80">{saved.comment}</p>
          <Link href="/dashboard" className="mt-3 inline-block text-gold underline">See how visitors are feeling across Daet →</Link>
        </div>
      )}
      <button type="button" onClick={submit} disabled={busy} className="mt-4 min-h-12 w-full rounded-full bg-sand py-3.5 text-base font-semibold text-ink hover:bg-white disabled:opacity-60">
        {profile.name ? (busy ? "Saving…" : "Publish pulse") : "Set name, then publish"}
      </button>
      <NameModal open={askName} initial={profile.name} onClose={() => setAskName(false)} onSave={(n) => { profile.save(n); setAskName(false); }} />
    </div>
  );
}
