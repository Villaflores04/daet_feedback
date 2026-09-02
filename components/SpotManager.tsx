"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Spot } from "@/lib/types";

const empty = { name: "", category: "Coast", barangay: "", description: "", cover_url: "", featured: false };

export function SpotManager({ initial }: { initial: Spot[] }) {
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true); setError("");
    const res = await fetch("/api/admin/spots", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) { setError(json.error || "Could not save."); return; }
    setForm(empty); router.refresh();
  }
  async function remove(id: string) {
    if (!confirm("Remove this spot and its reviews?")) return;
    await fetch(`/api/admin/spots?id=${id}`, { method: "DELETE" });
    router.refresh();
  }
  async function toggleFeatured(s: Spot) {
    await fetch("/api/admin/spots", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, featured: !s.featured }) });
    router.refresh();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
      <form onSubmit={create} className="glass rounded-3xl p-6">
        <h2 className="font-display text-2xl">Insert spot</h2>
        <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
        <Field label="Category" value={form.category} onChange={(v) => setForm({ ...form, category: v })} />
        <Field label="Barangay / area" value={form.barangay} onChange={(v) => setForm({ ...form, barangay: v })} />
        <label className="mt-4 block text-xs uppercase tracking-[0.16em] text-sand/45">Description</label>
        <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} className="mt-2 w-full rounded-2xl border border-white/10 bg-ink/40 px-4 py-3 text-sm outline-none" />
        <Field label="Cover image URL" value={form.cover_url} onChange={(v) => setForm({ ...form, cover_url: v })} />
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Featured on home
        </label>
        {error && <p className="mt-3 text-sm text-coral">{error}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-full bg-gold py-3 font-semibold text-ink">{busy ? "Saving…" : "Add tourism spot"}</button>
      </form>
      <div className="space-y-3">
        {initial.map((s) => (
          <article key={s.id} className="glass rounded-2xl p-5">
            <p className="text-xs uppercase tracking-[0.16em] text-gold/70">{s.category}{s.featured ? " · featured" : ""}</p>
            <h3 className="font-display text-2xl">{s.name}</h3>
            <p className="mt-1 text-sm text-sand/55">{s.description}</p>
            <div className="mt-4 flex gap-2 text-sm">
              <button onClick={() => toggleFeatured(s)} className="rounded-full border border-white/10 px-3 py-1">{s.featured ? "Unfeature" : "Feature"}</button>
              <button onClick={() => remove(s.id)} className="rounded-full px-3 py-1 text-coral">Delete</button>
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
