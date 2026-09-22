import { NextResponse } from "next/server";
import { createSession, equal, hasDeskSession, sameOrigin, SESSION_COOKIE } from "@/lib/desk-session";

export async function GET() {
  return NextResponse.json({ unlocked: await hasDeskSession() }, { headers: { "cache-control": "no-store" } });
}
export async function POST(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const body = await request.json().catch(() => ({}));
  const password = process.env.ADMIN_DESK_KEY;
  if (!password) return NextResponse.json({ error: "The municipal desk password has not been configured on the server." }, { status: 503 });
  if (typeof body.password !== "string" || !equal(body.password, password)) {
    return NextResponse.json({ error: "That password does not open the desk." }, { status: 401 });
  }
  try {
    const response = NextResponse.json({ unlocked: true });
    response.cookies.set(SESSION_COOKIE, createSession(), { httpOnly: true, sameSite: "strict", secure: new URL(request.url).protocol === "https:", path: "/", maxAge: 8 * 60 * 60 });
    return response;
  } catch {
    return NextResponse.json({ error: "The server needs its Supabase service-role key configured." }, { status: 503 });
  }
}
export async function DELETE(request: Request) {
  if (!sameOrigin(request)) return NextResponse.json({ error: "Invalid request origin." }, { status: 403 });
  const response = NextResponse.json({ unlocked: false });
  response.cookies.delete(SESSION_COOKIE);
  return response;
}
