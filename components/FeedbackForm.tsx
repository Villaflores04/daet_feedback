"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EMOJI_META, EMOJIS, ratingFromEmoji, type PulseEmoji } from "@/lib/sentiment";
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
  const [emoji, setEmoji] = useState<PulseEmoji | "">("");
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  function pickEmoji(e: PulseEmoji) {
    setEmoji(e);
    if (!rating) setRating(ratingFromEmoji(e));
  }

  async function submit() {
    setError("");
    setOk(false);
    if (!profile.name) {
      setAskName(true);
      return;
    }
    if (!emoji) {
      setError("Pick an emoji first. That is your pulse.");
      return;
    }
    if (comment.trim().length < 8) {
      setError("Magsulat ng kahit 8 letra / write at least 8 characters.");
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
          rating: rating || ratingFromEmoji(emoji),
          emoji,
          comment: comment.trim()
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Could not post. Try again.");
        return;
      }
      setComment("");
      setEmoji("");
      setRating(0);
      setOk(true);
      if (json && json.id) onPosted?.(json as Feedback);
      router.refresh();
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
          <p className="text-xs uppercase tracking-[0.2em] text-gold">Your pulse</p>
          <h3 className="font-display text-2xl">{spotName}</h3>
          <p className="mt-1 text-xs text-sand/50">No account. Pangalan lang — public nickname.</p>
        </div>
        <ProfileChip name={profile.name} onEdit={() => setAskName(true)} />
      </div>
      <p className="mt-6 text-sm text-sand/70">How did this place feel? / Ano ang naramdaman mo?</p>
      <div className="mt-3 grid grid-cols-4 gap-2">
        {EMOJIS.map((e) => (
          <button key={e} type="button" onClick={() => pickEmoji(e)} className={`rounded-2xl py-3 text-3xl ${emoji === e ? "bg-white/15 ring-2 ring-gold" : "bg-white/5"}`} aria-label={EMOJI_META[e].label}>
            {e}
          </button>
        ))}
      </div>
      {emoji && <p className="mt-2 text-sm text-gold">{EMOJI_META[emoji].label} · {EMOJI_META[emoji].fil}</p>}
      <p className="mt-6 text-xs text-sand/45">Optional stars for the town average only — not the official mood.</p>
      <div className="mt-2 flex gap-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" onClick={() => setRating(n)} className={`h-11 w-11 rounded-full text-lg ${rating >= n ? "text-gold" : "text-sand/25"}`} aria-label={`${n} stars`}>
            ★
          </button>
        ))}
      </div>
      <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} maxLength={600} placeholder="Crowds, linis, staff, sunset… ano ang dapat malaman ng tourism desk?" className="mt-4 w-full resize-none rounded-2xl border border-white/10 bg-ink/40 px-4 py-3 text-sm outline-none ring-gold/30 focus:ring-2" />
      <p className={`mt-2 text-xs ${remaining < 8 ? "text-coral/80" : "text-sand/40"}`}>{remaining}/600 · minimum 8</p>
      {error && <p className="mt-3 text-sm text-coral">{error}</p>}
      {ok && (
        <p className="mt-3 text-sm text-foam">
          Your pulse is up. <Link href="/dashboard" className="underline decoration-gold/50">See the town pulse</Link>
        </p>
      )}
      <button type="button" onClick={submit} disabled={busy} className="mt-4 w-full rounded-full bg-sand py-3.5 font-semibold text-ink hover:bg-white disabled:opacity-60">
        {profile.name ? (busy ? "Sending…" : "Publish pulse") : "Set name, then publish"}
      </button>
      <NameModal open={askName} initial={profile.name} onClose={() => setAskName(false)} onSave={(n) => { profile.save(n); setAskName(false); }} />
    </div>
  );
}
