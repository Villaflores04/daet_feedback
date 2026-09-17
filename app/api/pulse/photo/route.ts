import { NextResponse } from "next/server";
import { supabaseStorageServer } from "@/lib/supabase-server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  try {
    const form = await request.formData();
    const id = String(form.get("id") || "");
    const file = form.get("file");
    if (!/^[a-zA-Z0-9_-]{8,120}$/.test(id) || !(file instanceof File)) {
      return NextResponse.json(
        { error: "Invalid image upload." },
        { status: 400 },
      );
    }
    if (!file.type.startsWith("image/") || file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Use an image smaller than 5 MB." },
        { status: 400 },
      );
    }
    const db = supabaseStorageServer();
    const path = `${id}.jpg`;
    const { error } = await db.storage
      .from("pulse-photos")
      .upload(path, await file.arrayBuffer(), {
        contentType: "image/jpeg",
        upsert: true,
        cacheControl: "31536000",
      });
    if (error) throw error;
    const { data } = db.storage.from("pulse-photos").getPublicUrl(path);
    return NextResponse.json({ url: data.publicUrl }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Could not save the image.",
      },
      { status: 503 },
    );
  }
}
