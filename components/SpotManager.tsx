"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Spot } from "@/lib/types";

const empty = { name: "", category: "Coast", barangay: "", description: "", cover_url: "", featured: false };

export function SpotManager({ initial }: { initial: Spot[] }) {
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const router = useRouter();

  async function uploadFile(file: File) {
    setUploading(true);
    setError("");
    const body = new FormData();
    body.append("file", file);
    const res = await fetch("/api/admin/upload", { method: "POST", body });
    const json = await res.json();
    setUploading(false);
    if (!res.ok) {
      setError(json.error || "Upload failed.");
      return;
    }
    setForm((f) => ({ ...f, cover_url: json.url }));
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const payload = editId ? { id: editId, ...form } : form;
    const res = await fetch("/api/admin/spots", {
      method: editId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not save.");
      return;
    }
    setForm(empty);
    setEditId(null);
    router.refresh();
  }

  function startEdit(s: Spot) {
    setEditId(s.id);
    setForm({
      name: s.name,
      category: s.category,
      barangay: s.barangay || "",
      description: s.description,
      cover_url: s.cover_url || "",
      featured: s.featured
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function remove(id: string) {
    if (!confirm("Remove this spot and its reviews?")) return;
    await fetch(`/api/admin/spots?id=${id}`, { method: "DELETE" });
    if (editId === id) {
      setEditId(null);
      setForm(empty);
    }
    router.refresh();
  }

  async function toggleFeatured(s: Spot) {
    await fetch("/api/admin/spots", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: s.id, featured: !s.featured })
    });
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
      <form onSubmit={save} className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl">{editId ? "Edit spot" : "Insert spot"}</h2>
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
        <Field label="Barangay / area" value={form.barangay} onChange={(v) => setForm({ ...form, barangay: v })} />
        <label className="mt-4 block text-xs uppercase tracking-[0.16em] text-sand/45">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="mt-2 w-full rounded-2xl border border-white/10 bg-ink/40 px-4 py-3 text-sm outline-none" />
        <label className="mt-4 block text-xs uppercase tracking-[0.16em] text-sand/45">Cover photo</label>
        <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-2 block w-full text-sm text-sand/70 file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-4 file:py-2 file:font-semibold file:text-ink" onChange={(e) => { const file = e.target.files?.[0]; if (file) void uploadFile(file); }} />
        {uploading && <p className="mt-2 text-xs text-gold">Uploading…</p>}
        {form.cover_url && <div className="mt-3 h-32 overflow-hidden rounded-2xl bg-cover bg-center" style={{ backgroundImage: `url(${form.cover_url})` }} />}
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured on home
        </label>
        {error && <p className="mt-3 text-sm text-coral">{error}</p>}
        <div className="mt-5 flex gap-2">
          <button disabled={busy || uploading} className="flex-1 rounded-full bg-gold py-3 font-semibold text-ink">{busy ? "Saving…" : editId ? "Save changes" : "Add tourism spot"}</button>
          {editId && <button type="button" onClick={() => { setEditId(null); setForm(empty); }} className="rounded-full border border-white/15 px-4 py-3 text-sm">Cancel</button>}
        </div>
      </form>
      <div className="space-y-3">
        {initial.map((s) => (
          <article key={s.id} className="glass rounded-2xl p-5">
            {s.cover_url && <div className="mb-3 h-28 overflow-hidden rounded-xl bg-cover bg-center" style={{ backgroundImage: `url(${s.cover_url})` }} />}
            <p className="text-xs uppercase tracking-[0.16em] text-gold/70">{s.category}{s.featured ? " · featured" : ""}</p>
            <h3 className="font-display text-2xl">{s.name}</h3>
            <p className="mt-1 text-sm text-sand/55">{s.description}</p>
            <div className="mt-4 flex flex-wrap gap-2 text-sm">
              <button type="button" onClick={() => startEdit(s)} className="rounded-full border border-white/10 px-3 py-1">Edit</button>
              <button type="button" onClick={() => toggleFeatured(s)} className="rounded-full border border-white/10 px-3 py-1">{s.featured ? "Unfeature" : "Feature"}</button>
              <button type="button" onClick={() => remove(s.id)} className="rounded-full px-3 py-1 text-coral">Delete</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="mt-4 block">
      <span className="text-xs uppercase tracking-[0.16em] text-sand/45">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-ink/40 px-4 py-3 text-sm outline-none" />
    </label>
  );
}
