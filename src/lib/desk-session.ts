import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const SESSION_COOKIE = "daet-desk-session";
export function equal(a: string, b: string) {
  const left = Buffer.from(a), right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}
function sign(value: string) {
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("The server needs its Supabase service-role key configured.");
  return createHmac("sha256", secret).update(`desk:${value}`).digest("hex");
}
export function createSession() {
  const expires = String(Date.now() + 8 * 60 * 60 * 1000);
  return `${expires}.${sign(expires)}`;
}
export async function hasDeskSession() {
  try {
    const token = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
    const [expires, signature] = token.split(".");
    return Number(expires) > Date.now() && Boolean(signature) && equal(signature, sign(expires));
  } catch { return false; }
}
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  return !origin || origin === new URL(request.url).origin;
}
