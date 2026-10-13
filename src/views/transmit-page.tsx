"use client";

import { uid } from "@/lib/pulse/ids";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, CheckCircle2, MapPin, MessageCircle, ShieldCheck, Wallet } from "lucide-react";
import { FacePicker } from "@/components/face-picker";
import { PhotoField } from "@/components/photo-field";
import { PublicChrome } from "@/components/public-chrome";
import { StoredPhoto } from "@/components/stored-photo";
import { Button } from "@/components/ui/button";
import { usePulse } from "@/lib/pulse/store";
import { OVERALL_CHANNEL, OVERALL_ID } from "@/lib/pulse/scope";
import { tallyFaces } from "@/lib/pulse/faces";
import type { FaceId } from "@/lib/pulse/types";
import { useCallsign } from "@/lib/pulse/visitor";

export function TransmitPage() {
  const channels = usePulse(s => s.channels);
  const pulses = usePulse(s => s.pulses);
  const hydrated = usePulse(s => s.hydrated);
  const addPulse = usePulse(s => s.addPulse);
  const { callsign, setCallsign } = useCallsign();
  const draftId = useRef<string | null>(null);
  const [scope, setScope] = useState<"place" | "trip">("place");
  const [placeId, setPlaceId] = useState("");
  const [face, setFace] = useState<FaceId | null>(null);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");
  const [photo, setPhoto] = useState<string>();
  const [sending, setSending] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [error, setError] = useState("");
  const [sentId, setSentId] = useState<string>();
  const [connected, setConnected] = useState<boolean | null>(null);
  const channel = scope === "trip" ? OVERALL_CHANNEL : channels.find(c => c.id === placeId);
  const tally = tallyFaces(pulses.filter(p => p.channelId === channel?.id));
  useEffect(() => { if (callsign) setName(current => current || callsign); }, [callsign]);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("place");
    if (id) setPlaceId(id);
    void usePulse.getState().syncShared().then(setConnected);
  }, []);

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (sending || photoBusy || !channel || !face) return;
    setSending(true); setError("");
    try {
      const nickname = name.trim() || "Visitor";
      draftId.current ??= uid("p");
      const saved = await addPulse({ id: draftId.current, channelId: channel.id, callsign: nickname, face, body, photo });
      draftId.current = null;
      setCallsign(nickname); setConnected(true); setSentId(saved.id);
      setBody(""); setPhoto(undefined); setFace(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your feedback. Please try again.");
    } finally { setSending(false); }
  }

  return <PublicChrome>
    <main id="main-content" className="feedback-main page-width">
      <header className="feedback-heading">
        <div><p className="eyebrow">DAET-CONNECT / Visitor feedback</p>
          <h1>Your visit. Your voice.</h1>
          <p>A feeling, a moment, an idea. Help make the next Daet experience better.</p>
        </div>
        <Link href="/board" className="feedback-insights-link">See visitor sentiment <ArrowUpRight size={16} /></Link>
      </header>
      <div className="feedback-grid">
        <section className="feedback-compose" aria-label="Share feedback">
          {sentId ? <div className="feedback-success" role="status">
            <CheckCircle2 size={44} />
            <p className="eyebrow">Thank you for sharing</p>
            <h2>Your feedback is saved.</h2>
            <p>Your experience is now available in visitor stories and sentiment summaries.</p>
            <Link className="feedback-primary" href={`/live?pulse=${sentId}`}>View my feedback <ArrowUpRight size={18} /></Link>
            <button className="feedback-secondary" onClick={() => setSentId(undefined)}>Share another experience</button>
          </div> : <form onSubmit={send}>
            <div className="feedback-section-heading"><span className="feedback-step">01</span><h2>What are you sharing about?</h2></div>
            <div className="feedback-scope" role="group" aria-label="Feedback scope">
              <button type="button" aria-pressed={scope === "place"} onClick={() => setScope("place")} disabled={sending}><MapPin size={19} /><span>A place I visited<small>A specific destination</small></span></button>
              <button type="button" aria-pressed={scope === "trip"} onClick={() => setScope("trip")} disabled={sending}><MessageCircle size={19} /><span>My overall visit<small>My Daet experience</small></span></button>
            </div>
            {scope === "place" && <label className="feedback-field">Destination
              <select required value={placeId} disabled={sending} onChange={e => setPlaceId(e.target.value)}>
                <option value="">Select the place you visited</option>
                {channels.filter(c => c.id !== OVERALL_ID).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>}
            <div className="feedback-section-heading"><span className="feedback-step">02</span><h2>How did it feel?</h2></div>
            <fieldset disabled={sending}><FacePicker value={face} onChange={setFace} caption={false} /></fieldset>
            <p className="feedback-helper">Choose the feeling that best represents your experience.</p>
            <details className="feedback-details">
              <summary>Add a note or photo <span>Optional</span></summary>
              <label className="feedback-field">What worked well? What could improve?
                <textarea maxLength={1000} rows={4} value={body} disabled={sending} onChange={e => setBody(e.target.value)} placeholder="Tell us in English, Filipino, or a mix of both." />
              </label>
              <p className="feedback-helper">{body.length}/1,000 · Notes and photos will be public. Avoid personal information.</p>
              <PhotoField value={photo} onChange={setPhoto} onBusyChange={setPhotoBusy} />
              <label className="feedback-field">Nickname (optional)<input maxLength={40} value={name} disabled={sending} onChange={e => setName(e.target.value)} placeholder="Visitor" autoComplete="nickname" /></label>
            </details>
            {error && <div role="alert" className="feedback-error">{error}<br />Your draft is still here. Check your connection and try again.</div>}
            <Button type="submit" className="feedback-primary" disabled={!face || !channel || sending || photoBusy}>{sending ? "Saving your feedback…" : "Submit feedback"}<ArrowUpRight size={18} /></Button>
            <p className="feedback-privacy"><ShieldCheck size={15} /> No account required to share feedback.</p>
          </form>}
        </section>
        <aside className="feedback-context">
          <section className="feedback-place" aria-label="Selected experience sentiment">
            <div className="feedback-cover"><StoredPhoto id={channel?.cover || "/spots/bagasbas-surf.jpg"} alt={channel?.name || "Bagasbas Beach, Daet"} /><span>DAET, CAMARINES NORTE</span></div>
            <div className="feedback-place-body">
              <p className="eyebrow">{scope === "trip" ? "The whole journey" : "A closer look"}</p>
              <h2>{channel?.name || "Every experience matters."}</h2>
              <p>{channel?.blurb || "Select a destination to see how fellow visitors felt, or share your overall Daet experience."}</p>
              {channel && connected && hydrated && <div className="feedback-distribution">
                <div className="feedback-distribution-title"><strong>Visitor feelings</strong><span>{tally.total} ratings*</span></div>
                {([{ label: "Positive", count: tally.pos, color: "#65a30d" }, { label: "Okay / neutral", count: tally.mix, color: "#eab308" }, { label: "Negative", count: tally.neg, color: "#dc2626" }]).map(item => <div className="feedback-stat" key={item.label}><span>{item.label}</span><div><i style={{width: `${tally.total ? item.count / tally.total * 100 : 0}%`, background: item.color}} /></div><b>{tally.total ? Math.round(item.count / tally.total * 100) : 0}%</b></div>)}
                <p className="feedback-helper">*From the latest 500 shared entries. Replies do not count as visit ratings. Text sentiment is analyzed separately.</p>
              </div>}
              {connected === false && <p className="feedback-helper" role="status">Live sentiment is temporarily unavailable. You can still prepare your feedback and retry submitting.</p>}
            </div>
          </section>
          <section className="feedback-rewards"><Wallet size={23} /><div><h2>One community. Shared rewards.</h2><p>Rewards will connect through the DAET-CONNECT wallet. Points are not available in this standalone module yet.</p></div></section>
          <Link href="/live" className="feedback-stories-link"><span>Read the experiences behind the numbers<small>Visitor stories & conversations</small></span><ArrowUpRight size={22} /></Link>
        </aside>
      </div>
    </main>
  </PublicChrome>;
}
