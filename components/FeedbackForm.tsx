"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EMOJI_META, EMOJIS, type PulseEmoji } from "@/lib/sentiment";
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
  const [saved, setSaved] = useState<Feedback | null>(null);

  async function submit() {
    setError("");
    setSaved(null);
    if (!profile.name) {
      setAskName(true);
      return;
    }
    if (!emoji) {
      setError("Choose one emoji first. That is your official pulse.");
      return;
    }
    if (comment.trim().length < 8) {
      setError("Mag-iwan ng maikling komento / write at least 8 characters.");
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
          rating: rating || undefined,
          emoji,
          comment: comment.trim()
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error || "Your pulse could not be saved. Please try again.");
        return;
      }
      setComment("");
      setEmoji("");
      setRating(0);
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
    <div className="card p-3.5 sm:p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="eyebrow">Visitor pulse</p>
          <h3 className="mt-0.5 truncate">{spotName}</h3>
        </div>
        <ProfileChip name={profile.name} onEdit={() => setAskName(true)} />
      </div>

      <p className="mt-3 text-[13px] font-medium text-ink">How did your visit feel?</p>
      <p className="text-[11px] text-ink-soft">Kumusta ang experience mo?</p>

      <div className="mt-2.5 grid grid-cols-4 gap-1.5">
        {EMOJIS.map((e) => {
          const on = emoji === e;
          return (
            <button
              key={e}
              type="button"
              onClick={() => setEmoji(e)}
              className={`flex min-h-[64px] flex-col items-center justify-center rounded-[12px] border px-1 py-1.5 ${
                on ? "border-tide bg-[var(--dp-tide-wash)]" : "border-[var(--dp-line)] bg-white"
              }`}
            >
              <span className="text-[1.35rem] leading-none">{e}</span>
              <span className="mt-0.5 text-[9px] font-semibold text-ink">{EMOJI_META[e].label}</span>
              <span className="text-[8px] leading-none text-ink-soft">{EMOJI_META[e].fil}</span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-ink-soft">Optional numeric score. Emoji stays official.</p>
      <div className="mt-0.5 flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`grid h-8 w-8 place-items-center text-sm ${rating >= n ? "text-gold" : "text-[var(--dp-line-strong)]"}`}
          >
            ★
          </button>
        ))}
      </div>

      <label className="lbl">Short comment / maikling komento</label>
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        maxLength={600}
        placeholder="Crowds, linis, staff, sunset…"
        className="w-full px-3 py-2 text-sm outline-none"
      />
      <p className={`mt-1 text-[11px] ${remaining < 8 ? "text-coral" : "text-ink-soft"}`}>{remaining}/600</p>
      {error && <p className="mt-1.5 text-xs text-coral">{error}</p>}
      {saved && (
        <div className="mt-2.5 rounded-[12px] border border-tide/20 bg-[var(--dp-tide-wash)] px-3 py-2 text-[13px]">
          <p className="font-semibold text-tide">Your pulse is counted</p>
          <p className="text-[11px] text-ink-soft">Naitala ang iyong pulse.</p>
          <Link href="/dashboard" className="mt-1 inline-block text-[11px] font-semibold text-tide">
            See how Daet feels →
          </Link>
        </div>
      )}
      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="btn-gold mt-3 w-full min-h-9 disabled:opacity-60"
      >
        {profile.name ? (busy ? "Saving…" : "Publish pulse") : "Set name, then publish"}
      </button>
      <NameModal
        open={askName}
        initial={profile.name}
        onClose={() => setAskName(false)}
        onSave={(n) => {
          profile.save(n);
          setAskName(false);
        }}
      />
    </div>
  );
}
