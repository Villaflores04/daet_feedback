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
    <div className="grid gap-3 lg:grid-cols-[.92fr_1.08fr]">
      <form onSubmit={save} className="card h-fit p-3.5">
        <h2>{editId ? "Edit place" : "Insert place"}</h2>
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <label className="lbl">Category</label>
        <select
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="w-full px-3 py-2 text-sm outline-none"
        >
          {["Coast", "Heritage", "Island", "Civic", "Park"].map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <Field label="Barangay / area" value={form.barangay} onChange={(v) => setForm({ ...form, barangay: v })} />
        <label className="lbl">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 text-sm outline-none"
        />
        <label className="lbl">Cover photo</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-1 block w-full text-xs text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-gold file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-white"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void uploadFile(file);
          }}
        />
        {uploading && <p className="mt-2 text-xs text-gold">Uploading…</p>}
        {form.cover_url && (
          <div className="mt-2 h-20 overflow-hidden rounded-[10px] bg-cover bg-center" style={{ backgroundImage: `url(${form.cover_url})` }} />
        )}
        <label className="mt-3 flex items-center gap-2 text-[13px]">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} />
          Featured on home
        </label>
        {error && <p className="mt-2 text-sm text-coral">{error}</p>}
        <div className="mt-3 flex gap-2">
          <button disabled={busy || uploading} className="btn-gold flex-1 min-h-9">
            {busy ? "Saving…" : editId ? "Save changes" : "Add place"}
          </button>
          {editId && (
            <button
              type="button"
              onClick={() => {
                setEditId(null);
                setForm(empty);
              }}
              className="btn-ghost"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      <div className="space-y-2">
        {initial.map((s) => (
          <article key={s.id} className="card flex overflow-hidden">
            {s.cover_url ? (
              <div className="h-[92px] w-[92px] shrink-0 bg-cover bg-center" style={{ backgroundImage: `url(${s.cover_url})` }} />
            ) : (
              <div className="h-[92px] w-[92px] shrink-0 bg-tide-mist" />
            )}
            <div className="min-w-0 flex-1 p-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-tide">
                {s.category}
                {s.featured ? " · featured" : ""}
              </p>
              <h3 className="truncate text-[1.05rem] leading-tight">{s.name}</h3>
              <p className="mt-0.5 line-clamp-1 text-[11px] text-ink-soft">{s.description}</p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                <button type="button" onClick={() => startEdit(s)} className="btn-ghost">
                  Edit
                </button>
                <button type="button" onClick={() => toggleFeatured(s)} className="btn-ghost">
                  {s.featured ? "Unfeature" : "Feature"}
                </button>
                <button type="button" onClick={() => remove(s.id)} className="btn-ghost text-coral">
                  Delete
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="lbl">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm outline-none"
      />
    </label>
  );
}
