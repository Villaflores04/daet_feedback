import { NextResponse } from "next/server";
import { adminCookieHeader, passwordOk, signAdminToken } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const password = String(body.password || "");
  if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json({ error: "Admin env vars are not set on the server." }, { status: 500 });
  }
  if (!passwordOk(password)) return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  const res = NextResponse.json({ ok: true });
  res.headers.set("Set-Cookie", adminCookieHeader(signAdminToken()));
  return res;
}
