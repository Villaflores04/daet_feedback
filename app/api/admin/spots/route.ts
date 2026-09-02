import { NextResponse } from "next/server";
import { isAdminRequest } from "@/lib/admin-auth";
import { supabaseAdmin } from "@/lib/supabase";

function slugify(name: string) {
  return name.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60);
}

export async function POST(req: Request) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const name = String(body.name || "").trim();
  if (name.length < 3) return NextResponse.json({ error: "Name is too short." }, { status: 400 });
  const row = {
    name,
    slug: String(body.slug || slugify(name)),
    category: String(body.category || "Coast").trim(),
    barangay: String(body.barangay || "").trim() || null,
    description: String(body.description || "").trim(),
    cover_url: String(body.cover_url || "").trim() || null,
    featured: Boolean(body.featured)
  };
  if (row.description.length < 12) return NextResponse.json({ error: "Write a short description." }, { status: 400 });
  const { data, error } = await supabaseAdmin().from("spots").insert(row).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(req: Request) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const id = String(body.id || "");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const patch: Record<string, unknown> = {};
  for (const key of ["name", "slug", "category", "barangay", "description", "cover_url", "featured"]) {
    if (key in body) patch[key] = body[key];
  }
  const { data, error } = await supabaseAdmin().from("spots").update(patch).eq("id", id).select("*").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(req: Request) {
  if (!isAdminRequest()) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const { error } = await supabaseAdmin().from("spots").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
