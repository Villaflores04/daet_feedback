"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { AlertTriangle, Check, Copy, History, MessageSquarePlus, Send, Sparkles, Trash2, X } from "lucide-react";
import { usePulse } from "@/lib/pulse/store";
import { useInsidePulses } from "@/lib/pulse/use-inside";
import { buildInsights } from "@/lib/pulse/insights";
import { buildAttention } from "@/lib/pulse/attention";
import { cn } from "@/lib/utils";

export const ASK_AI_EVENT = "desk-ask-ai";
// Per browser per day. Raised from 20 so the Facebook and recommendation questions are not cut off; Google's own quota still applies.
const DAILY_LIMIT = 100;
const DAY_KEY = "desk-ask-ai-day";

type Message = { role: "user" | "assistant"; content: string; error?: boolean };
type Chat = { id: string; title: string; updated: number; messages: Message[] };

// Chat history is kept in this browser only (localStorage). The most recent 30 chats are kept.
const CHATS_KEY = "desk-ask-ai-chats";
const MAX_CHATS = 30;
function readChats(): Chat[] {
  try { const v = JSON.parse(localStorage.getItem(CHATS_KEY) || "[]"); return Array.isArray(v) ? v.filter(c => c && typeof c.id === "string" && Array.isArray(c.messages)) : []; } catch { return []; }
}
function writeChats(chats: Chat[]) { try { localStorage.setItem(CHATS_KEY, JSON.stringify(chats.slice(0, MAX_CHATS))); } catch { /* storage may be blocked */ } }
const newId = () => `c${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const chatTitle = (m: Message[]) => { const t = (m.find(x => x.role === "user")?.content || "New chat").replace(/\s+/g, " ").trim(); return t.length > 60 ? `${t.slice(0, 57)}…` : t; };
const stamp = (t: number) => new Date(t).toLocaleString("en-PH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const today = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };
function readUsed() {
  try { const v = JSON.parse(localStorage.getItem(DAY_KEY) || "null"); return v?.d === today() ? Number(v.n) || 0 : 0; } catch { return 0; }
}
function writeUsed(n: number) { try { localStorage.setItem(DAY_KEY, JSON.stringify({ d: today(), n })); } catch { /* storage may be blocked */ } }

/** Prompt chips shown in the panel and on the Overview. The first "Understand" chip follows what the rules flagged. */
export function usePromptGroups() {
  const pulses = useInsidePulses();
  const channels = usePulse(s => s.channels);
  const pathname = usePathname();
  return useMemo(() => {
    const attention = buildAttention(buildInsights(pulses, channels));
    const flagged = attention.items.find(i => i.place && (i.level === "high" || i.level === "medium"));
    const understand = [
      flagged ? `Why is ${flagged.place} getting negative ratings?` : "Which place needs the most attention, and why?",
      "What do visitors praise most?",
      "Which topics come up most in unhappy comments?",
    ];
    if (pathname.startsWith("/desk/board")) understand.unshift("Summarise the written comments in plain words");
    return [
      { label: "Understand", prompts: understand },
      { label: "Act", prompts: ["Suggest 3 fixes I can do this week", "Draft a polite reply to the negative comments", "Ano ang mga dapat naming gawin ngayong linggo?"] },
      { label: "Facebook", prompts: ["Analyze the sentiment of Facebook reactions and comments", "Compare Facebook sentiment with feedback on this site", "Suriin ang sentimyento ng mga reaksyon at komento sa Facebook"] },
      { label: "Report", prompts: ["Give me a full briefing: findings, priorities, next steps", "Write a short memo for the mayor", "Isulat ang buod sa Filipino"] },
    ];
  }, [pulses, channels, pathname]);
}

export function openAskAi(prompt?: string) { window.dispatchEvent(new CustomEvent(ASK_AI_EVENT, { detail: { prompt } })); }

function CopyBtn({ text }: { text: string }) {
  const [done, setDone] = useState(false);
  return <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1800); } catch { /* clipboard may be blocked */ } }} className="mt-2 inline-flex min-h-9 items-center gap-1.5 rounded-full px-2.5 text-xs font-medium text-muted hover:bg-cool" aria-live="polite">{done ? <Check size={13} aria-hidden /> : <Copy size={13} aria-hidden />}{done ? "Copied" : "Copy"}</button>;
}

export function DeskAskAi() {
  const groups = usePromptGroups();
  const status = usePulse(s => s.syncStatus);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [used, setUsed] = useState(0);
  const [chats, setChats] = useState<Chat[]>([]);
  const [chatId, setChatId] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const field = useRef<HTMLTextAreaElement>(null);
  const history = useRef<Message[]>([]);
  history.current = messages;
  useEffect(() => { setUsed(readUsed()); setChats(readChats()); }, []);
  // Save the open conversation whenever it changes.
  useEffect(() => {
    if (!messages.length || busy) return;
    const id = chatId ?? newId();
    if (!chatId) setChatId(id);
    setChats(prev => {
      const next = [{ id, title: chatTitle(messages), updated: Date.now(), messages: messages.slice(-60) }, ...prev.filter(c => c.id !== id)].slice(0, MAX_CHATS);
      writeChats(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, busy]);
  const startNew = () => { setMessages([]); setChatId(null); setShowHistory(false); setInput(""); };
  const openChat = (c: Chat) => { setMessages(c.messages); setChatId(c.id); setShowHistory(false); };
  const removeChat = (id: string) => { setChats(prev => { const next = prev.filter(c => c.id !== id); writeChats(next); return next; }); if (id === chatId) { setMessages([]); setChatId(null); } };
  const clearChats = () => { setChats([]); writeChats([]); setMessages([]); setChatId(null); };
  const left = Math.max(0, DAILY_LIMIT - used);

  const send = useCallback(async (raw: string) => {
    const text = raw.replace(/\s+/g, " ").trim();
    setShowHistory(false);
    if (!text || busy) return;
    if (readUsed() >= DAILY_LIMIT) { setMessages(m => [...m, { role: "user", content: text }, { role: "assistant", error: true, content: `You've used today's ${DAILY_LIMIT} questions. The limit protects the AI quota and resets tomorrow.` }]); return; }
    // A question that failed is left out together with its error, so the next request never sends two user turns in a row.
    const kept = history.current.filter((m, i, all) => !m.error && !(m.role === "user" && all[i + 1]?.error));
    const next: Message[] = [...kept, { role: "user", content: text }];
    setMessages(m => [...m, { role: "user", content: text }]);
    setInput(""); setBusy(true);
    try {
      const response = await fetch("/api/desk/chat", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ messages: next.slice(-7).map(m => ({ role: m.role, content: m.content })) }) });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || "Ask AI is unavailable right now.");
      setMessages(m => [...m, { role: "assistant", content: String(body.reply) }]);
      if (!body.quick) { const n = readUsed() + 1; writeUsed(n); setUsed(n); }
    } catch (e) {
      setMessages(m => [...m, { role: "assistant", error: true, content: e instanceof Error ? e.message : "Ask AI is unavailable right now." }]);
    } finally { setBusy(false); }
  }, [busy]);

  useEffect(() => {
    const onOpen = (event: Event) => {
      const prompt = (event as CustomEvent<{ prompt?: string }>).detail?.prompt;
      setOpen(true);
      if (prompt) void send(prompt);
    };
    window.addEventListener(ASK_AI_EVENT, onOpen);
    return () => window.removeEventListener(ASK_AI_EVENT, onOpen);
  }, [send]);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);
  useEffect(() => { scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" }); }, [messages, busy]);
  useEffect(() => { if (open && window.matchMedia("(min-width: 768px)").matches) field.current?.focus(); }, [open]);

  // Draggable button: pointer events work for mouse, touch and pen. Position is remembered in this browser.
  const fab = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const drag = useRef<{ dx: number; dy: number; sx: number; sy: number; moved: boolean } | null>(null);
  const clamp = useCallback((x: number, y: number) => {
    const w = fab.current?.offsetWidth ?? 120, h = fab.current?.offsetHeight ?? 52;
    return { x: Math.min(Math.max(8, x), window.innerWidth - w - 8), y: Math.min(Math.max(8, y), window.innerHeight - h - 8) };
  }, []);
  useEffect(() => {
    try {
      const raw = localStorage.getItem("desk-ask-fab");
      if (raw) { const v = JSON.parse(raw); if (Number.isFinite(v.x) && Number.isFinite(v.y)) setPos(clamp(v.x, v.y)); }
    } catch { /* storage can be blocked */ }
    const onResize = () => setPos(p => (p ? clamp(p.x, p.y) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [clamp]);
  const fabHandlers = {
    onPointerDown: (e: React.PointerEvent<HTMLButtonElement>) => {
      const r = e.currentTarget.getBoundingClientRect();
      drag.current = { dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: React.PointerEvent<HTMLButtonElement>) => {
      const d = drag.current;
      if (!d) return;
      if (!d.moved && Math.hypot(e.clientX - d.sx, e.clientY - d.sy) < 6) return;
      d.moved = true;
      setPos(clamp(e.clientX - d.dx, e.clientY - d.dy));
    },
    onPointerUp: (e: React.PointerEvent<HTMLButtonElement>) => {
      const d = drag.current;
      drag.current = null;
      if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      if (d?.moved) {
        const r = e.currentTarget.getBoundingClientRect();
        try { localStorage.setItem("desk-ask-fab", JSON.stringify({ x: r.left, y: r.top })); } catch { /* ignore */ }
      } else setOpen(true);
    },
    onPointerCancel: () => { drag.current = null; },
    onKeyDown: (e: React.KeyboardEvent<HTMLButtonElement>) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen(true); } },
  };

  const blocked = status !== "connected";
  return (
    <>
      {!open ? (
        <button ref={fab} type="button" {...fabHandlers} className="desk-ask-fab" style={pos ? { left: pos.x, top: pos.y, right: "auto", bottom: "auto" } : undefined} aria-label="Ask AI about the feedback. Drag to move it.">
          <Sparkles size={18} aria-hidden /><span>Ask AI</span>
        </button>
      ) : null}
      {open ? <div className="desk-ask-backdrop" onClick={() => setOpen(false)} aria-hidden /> : null}
      {open ? (
        <section className="desk-ask-panel" role="dialog" aria-label="Ask AI" aria-describedby="ask-ai-note">
          <header className="desk-ask-head">
            <div className="min-w-0">
              <h2 className="flex items-center gap-2 text-base font-semibold"><Sparkles size={16} className="text-blue-600" aria-hidden />Ask AI</h2>
              <p id="ask-ai-note" className="text-xs text-muted">Draft answers from your latest data · officer review required</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button type="button" onClick={startNew} className="grid size-11 place-items-center rounded-full hover:bg-cool" aria-label="Start a new chat" title="New chat"><MessageSquarePlus size={18} aria-hidden /></button>
              <button type="button" onClick={() => setShowHistory(v => !v)} aria-pressed={showHistory} className={cn("grid size-11 place-items-center rounded-full hover:bg-cool", showHistory && "bg-cool")} aria-label="Chat history" title="History"><History size={18} aria-hidden /></button>
              <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", left <= 3 ? "bg-amber-100 text-amber-900" : "bg-cool text-muted")} aria-live="polite">{left} left today</span>
              <button type="button" onClick={() => setOpen(false)} className="grid size-11 place-items-center rounded-full hover:bg-cool" aria-label="Close Ask AI"><X size={18} aria-hidden /></button>
            </div>
          </header>
          <div ref={scroller} className="desk-ask-body">
            {showHistory ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">History · this browser</p>
                  {chats.length ? <button type="button" onClick={() => { if (window.confirm("Delete all saved chats in this browser?")) clearChats(); }} className="text-xs font-medium text-neg">Clear all</button> : null}
                </div>
                {chats.length === 0 ? <p className="text-sm text-muted">No saved chats yet. Your questions and answers are saved here automatically.</p> : (
                  <ul className="space-y-2">
                    {chats.map(c => (
                      <li key={c.id} className={cn("flex items-center gap-1 rounded-xl border bg-white", c.id === chatId ? "border-blue-300" : "border-line")}>
                        <button type="button" onClick={() => openChat(c)} className="min-w-0 flex-1 px-3 py-2 text-left">
                          <span className="block truncate text-sm font-medium">{c.title}</span>
                          <span className="block text-xs text-muted">{stamp(c.updated)} · {c.messages.filter(m => m.role === "user").length} question(s)</span>
                        </button>
                        <button type="button" onClick={() => removeChat(c.id)} className="grid size-11 shrink-0 place-items-center text-muted hover:text-neg" aria-label={`Delete chat: ${c.title}`}><Trash2 size={16} aria-hidden /></button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : messages.length === 0 ? (
              <div className="space-y-4">
                <p className="text-sm leading-6 text-muted">Pick a question or type your own. Answers use counts and redacted comments only: no names, photos or contact details.</p>
                {blocked ? <p className="rounded-xl bg-amber-50 p-3 text-xs leading-5 text-amber-900">Data may be incomplete or cached. Refresh the Overview before relying on answers.</p> : null}
                {groups.map(group => (
                  <div key={group.label}>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{group.label}</p>
                    <div className="flex flex-wrap gap-2">{group.prompts.map(p => <button key={p} type="button" onClick={() => void send(p)} disabled={busy} className="desk-ask-chip">{p}</button>)}</div>
                  </div>
                ))}
              </div>
            ) : (
              <ul className="space-y-3" aria-live="polite">
                {messages.map((m, i) => (
                  <li key={i} className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}>
                    <div className={cn("max-w-[92%] rounded-2xl px-3.5 py-2.5 text-sm leading-6", m.role === "assistant" && !m.error && "w-[92%]", m.role === "user" ? "bg-blue-600 text-white" : m.error ? "border border-amber-200 bg-amber-50 text-amber-900" : "border border-line bg-white")}>
                      {m.error ? <p className="mb-1 flex items-center gap-1.5 text-xs font-semibold"><AlertTriangle size={13} aria-hidden />Couldn’t answer</p> : null}
                      <p className="whitespace-pre-wrap break-words">{m.content}</p>
                      {m.role === "assistant" && !m.error ? <><p className="mt-2 text-[11px] text-muted">AI-generated draft · based on the latest 500 entries</p><CopyBtn text={m.content} /></> : null}
                    </div>
                  </li>
                ))}
                {busy ? <li className="flex justify-start"><div className="rounded-2xl border border-line bg-white px-4 py-3" role="status" aria-label="Thinking"><span className="desk-ask-dots" aria-hidden><i /><i /><i /></span></div></li> : null}
              </ul>
            )}
          </div>
          {messages.length && !showHistory ? (
            <div className="desk-ask-chips" aria-label="Suggested questions">
              {groups.flatMap(g => g.prompts).map(p => <button key={p} type="button" onClick={() => void send(p)} disabled={busy} className="desk-ask-chip desk-ask-chip-small">{p}</button>)}
            </div>
          ) : null}
          <form className="desk-ask-form" onSubmit={e => { e.preventDefault(); void send(input); }}>
            <label className="sr-only" htmlFor="ask-ai-input">Your question</label>
            <textarea id="ask-ai-input" ref={field} value={input} rows={1} maxLength={500} onChange={e => setInput(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void send(input); } }} placeholder="Ask about ratings, comments, places…" disabled={busy} />
            <button type="submit" disabled={busy || !input.trim()} className="desk-ask-send" aria-label="Send question"><Send size={17} aria-hidden /></button>
          </form>
        </section>
      ) : null}
    </>
  );
}
