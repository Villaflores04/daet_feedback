import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MAX = 5 * 1024 * 1024;

export async function POST(req: Request) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "Choose an image file." }, { status: 400 });
  if (!ALLOWED.has(file.type)) return NextResponse.json({ error: "Use JPG, PNG, WEBP, or GIF." }, { status: 400 });
  if (file.size > MAX) return NextResponse.json({ error: "Image must be 5 MB or smaller." }, { status: 400 });

  const ext = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `covers/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());

  const admin = supabaseAdmin();
  const { error } = await admin.storage.from("spot-covers").upload(path, buf, {
    contentType: file.type,
    upsert: true
  });
  if (error) {
    return NextResponse.json(
      {
        error:
          error.message.includes("Bucket") || error.message.includes("not found")
            ? "Storage bucket missing. Run supabase/fix_grants.sql in the SQL editor."
            : error.message
      },
      { status: 500 }
    );
  }
  const { data } = admin.storage.from("spot-covers").getPublicUrl(path);
  return NextResponse.json({ url: data.publicUrl });
}
