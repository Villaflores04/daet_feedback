/** Small helpers that keep Ask AI quick: instant replies for small talk, and a short-lived cache for the data it reads. */

const GREETING = /^(hi|hii+|hello|helo|hey|heya|yo|hola|good\s+(morning|afternoon|evening)|kumusta|kamusta|musta|magandang\s+(umaga|hapon|gabi))(\s+(there|po|ai|team|assistant))?[\s!.?,]*$/i;
const THANKS = /^(thanks?|thank\s*you|ty|salamat|maraming\s+salamat|ok(ay)?|okey|sige|got\s*it|great|nice|cool|noted|perfect|awesome|good)(\s+(po|you|so\s+much|a\s+lot|na))?[\s!.?,]*$/i;
const BYE = /^(bye|goodbye|see\s*you|paalam|later)[\s!.?,]*$/i;
const HELP = /^(help|what\s+can\s+you\s+do|what\s+do\s+you\s+do|how\s+(does|do)\s+(this|you)\s+work|who\s+are\s+you|ano\s+ang\s+magagawa\s+mo)[\s!.?]*$/i;
const TAGALOG = /(kumusta|kamusta|musta|magandang|salamat|sige|paalam|ano ang)/i;

const HELP_EN = "I answer questions about the visitor feedback in this desk. Try: “Which place needs the most attention, and why?”, “What do visitors praise most?”, or “Suggest 3 fixes I can do this week”. I can also draft a short memo or a polite reply, in English or Filipino.";
const HELP_FIL = "Sumasagot ako sa mga tanong tungkol sa feedback ng mga bisita sa desk na ito. Subukan: “Aling lugar ang nangangailangan ng pansin?”, “Ano ang pinupuri ng mga bisita?”, o “Isulat ang buod sa Filipino”.";

/** Returns a canned reply for pure small talk, or null when the message is a real question (which then goes to the AI). */
export function quickReply(text: string): string | null {
  const t = text.replace(/\s+/g, " ").trim();
  if (!t || t.length > 48) return null;
  const fil = TAGALOG.test(t);
  if (HELP.test(t)) return fil ? HELP_FIL : HELP_EN;
  if (GREETING.test(t)) return fil ? "Kumusta po! Ano ang gusto ninyong malaman tungkol sa feedback ng mga bisita?" : "Hi! What would you like to know about the visitor feedback? For example: “Which place needs the most attention?”";
  if (THANKS.test(t)) return fil ? "Walang anuman po! May iba pa ba kayong gustong itanong?" : "You're welcome! Ask me anything else about the feedback whenever you like.";
  if (BYE.test(t)) return fil ? "Paalam po! Narito lang ako kung kailangan ninyo." : "Goodbye! I'm here whenever you need me.";
  return null;
}

/** Caches an async loader for `ttlMs`, shares one in-flight call between callers, and never caches a failure. */
export function ttlCache<T>(ttlMs: number, load: () => Promise<T>) {
  let value: { at: number; data: T } | null = null;
  let inflight: Promise<T> | null = null;
  return async (): Promise<T> => {
    if (value && Date.now() - value.at < ttlMs) return value.data;
    inflight ??= load().then(data => { value = { at: Date.now(), data }; return data; }).finally(() => { inflight = null; });
    return inflight;
  };
}
