"use client";

import { useEffect, useMemo, useState } from "react";
import type { Feedback } from "@/lib/types";
import { NameModal, ProfileChip, useProfileName } from "./ProfileGate";

type CommunityRow = {
  feedback_id: string;
  reactions: { agree: number; disagree: number; mine: string | null };
  replies: { id: string; feedback_id: string; display_name: string; comment: string; created_at: string }[];
};

const KEY = "daet_visitor_key";

function getKey() {
  if (typeof window === "undefined") return "";
  const old = localStorage.getItem(KEY);
  if (old) return old;
  const next = `${crypto.randomUUID()}-${Date.now()}`;
  localStorage.setItem(KEY, next);
  return next;
}

export function CommunityFeed({ spotId, reviews }: { spotId: string; reviews: Feedback[] }) {
  const profile = useProfileName();
  const [rows, setRows] = useState<CommunityRow[]>([]);
  const [replyFor, setReplyFor] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [askName, setAskName] = useState(false);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    try {
      const res = await fetch(`/api/community?spotId=${encodeURIComponent(spotId)}&visitorKey=${encodeURIComponent(getKey())}`, { cache: "no-store" });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Community features are temporarily unavailable.");
      if (Array.isArray(json)) setRows(json);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Community features are temporarily unavailable.");
    }
  }

  useEffect(() => {
    load();
    const timer = window.setInterval(load, 15000);
    const onPosted = () => load();
    window.addEventListener("daet:pulse-posted", onPosted);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener("daet:pulse-posted", onPosted);
    };
  }, [spotId]);

  const byId = useMemo(() => new Map(rows.map((r) => [r.feedback_id, r])), [rows]);

  async function react(id: string, reaction: "agree" | "disagree") {
    if (busy) return;
    const key = getKey();
    if (!key) {
      setNotice("Your browser could not create a visitor key. Please refresh the page.");
      return;
    }

    setBusy(`${id}-${reaction}`);
    setNotice("");

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reaction",
          feedback_id: id,
          visitor_key: key,
          reaction
        })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Your reaction could not be saved.");

      setRows((current) =>
        current.map((row) => {
          if (row.feedback_id !== id) return row;
          const mine = row.reactions.mine === reaction ? null : reaction;
          let agree = row.reactions.agree;
          let disagree = row.reactions.disagree;

          if (row.reactions.mine === "agree") agree = Math.max(0, agree - 1);
          if (row.reactions.mine === "disagree") disagree = Math.max(0, disagree - 1);
          if (mine === "agree") agree += 1;
          if (mine === "disagree") disagree += 1;

          return { ...row, reactions: { agree, disagree, mine } };
        })
      );
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Your reaction could not be saved.");
    } finally {
      setBusy("");
    }
  }

  function openReply(id: string) {
    setNotice("");
    setReplyFor(replyFor === id ? null : id);
  }

  async function reply(id: string) {
    setNotice("");

    if (!profile.name) {
      setAskName(true);
      return;
    }

    if (replyText.trim().length === 0) {
      setNotice("Write a reply first.");
      return;
    }

    setBusy(`reply-${id}`);

    try {
      const res = await fetch("/api/community", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reply",
          feedback_id: id,
          visitor_key: getKey(),
          display_name: profile.name,
          comment: replyText.trim()
        })
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Your reply could not be saved.");

      const newReply = json as CommunityRow["replies"][number];
      setRows((current) =>
        current.map((row) =>
          row.feedback_id === id
            ? { ...row, replies: [...row.replies, newReply] }
            : row
        )
      );
      setReplyText("");
      setReplyFor(null);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Your reply could not be saved.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="community-section">
      <div className="community-heading">
        <div>
          <p className="eyebrow">Visitor voices</p>
          <h2 className="mt-2">Pulses become conversations.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--muted)]">
            The emoji is the official pulse. Agree or disagree when your experience matches the story, then reply with your own perspective.
          </p>
        </div>
        <div className="community-live"><span className="live-dot" /> Living conversation</div>
      </div>

      <div className="community-grid">
        {reviews.length === 0 && (
          <div className="community-empty">
            <span className="empty-emoji">🙂</span>
            <strong>No visitor voices yet.</strong>
            <span>Be the first person to leave a pulse.</span>
          </div>
        )}

        {reviews.map((f, index) => {
          const row = byId.get(f.id);
          const agree = row?.reactions.agree ?? 0;
          const disagree = row?.reactions.disagree ?? 0;
          const mine = row?.reactions.mine ?? null;

          return (
            <article key={f.id} className="voice-card" style={{ ["--voice-delay" as string]: `${Math.min(index * 60, 360)}ms` }}>
              <div className="voice-top">
                <div className="voice-person">
                  <div className="voice-avatar">{f.display_name.slice(0, 1).toUpperCase()}</div>
                  <div>
                    <div className="voice-name">{f.display_name}</div>
                    <div className="voice-meta">Official pulse · {new Date(f.created_at).toLocaleDateString()}</div>
                  </div>
                </div>
                <div className="voice-emoji" title="Official pulse">{f.emoji}</div>
              </div>

              <div className="voice-pulse-label">
                {f.sentiment === "positive" ? "POSITIVE PULSE" : f.sentiment === "mixed" ? "MIXED PULSE" : "NEEDS CARE"}
              </div>

              <p className="voice-copy">{f.comment || <span className="empty-comment">No written comment — emoji only.</span>}</p>

              <div className="voice-actions">
                <button type="button" className={`voice-react ${mine === "agree" ? "active" : ""}`} disabled={!!busy} onClick={() => react(f.id, "agree")}>
                  👍 <span>Agree</span> <strong>{agree}</strong>
                </button>
                <button type="button" className={`voice-react ${mine === "disagree" ? "active" : ""}`} disabled={!!busy} onClick={() => react(f.id, "disagree")}>
                  👎 <span>Disagree</span> <strong>{disagree}</strong>
                </button>
                <button type="button" className="voice-reply-btn" onClick={() => openReply(f.id)}>
                  💬 <span>{row?.replies.length ?? 0}</span> <b>Reply</b>
                </button>
              </div>

              {(row?.replies.length ?? 0) > 0 && (
                <div className="reply-list">
                  {row!.replies.slice(0, 5).map((r) => (
                    <div key={r.id} className="reply-item">
                      <div className="reply-avatar">{r.display_name.slice(0, 1).toUpperCase()}</div>
                      <div><strong>{r.display_name}</strong><p>{r.comment}</p></div>
                    </div>
                  ))}
                </div>
              )}

              {replyFor === f.id && (
                <div className="reply-box">
                  <div className="reply-name-row">
                    <span>{profile.name ? <>Replying as <strong>{profile.name}</strong></> : "Set your public name to reply"}</span>
                    <ProfileChip name={profile.name} onEdit={() => setAskName(true)} />
                  </div>
                  <div className="reply-input-row">
                    <input value={replyText} onChange={(e) => setReplyText(e.target.value)} maxLength={400} placeholder="Add context or another perspective…" />
                    <button type="button" disabled={busy === `reply-${f.id}`} className="btn-primary" onClick={() => reply(f.id)}>
                      {busy === `reply-${f.id}` ? "…" : "Reply"}
                    </button>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {notice && <p className="community-notice">{notice}</p>}

      <NameModal
        open={askName}
        initial={profile.name}
        onClose={() => setAskName(false)}
        onSave={(n) => {
          profile.save(n);
          setAskName(false);
        }}
      />
    </section>
  );
}
