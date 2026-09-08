"use client";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { EMOJI_META, EMOJIS, ratingFromEmoji, type PulseEmoji } from "@/lib/sentiment";
import type { Feedback } from "@/lib/types";
import { NameModal, ProfileChip, useProfileName } from "./ProfileGate";

const prompts: Record<PulseEmoji, { title: string; question: string; placeholder: string }> = {
  "😞": { title: "Needs care", question: "What could have made the experience better?", placeholder: "Tell the town what should improve…" },
  "😐": { title: "A mixed experience", question: "What felt good — and what could improve?", placeholder: "Share both sides of the experience…" },
  "🙂": { title: "A positive experience", question: "What made the experience stand out?", placeholder: "Tell us what you enjoyed…" },
  "🤩": { title: "A memorable experience", question: "What made you love this place?", placeholder: "Share the moment that stood out…" }
};

export function FeedbackForm({ spotId, spotName, onPosted }: { spotId: string; spotName: string; onPosted?: (row: Feedback) => void }) {
  const profile = useProfileName();
  const router = useRouter();
  const [askName, setAskName] = useState(false);
  const [emoji, setEmoji] = useState<PulseEmoji | "">("");
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState<Feedback | null>(null);

  async function submit() {
    setError("");
    setSaved(null);
    if (!profile.name) { setAskName(true); return; }
    if (!emoji) { setError("Choose the emoji that best represents your official pulse."); return; }
    if (comment.trim().length < 8) { setError("Add a short explanation so people understand your pulse."); return; }

    setBusy(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ spot_id: spotId, display_name: profile.name, emoji, rating: ratingFromEmoji(emoji), comment: comment.trim() })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) { setError(json.error || "Your pulse could not be saved. Please try again."); return; }
      setComment("");
      setSaved(json as Feedback);
      onPosted?.(json as Feedback);
      window.dispatchEvent(new Event("daet:pulse-posted"));
      router.refresh();
    } catch {
      setError("Your pulse could not be saved. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  const selected = emoji ? prompts[emoji] : null;

  return <div className="surface feedback-stage creative-feedback">
    <div className="feedback-intro">
      <p className="eyebrow">Create a pulse</p>
      <h2 className="mt-3">How did {spotName} feel?</h2>
      <p className="mt-4 text-sm leading-relaxed text-[var(--muted)]">One emoji becomes the official sentiment. Your words explain the feeling behind it.</p>
      <div className="feedback-flow">
        <div><b>01</b><span>Choose one emotion</span></div>
        <div><b>02</b><span>Explain why</span></div>
        <div><b>03</b><span>Send it live</span></div>
      </div>
      <div className="feedback-note"><span>●</span><span>No stars. No account. Just one clear pulse and your story.</span></div>
    </div>

    <div className="feedback-form">
      <div className="feedback-form-head"><div><p className="spot-tag">{spotName}</p><p className="mt-1 text-sm text-[var(--muted)]">Kumusta ang experience mo?</p></div><ProfileChip name={profile.name} onEdit={() => setAskName(true)} /></div>
      <div className="emoji-grid expressive-emojis">
        {EMOJIS.map(e => <button type="button" key={e} onClick={() => { setEmoji(e); setError(""); }} className={`emoji-choice ${emoji === e ? "active" : ""}`} aria-pressed={emoji === e}>
          <span className="emoji-face">{e}</span><span className="emoji-label">{EMOJI_META[e].label}</span><span className="emoji-fil">{EMOJI_META[e].fil}</span>
        </button>)}
      </div>
      <div className={`emotion-message ${emoji ? "visible" : ""}`}>
        {selected ? <><strong>{selected.title}</strong><span>{selected.question}</span></> : <><strong>Your emoji is your official pulse.</strong><span>Choose one to tell the town how this place felt.</span></>}
      </div>
      <div className="field"><label>{selected?.question || "Explain the feeling"}</label><textarea value={comment} onChange={e => setComment(e.target.value)} rows={5} maxLength={600} placeholder={selected?.placeholder || "What stood out? Linis, staff, crowd, sunset…"} /></div>
      <div className="feedback-meta"><span className={error ? "error-text" : ""}>{error || "Your words add context to the emoji pulse."}</span><span>{comment.trim().length}/600</span></div>
      {saved && <div className="pulse-success"><div className="success-emoji">{saved.emoji}</div><div><strong>Your pulse is live.</strong><span>It now contributes to this place's mood.</span><Link href="/dashboard">See the living dashboard →</Link></div></div>}
      <button type="button" disabled={busy} onClick={submit} className="btn-primary pulse-submit">{busy ? "Sending your pulse…" : profile.name ? "Send my pulse →" : "Set my name →"}</button>
      <NameModal open={askName} initial={profile.name} onClose={() => setAskName(false)} onSave={n => { profile.save(n); setAskName(false); }} />
    </div>
  </div>;
}
