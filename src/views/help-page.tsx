"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { ArrowUpRight, Bug, CheckCircle2, Facebook, Lightbulb, Link2, Mail, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { PageHero } from "@/components/page-hero";
import { PublicChrome } from "@/components/public-chrome";
import { FACES } from "@/lib/pulse/faces";
import { CONTACT_LABELS, REPORT_AREAS, contactHref, type ContactKind, type ReportKind, type SupportContact } from "@/lib/support-shared";

const ICONS: Record<ContactKind, typeof Phone> = { phone: Phone, email: Mail, messenger: MessageCircle, facebook: Facebook, other: Link2 };
const ACTIONS: Record<ContactKind, string> = { phone: "Call", email: "Send an email", messenger: "Open Messenger", facebook: "Open Facebook", other: "Open" };

function shown(c: SupportContact) {
  if (c.kind === "messenger" || c.kind === "facebook" || (c.kind === "other" && c.value.startsWith("https://"))) return c.value.replace(/^https:\/\/(www\.)?/, "");
  return c.value;
}

function Contacts() {
  const [contacts, setContacts] = useState<SupportContact[] | null>(null);
  useEffect(() => {
    let live = true;
    fetch("/api/support/contacts").then(r => r.json()).then(b => { if (live) setContacts(Array.isArray(b.contacts) ? b.contacts : []); }).catch(() => { if (live) setContacts([]); });
    return () => { live = false; };
  }, []);
  if (!contacts) return <ul className="hp-contacts" aria-busy="true">{[0, 1, 2].map(i => <li key={i} className="hp-contact hp-skeleton" />)}</ul>;
  if (!contacts.length) return <p className="hp-empty">The office hasn&apos;t published contact details yet. You can still send a report or an idea below and the team will see it.</p>;
  return <ul className="hp-contacts">
    {contacts.map(c => {
      const Icon = ICONS[c.kind]; const href = contactHref(c);
      return <li key={c.id} className="hp-contact">
        <span className="hp-contact-icon" aria-hidden="true"><Icon size={20} /></span>
        <div className="hp-contact-body">
          <p className="hp-contact-kind">{CONTACT_LABELS[c.kind]}</p>
          <h3>{c.label}</h3>
          <p className="hp-contact-value">{shown(c)}</p>
          {c.note && <p className="hp-contact-note">{c.note}</p>}
        </div>
        {href && <a className="hp-contact-action" href={href} {...(href.startsWith("https://") ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{ACTIONS[c.kind]} <ArrowUpRight size={15} aria-hidden="true" /></a>}
      </li>;
    })}
  </ul>;
}

function ReportForm({ initial }: { initial: ReportKind }) {
  const [kind, setKind] = useState<ReportKind>(initial);
  const [area, setArea] = useState<string>("Other");
  const [message, setMessage] = useState("");
  const [mood, setMood] = useState<string | null>(null);
  const [contact, setContact] = useState("");
  const [trap, setTrap] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const from = useSearchParams().get("from") || "";
  const bug = kind === "bug";

  const device = useMemo(() => typeof window === "undefined" ? "" : `${navigator.userAgent.slice(0, 120)} · screen ${screen.width}x${screen.height} · window ${window.innerWidth}x${window.innerHeight}`.slice(0, 200), []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (sending) return;
    if (message.trim().length < 10) { setError("Please write at least a short sentence (10 characters or more)."); return; }
    setSending(true); setError("");
    try {
      const page = from.startsWith("/") ? from : (() => { try { const r = new URL(document.referrer); return r.origin === location.origin ? r.pathname : ""; } catch { return ""; } })();
      const response = await fetch("/api/support/report", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, area, message, page, mood: bug ? null : mood, device: bug ? device : "", contact, website: trap }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "We could not send that. Please try again.");
      setDone(true); setMessage(""); setMood(null); setContact("");
    } catch (err) { setError(err instanceof Error ? err.message : "We could not send that. Please try again."); }
    finally { setSending(false); }
  }

  if (done) return <div className="hp-done" role="status">
    <CheckCircle2 size={40} aria-hidden="true" />
    <h3>Thank you, we got it.</h3>
    <p>{bug ? "The team will look into this problem." : "Your idea has been shared with the team that runs this site."}</p>
    <button type="button" className="hp-link" onClick={() => setDone(false)}>Send another</button>
  </div>;

  return <form onSubmit={submit} className="hp-form" noValidate>
    <div className="hp-kinds" role="group" aria-label="What would you like to send?">
      <button type="button" aria-pressed={bug} onClick={() => setKind("bug")} disabled={sending}><Bug size={19} aria-hidden="true" /><span>Report a problem<small>Something is broken or an error appeared</small></span></button>
      <button type="button" aria-pressed={!bug} onClick={() => setKind("improve")} disabled={sending}><Lightbulb size={19} aria-hidden="true" /><span>Suggest an improvement<small>What would make this site better for you?</small></span></button>
    </div>

    <fieldset className="hp-field" disabled={sending}>
      <legend>Which part is it about?</legend>
      <div className="hp-chips">{REPORT_AREAS.map(a => <button key={a} type="button" aria-pressed={area === a} onClick={() => setArea(a)}>{a}</button>)}</div>
    </fieldset>

    <label className="hp-field">{bug ? "What happened?" : "What should we improve?"}
      <textarea rows={5} maxLength={2000} value={message} disabled={sending} onChange={e => setMessage(e.target.value)}
        placeholder={bug ? "Tell us what you tapped, what you expected, and what you saw instead." : "Tell us what was hard, missing or confusing, and what would help."} />
      <span className="hp-count">{message.length}/2000</span>
    </label>

    {!bug && <fieldset className="hp-field" disabled={sending}>
      <legend>How was your experience overall? <span>Optional</span></legend>
      <div className="hp-moods">{FACES.map(f => <button key={f.id} type="button" aria-pressed={mood === f.id} aria-label={f.label} onClick={() => setMood(mood === f.id ? null : f.id)}><span aria-hidden="true">{f.glyph}</span><small>{f.label}</small></button>)}</div>
    </fieldset>}

    <label className="hp-field">Email or phone <span>Optional, only if you want a reply</span>
      <input value={contact} maxLength={120} disabled={sending} onChange={e => setContact(e.target.value)} placeholder="you@example.com" autoComplete="email" inputMode="email" />
    </label>

    {/* Honeypot: people never see or fill this; bots do. */}
    <div className="hp-trap" aria-hidden="true"><label>Website<input tabIndex={-1} autoComplete="off" value={trap} onChange={e => setTrap(e.target.value)} /></label></div>

    {bug && <p className="hp-note"><ShieldCheck size={15} aria-hidden="true" /> We attach your browser and screen size to help fix the problem. Please don&apos;t include passwords or private details.</p>}
    {error && <div role="alert" className="hp-error">{error}</div>}
    <button type="submit" className="hp-submit" disabled={sending || message.trim().length < 10}>{sending ? "Sending…" : bug ? "Send report" : "Send suggestion"} <ArrowUpRight size={18} aria-hidden="true" /></button>
  </form>;
}

function HelpContent() {
  const type = useSearchParams().get("type");
  return <PublicChrome>
    <main id="main-content" className="help-main page-width">
      <PageHero eyebrow="We're here to help" title="Help & support" lede="Reach the office, report something that isn't working, or tell us how to make CONNECT-Daet better." />
      <section className="hp-section" aria-labelledby="hp-contact-h">
        <div className="hp-heading"><p className="eyebrow">Talk to a person</p><h2 id="hp-contact-h">Contact us</h2></div>
        <Contacts />
      </section>
      <section className="hp-section" aria-labelledby="hp-report-h">
        <div className="hp-heading"><p className="eyebrow">Tell us more</p><h2 id="hp-report-h">Report a problem or share an idea</h2></div>
        <div className="hp-card"><ReportForm initial={type === "improve" ? "improve" : "bug"} /></div>
      </section>
    </main>
  </PublicChrome>;
}

export function HelpPage() {
  return <Suspense fallback={null}><HelpContent /></Suspense>;
}
