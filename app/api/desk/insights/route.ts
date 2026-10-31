import { NextResponse } from "next/server";
import { hasDeskSession, sameOrigin } from "@/lib/desk-session";
import { supabaseServer } from "@/lib/supabase-server";
import { buildInsights } from "@/lib/pulse/insights";
import { buildAttention } from "@/lib/pulse/attention";
import { BRIEFING_PROMPT, buildComments, parseBriefing, reportPrompt } from "@/lib/pulse/briefing";
import type { Pulse, Channel } from "@/lib/pulse/types";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const RETRYABLE = [500, 502, 503, 504];
const MODEL_NAME = /^[a-zA-Z0-9.-]+$/;

function explain(status: number, reason: string, model: string) {
  const hint = status === 400 && /api key/i.test(reason) ? "The API key was rejected. Check GEMINI_API_KEY."
    : status === 401 || status === 403 ? "The API key is not allowed to use this model (check key restrictions and that the Generative Language API is enabled)."
    : status === 404 ? `Model "${model}" was not found for this key. Check GEMINI_MODEL (or GEMINI_FALLBACK_MODEL).`
    : status === 429 ? "Quota or rate limit reached. If it is the per-minute limit, wait a minute; a daily limit resets the next day. You can also check usage and billing in Google AI Studio."
    : status === 503 ? "The AI model is busy right now. Please try again in a moment."
    : "AI service unavailable.";
  return `${hint} (Gemini ${status}: ${reason})`;
}

/**
 * Calls Gemini with retries. A busy model, a timeout, a reply cut off by the token limit, or a reply the caller's
 * `accept` rejects all move on to the next attempt (alternating primary and fallback model) inside the 30s limit.
 */
async function ask<T>(opts: { key: string; models: string[]; system: string; user: string; json: boolean; accept: (text: string) => T | null }): Promise<T> {
  const body = JSON.stringify({
    systemInstruction: { parts: [{ text: opts.system }] },
    contents: [{ role: "user", parts: [{ text: opts.user }] }],
    // Thinking tokens count against the limit, so keep generous headroom or answers get cut off mid-sentence.
    generationConfig: { maxOutputTokens: 8192, temperature: 0.3, ...(opts.json ? { responseMimeType: "application/json" } : {}) },
  });
  // At most three calls: primary, fallback, primary again. A model that reports 429 (quota) is never called twice,
  // because the limit will not clear within seconds and every extra call only burns more quota.
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
    } catch { lastError = "The briefing timed out. Please retry."; console.error(`Gemini attempt ${i + 1} failed or timed out (model ${name})`); continue; }
    if (!response.ok) {
      // Surface Google's reason (never the key) so a bad key, bad model and busy model can be told apart.
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
    if (candidate?.finishReason === "MAX_TOKENS") { lastError = "The AI reply was cut off. Please retry."; console.error(`Gemini attempt ${i + 1} hit the token limit (model ${name})`); continue; }
    const text = (candidate?.content?.parts || []).filter(part => !part.thought).map(part => part.text || "").join("").trim();
    const accepted = text ? opts.accept(text) : null;
    if (accepted !== null) return accepted;
    lastError = "The AI returned an incomplete result. Please retry.";
    console.error(`Gemini attempt ${i + 1} returned an unusable reply (model ${name})`);
  }
  throw new Error(lastError || "The briefing timed out. Please retry.");
}

export async function POST(request: Request) {
  if (!sameOrigin(request) || !await hasDeskSession()) return NextResponse.json({ error: "Please sign in to the Municipal Desk." }, { status: 401 });
  // Trim: a pasted key or model name often carries a trailing space or newline.
  const key = process.env.GEMINI_API_KEY?.trim();
  const model = process.env.GEMINI_MODEL?.trim();
  if (!key || !model || !MODEL_NAME.test(model)) return NextResponse.json({ error: "AI briefings are not connected yet. Configure GEMINI_API_KEY and GEMINI_MODEL on the server to enable them." }, { status: 503 });
  const input = await request.json().catch(() => ({})) as { mode?: string; lang?: string };
  const mode = input.mode === "report" ? "report" : "briefing";
  const lang = input.lang === "fil" ? "fil" : "en";
  const fallbackName = process.env.GEMINI_FALLBACK_MODEL?.trim() || "gemini-3.5-flash-lite";
  const models = [model, ...(fallbackName !== model && MODEL_NAME.test(fallbackName) ? [fallbackName] : [])];
  try {
    const db = supabaseServer();
    const [p, c] = await Promise.all([db.from("pulses").select("id,channel_id,parent_id,face,body,created_at,reacts_up,reacts_down").order("created_at", { ascending: false }).limit(500), db.from("channels").select("id,name,slug")]);
    if (p.error || c.error) throw new Error("Could not load current data.");
    const pulses: Pulse[] = (p.data || []).map(row => ({ id: row.id, channelId: row.channel_id, parentId: row.parent_id, face: row.face, body: row.body || "", callsign: "", createdAt: Date.parse(row.created_at), reacts: { up: row.reacts_up, down: row.reacts_down } }));
    if (!pulses.length) return NextResponse.json({ error: "Collect feedback before generating a briefing." }, { status: 400 });
    const channels = (c.data || []) as Channel[];
    const insights = buildInsights(pulses, channels);
    // Sent to the AI: aggregate counts plus redacted comment text. Never names/callsigns, photos, ids or contact details.
    const { lines, cutoff, ...aggregates } = insights;
    void lines; void cutoff;
    const user = JSON.stringify({ ...aggregates, places: aggregates.places.map(({ id, slug, ...place }) => { void id; void slug; return place; }), attention: buildAttention(insights).items.map(({ level, title, place }) => ({ level, title, place })), comments: buildComments(pulses, channels, 40) });
    const headers = { "cache-control": "no-store" };
    if (mode === "report") {
      const report = await ask({ key, models, system: reportPrompt(lang), user, json: false, accept: text => (text.length > 60 ? text.slice(0, 5000) : null) });
      return NextResponse.json({ report }, { headers });
    }
    const briefing = await ask({ key, models, system: BRIEFING_PROMPT, user, json: true, accept: parseBriefing });
    return NextResponse.json({ briefing }, { headers });
  } catch (error) { return NextResponse.json({ error: error instanceof Error && error.name !== "TimeoutError" ? error.message : "The briefing timed out. Please retry." }, { status: 503 }); }
}
