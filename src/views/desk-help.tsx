"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Bug, ExternalLink, Facebook, Lightbulb, Link2, Mail, MessageCircle, Pencil, Phone, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FACES } from "@/lib/pulse/faces";
import { ago } from "@/lib/pulse/places";
import { CONTACT_KINDS, CONTACT_LABELS, REPORT_STATUSES, contactHref, type ContactKind, type ReportStatus, type SupportContact, type SupportReport } from "@/lib/support-shared";

const ICONS: Record<ContactKind, typeof Phone> = { phone: Phone, email: Mail, messenger: MessageCircle, facebook: Facebook, other: Link2 };
const HINTS: Record<ContactKind, string> = { phone: "+63 912 345 6789", email: "tourism@daet.gov.ph", messenger: "https://m.me/yourpage or just the page username", facebook: "https://facebook.com/yourpage", other: "A https:// link, or plain text such as an office address" };
const STATUS_LABEL: Record<ReportStatus, string> = { new: "New", progress: "In progress", resolved: "Resolved" };

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init, headers: { "content-type": "application/json", ...(init?.headers || {}) } });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Something went wrong. Please try again.");
  return body as T;
}
const changed = () => window.dispatchEvent(new Event("desk-support-changed"));

/* ---------- Reports ---------- */
function replyLink(contact: string) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)) return `mailto:${contact}`;
  if (/^\+?[\d\s()\-]{7,20}$/.test(contact)) return `tel:${contact.replace(/[^\d+]/g, "")}`;
  return null;
}

function ReportCard({ report, onChange, onDelete }: { report: SupportReport; onChange: (r: SupportReport) => void; onDelete: (id: string) => void }) {
  const [note, setNote] = useState(report.adminNote);
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const bug = report.kind === "bug";
  const mood = FACES.find(f => f.id === report.mood);
  const link = report.contact ? replyLink(report.contact) : null;

  async function patch(body: { status?: ReportStatus; adminNote?: string }, ok?: string) {
    setSaving(true);
    try { const r = await call<{ report: SupportReport }>("/api/desk/support/reports", { method: "PATCH", body: JSON.stringify({ id: report.id, ...body }) }); onChange(r.report); if (ok) toast.success(ok); changed(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not save."); }
    finally { setSaving(false); }
  }

  return <li className={`dh-report ${report.status === "new" ? "is-new" : ""}`}>
    <div className="dh-report-top">
      <span className={`dh-kind ${bug ? "bug" : "idea"}`}>{bug ? <Bug size={14} aria-hidden /> : <Lightbulb size={14} aria-hidden />}{bug ? "Problem" : "Improvement"}</span>
      <span className="dh-chip">{report.area}</span>
      {mood && <span className="dh-chip" title={`Experience: ${mood.label}`}><span aria-hidden>{mood.glyph}</span> {mood.label}</span>}
      <time className="dh-time" dateTime={new Date(report.createdAt).toISOString()} title={new Date(report.createdAt).toLocaleString("en-PH")}>{ago(report.createdAt)}</time>
    </div>
    <p className="dh-message">{report.message}</p>
    <dl className="dh-meta">
      {report.page && <div><dt>Page</dt><dd><Link href={report.page} target="_blank" className="dh-inline">{report.page} <ExternalLink size={12} aria-hidden /></Link></dd></div>}
      {report.contact && <div><dt>Reply to</dt><dd>{link ? <a href={link} className="dh-inline">{report.contact}</a> : report.contact}</dd></div>}
    </dl>
    {report.device && <details className="dh-device"><summary>Browser and screen</summary><p>{report.device}</p></details>}
    <div className="dh-status" role="group" aria-label="Status">
      {REPORT_STATUSES.map(s => <button key={s} type="button" aria-pressed={report.status === s} disabled={saving} onClick={() => report.status !== s && patch({ status: s })}>{STATUS_LABEL[s]}</button>)}
    </div>
    <label className="dh-note">Private note <span>(only the desk sees this)</span>
      <textarea rows={2} maxLength={1000} value={note} onChange={e => setNote(e.target.value)} placeholder="What was done, or who is handling it" />
    </label>
    <div className="dh-actions">
      <Button type="button" size="sm" variant="outline" disabled={saving || note === report.adminNote} onClick={() => patch({ adminNote: note }, "Note saved")}>Save note</Button>
      {confirming
        ? <><span className="dh-sure">Delete this report?</span><Button type="button" size="sm" variant="danger" onClick={() => onDelete(report.id)}>Yes, delete</Button><Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(false)}>Cancel</Button></>
        : <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(true)}><Trash2 size={15} aria-hidden /> Delete</Button>}
    </div>
  </li>;
}

function Reports() {
  const [reports, setReports] = useState<SupportReport[] | null>(null);
  const [error, setError] = useState("");
  const [kind, setKind] = useState<"all" | "bug" | "improve">("all");
  const [status, setStatus] = useState<"all" | ReportStatus>("all");
  const load = useCallback(() => { call<{ reports: SupportReport[] }>("/api/desk/support/reports").then(b => { setReports(b.reports); setError(""); }).catch(e => { setReports([]); setError(e instanceof Error ? e.message : "Could not load reports."); }); }, []);
  useEffect(() => { load(); }, [load]);

  const counts = useMemo(() => {
    const list = reports || [];
    return { all: list.length, bug: list.filter(r => r.kind === "bug").length, improve: list.filter(r => r.kind === "improve").length, new: list.filter(r => r.status === "new").length, progress: list.filter(r => r.status === "progress").length, resolved: list.filter(r => r.status === "resolved").length };
  }, [reports]);
  const shown = (reports || []).filter(r => (kind === "all" || r.kind === kind) && (status === "all" || r.status === status));

  async function remove(id: string) {
    try { await call("/api/desk/support/reports", { method: "DELETE", body: JSON.stringify({ id }) }); setReports(list => (list || []).filter(r => r.id !== id)); toast.success("Report deleted"); changed(); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not delete."); }
  }

  if (!reports) return <p className="dh-empty" aria-busy="true">Loading reports…</p>;
  return <div>
    <div className="dh-filters">
      <div className="dh-chips" role="group" aria-label="Type">
        {([["all", `All (${counts.all})`], ["bug", `Problems (${counts.bug})`], ["improve", `Improvements (${counts.improve})`]] as const).map(([v, l]) => <button key={v} type="button" aria-pressed={kind === v} onClick={() => setKind(v)}>{l}</button>)}
      </div>
      <div className="dh-chips" role="group" aria-label="Status">
        {([["all", "Any status"], ["new", `New (${counts.new})`], ["progress", `In progress (${counts.progress})`], ["resolved", `Resolved (${counts.resolved})`]] as const).map(([v, l]) => <button key={v} type="button" aria-pressed={status === v} onClick={() => setStatus(v)}>{l}</button>)}
      </div>
    </div>
    {error && <p className="dh-error" role="alert">{error}</p>}
    {!error && !shown.length && <p className="dh-empty">{reports.length ? "Nothing matches these filters." : "No reports yet. When a visitor reports a problem or shares an idea on the Help & support page, it appears here."}</p>}
    <ul className="dh-list">{shown.map(r => <ReportCard key={r.id} report={r} onChange={u => setReports(list => (list || []).map(x => x.id === u.id ? u : x))} onDelete={remove} />)}</ul>
  </div>;
}

/* ---------- Contacts ---------- */
function ContactForm({ initial, onSaved, onCancel }: { initial: SupportContact | null; onSaved: (c: SupportContact) => void; onCancel: () => void }) {
  const [kind, setKind] = useState<ContactKind>(initial?.kind ?? "phone");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [value, setValue] = useState(initial?.value ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function save(e: React.FormEvent) {
    e.preventDefault(); if (busy) return; setBusy(true); setError("");
    try { const r = await call<{ contact: SupportContact }>("/api/desk/support/contacts", { method: "POST", body: JSON.stringify({ id: initial?.id, kind, label, value, note }) }); onSaved(r.contact); }
    catch (err) { setError(err instanceof Error ? err.message : "Could not save."); }
    finally { setBusy(false); }
  }
  return <form className="dh-form" onSubmit={save} noValidate>
    <h2>{initial ? "Edit contact" : "Add a contact"}</h2>
    <div className="dh-chips" role="group" aria-label="Kind of contact">{CONTACT_KINDS.map(k => <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)}>{CONTACT_LABELS[k]}</button>)}</div>
    <label>Name shown to visitors<input value={label} maxLength={60} onChange={e => setLabel(e.target.value)} placeholder="Municipal Tourism Office" /></label>
    <label>{CONTACT_LABELS[kind]}<input value={value} maxLength={200} onChange={e => setValue(e.target.value)} placeholder={HINTS[kind]} inputMode={kind === "phone" ? "tel" : kind === "email" ? "email" : "url"} autoComplete="off" /></label>
    <label>Note <span>(optional, for example office hours)</span><input value={note} maxLength={120} onChange={e => setNote(e.target.value)} placeholder="Mon to Fri, 8:00 AM to 5:00 PM" /></label>
    {error && <p className="dh-error" role="alert">{error}</p>}
    <div className="dh-actions"><Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button><Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button></div>
  </form>;
}

function Contacts() {
  const [contacts, setContacts] = useState<SupportContact[] | null>(null);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<SupportContact | "new" | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  useEffect(() => { call<{ contacts: SupportContact[] }>("/api/desk/support/contacts").then(b => setContacts(b.contacts)).catch(e => { setContacts([]); setError(e instanceof Error ? e.message : "Could not load contacts."); }); }, []);

  async function move(index: number, dir: -1 | 1) {
    if (!contacts) return; const next = [...contacts]; const j = index + dir; if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]]; setContacts(next);
    try { await call("/api/desk/support/contacts", { method: "PUT", body: JSON.stringify({ order: next.map(c => c.id) }) }); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not reorder."); }
  }
  async function remove(id: string) {
    try { await call("/api/desk/support/contacts", { method: "DELETE", body: JSON.stringify({ id }) }); setContacts(l => (l || []).filter(c => c.id !== id)); setDeleting(null); toast.success("Contact removed"); }
    catch (e) { toast.error(e instanceof Error ? e.message : "Could not remove."); }
  }
  function saved(c: SupportContact) {
    setContacts(l => { const list = l || []; return list.some(x => x.id === c.id) ? list.map(x => x.id === c.id ? c : x) : [...list, c]; });
    setEditing(null); toast.success("Contact saved");
  }

  if (!contacts) return <p className="dh-empty" aria-busy="true">Loading contacts…</p>;
  return <div>
    <div className="dh-intro"><p>These are shown to visitors on the <Link href="/help" target="_blank" className="dh-inline">Help &amp; support page <ExternalLink size={12} aria-hidden /></Link>. Add as many as you need, such as an office line, a helpdesk email and your Messenger page.</p>
      {!editing && <Button type="button" onClick={() => setEditing("new")}><Plus size={16} aria-hidden /> Add contact</Button>}</div>
    {error && <p className="dh-error" role="alert">{error}</p>}
    {editing && <ContactForm initial={editing === "new" ? null : editing} onSaved={saved} onCancel={() => setEditing(null)} />}
    {!error && !contacts.length && !editing && <p className="dh-empty">No contacts yet. Visitors will see a note that the office hasn&apos;t published any.</p>}
    <ul className="dh-list">
      {contacts.map((c, i) => { const Icon = ICONS[c.kind]; const href = contactHref(c); return <li key={c.id} className="dh-contact">
        <span className="dh-contact-icon" aria-hidden><Icon size={18} /></span>
        <div className="dh-contact-body"><p className="dh-kind-label">{CONTACT_LABELS[c.kind]}</p><p className="dh-contact-name">{c.label}</p>
          <p className="dh-contact-value">{href && href.startsWith("https://") ? <a href={href} target="_blank" rel="noopener noreferrer" className="dh-inline">{c.value}</a> : c.value}</p>{c.note && <p className="dh-contact-note">{c.note}</p>}</div>
        <div className="dh-contact-actions">
          <button type="button" aria-label={`Move ${c.label} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp size={16} /></button>
          <button type="button" aria-label={`Move ${c.label} down`} disabled={i === contacts.length - 1} onClick={() => move(i, 1)}><ArrowDown size={16} /></button>
          <button type="button" aria-label={`Edit ${c.label}`} onClick={() => setEditing(c)}><Pencil size={16} /></button>
          {deleting === c.id
            ? <span className="dh-sure"><button type="button" className="danger" onClick={() => remove(c.id)}>Delete</button><button type="button" onClick={() => setDeleting(null)}>Keep</button></span>
            : <button type="button" aria-label={`Delete ${c.label}`} onClick={() => setDeleting(c.id)}><Trash2 size={16} /></button>}
        </div>
      </li>; })}
    </ul>
  </div>;
}

export function DeskHelp() {
  const [tab, setTab] = useState<"reports" | "contacts">("reports");
  return <div className="dh">
    <p className="text-xs uppercase tracking-[0.18em] text-muted">Visitor help</p>
    <h1 className="mt-1 font-display text-3xl tracking-tight">Help &amp; support</h1>
    <div className="dh-tabs" role="tablist" aria-label="Help and support sections">
      <button type="button" role="tab" aria-selected={tab === "reports"} onClick={() => setTab("reports")}>Reports &amp; ideas</button>
      <button type="button" role="tab" aria-selected={tab === "contacts"} onClick={() => setTab("contacts")}>Contact accounts</button>
    </div>
    <div role="tabpanel">{tab === "reports" ? <Reports /> : <Contacts />}</div>
  </div>;
}
