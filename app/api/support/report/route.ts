import { NextResponse } from "next/server";
import { sameOrigin } from "@/lib/desk-session";
import { uid } from "@/lib/pulse/ids";
import { cleanReport } from "@/lib/support-validate";
import { missingTable, supportDb, tooMany } from "@/lib/support-db";

export const dynamic = "force-dynamic";

/** Public: submit a problem report or an improvement idea. Only the signed-in desk can read what is stored. */
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "This request was blocked." }, { status: 403 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0].trim() || "unknown";
  if (tooMany(`report:${ip}`, 5, 10 * 60 * 1000)) return NextResponse.json({ error: "You've sent several reports in a short time. Please wait a few minutes and try again." }, { status: 429 });
  const raw = await request.text().catch(() => "");
  if (raw.length > 8000) return NextResponse.json({ error: "That report is too long." }, { status: 413 });
  let input: unknown = null;
  try { input = JSON.parse(raw); } catch { /* handled below */ }
  // Hidden field a person never fills in: bots do. Pretend success so they learn nothing.
  if (input && typeof input === "object" && (input as { website?: unknown }).website) return NextResponse.json({ id: "ok" });
  const result = cleanReport(input);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 400 });
  try {
    const id = uid("rep");
    const { error } = await supportDb().from("support_reports").insert({ id, ...result.value });
    if (error) {
      if (missingTable(error)) return NextResponse.json({ error: "Help & Support is not set up yet. Please contact the office directly." }, { status: 503 });
      throw error;
    }
    return NextResponse.json({ id });
  } catch { return NextResponse.json({ error: "We could not save your report. Please try again in a moment." }, { status: 503 }); }
}
