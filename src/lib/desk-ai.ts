import "server-only";
import { supabaseServer } from "@/lib/supabase-server";
import { buildInsights } from "@/lib/pulse/insights";
import { buildAttention } from "@/lib/pulse/attention";
import { buildComments } from "@/lib/pulse/briefing";
import type { Channel, Pulse } from "@/lib/pulse/types";

export const MODEL_NAME = /^[a-zA-Z0-9.-]+$/;
const RETRYABLE = [500, 502, 503, 504];

export function explain(status: number, reason: string, model: string) {
  const hint = status === 400 && /api key/i.test(reason) ? "The API key was rejected. Check GEMINI_API_KEY."
    : status === 401 || status === 403 ? "The API key is not allowed to use this model (check key restrictions and that the Generative Language API is enabled)."
    : status === 404 ? `Model "${model}" was not found for this key. Check GEMINI_MODEL (or GEMINI_FALLBACK_MODEL).`
    : status === 429 ? "Quota or rate limit reached. If it is the per-minute limit, wait a minute; a daily limit resets the next day. You can also check usage and billing in Google AI Studio."
    : status === 503 ? "The AI model is busy right now. Please try again in a moment."
    : "AI service unavailable.";
  return `${hint} (Gemini ${status}: ${reason})`;
}

export type Turn = { role: "user" | "model"; text: string };

/**
 * Calls Gemini with retries inside the 30s function limit: primary, fallback, primary again. A model that reports 429
 * (quota) is never called twice, because the limit will not clear within seconds and extra calls only burn quota.
 */
export async function ask(opts: { key: string; models: string[]; system: string; turns: Turn[]; maxTokens?: number }): Promise<string> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: opts.turns.map(t => ({ role: t.role, parts: [{ text: t.text }] })),
    // Thinking tokens count against the limit, so keep generous headroom or answers get cut off mid-sentence.
    generationConfig: { maxOutputTokens: opts.maxTokens ?? 4096, temperature: 0.3 },
  });
  const primary = opts.models[0];
  const secondary = opts.models[opts.models.length - 1];
  const attempts = [primary, secondary, primary];
  const exhausted = new Set<string>();
  const deadline = Date.now() + 26000;
  let lastError = "";
  for (const [i, name] of attempts.entries()) {
    if (exhausted.has(name)) continue;
    const left = deadline - Date.now();
    if (left < 4000) break;
    if (i) await new Promise(resolve => setTimeout(resolve, 600));
    let response: Response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${name}:generateContent`, {
        method: "POST", signal: AbortSignal.timeout(Math.min(14000, left)), headers: { "content-type": "application/json", "x-goog-api-key": opts.key }, body,
      });
    } catch { lastError = "The AI took too long to answer. Please retry."; console.error(`Gemini attempt ${i + 1} failed or timed out (model ${name})`); continue; }
    if (!response.ok) {
      const detail = await response.json().catch(() => null) as { error?: { message?: string; status?: string } } | null;
      const reason = detail?.error?.message?.slice(0, 200) || detail?.error?.status || "no details";
      console.error(`Gemini attempt ${i + 1} failed (${response.status}, model ${name}): ${reason}`);
      lastError = explain(response.status, reason, name);
      if (response.status === 429) { exhausted.add(name); continue; }
      if (RETRYABLE.includes(response.status)) continue;
      throw new Error(lastError);
    }
    const result = await response.json().catch(() => null) as { candidates?: { finishReason?: string; content?: { parts?: { text?: string; thought?: boolean }[] } }[] } | null;
    const candidate = result?.candidates?.[0];
    const text = (candidate?.content?.parts || []).filter(part => !part.thought).map(part => part.text || "").join("").trim();
    if (candidate?.finishReason === "MAX_TOKENS" && text.length < 40) { lastError = "The AI reply was cut off. Please retry."; continue; }
    if (text) return text;
    lastError = "The AI returned an empty reply. Please retry.";
  }
  throw new Error(lastError || "The AI took too long to answer. Please retry.");
}

/** Reads the latest shared data and returns what the AI may see: aggregate counts, rule-based attention items and redacted comment text. */
export async function loadDeskContext() {
  const db = supabaseServer();
  const [p, c] = await Promise.all([
    db.from("pulses").select("id,channel_id,parent_id,face,body,created_at,reacts_up,reacts_down").order("created_at", { ascending: false }).limit(500),
    db.from("channels").select("id,name,slug"),
  ]);
  if (p.error || c.error) throw new Error("Could not load current data.");
  const pulses: Pulse[] = (p.data || []).map(row => ({ id: row.id, channelId: row.channel_id, parentId: row.parent_id, face: row.face, body: row.body || "", callsign: "", createdAt: Date.parse(row.created_at), reacts: { up: row.reacts_up, down: row.reacts_down } }));
  if (!pulses.length) return null;
  const channels = (c.data || []) as Channel[];
  const insights = buildInsights(pulses, channels);
  // Never sent: names/callsigns, photos, ids, contact details.
  const { lines, cutoff, ...aggregates } = insights;
  void lines; void cutoff;
  return JSON.stringify({
    ...aggregates,
    places: aggregates.places.map(({ id, slug, ...place }) => { void id; void slug; return place; }),
    attention: buildAttention(insights).items.map(({ level, title, place }) => ({ level, title, place })),
    comments: buildComments(pulses, channels, 50),
  });
}
