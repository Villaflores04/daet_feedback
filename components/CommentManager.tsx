"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Feedback } from "@/lib/types";

export function CommentManager({ initial }: { initial: Feedback[] }) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [sentiment, setSentiment] = useState("all");
  const router = useRouter();

  const filtered = useMemo(() => {
    return rows.filter((f) => {
      if (sentiment !== "all" && f.sentiment !== sentiment) return false;
      if (!q.trim()) return true;
      const hay = `${f.display_name} ${f.comment} ${f.spots?.name || ""}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [rows, q, sentiment]);

  async function save(id: string) {
    const comment = editing[id];
    if (!comment) return;
    await fetch("/api/admin/comments", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, comment })
    });
    setRows((r) => r.map((x) => (x.id === id ? { ...x, comment } : x)));
    setEditing((e) => {
      const n = { ...e };
      delete n[id];
      return n;
    });
    router.refresh();
  }

  async function remove(id: string) {
    if (!confirm("Delete this comment?")) return;
    await fetch(`/api/admin/comments?id=${id}`, { method: "DELETE" });
    setRows((r) => r.filter((x) => x.id !== id));
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, spot, or words"
          className="min-w-[220px] flex-1 rounded-full border border-white/10 bg-ink/40 px-4 py-2 text-sm outline-none"
        />
        <select
          value={sentiment}
          onChange={(e) => setSentiment(e.target.value)}
          className="rounded-full border border-white/10 bg-ink/40 px-4 py-2 text-sm"
        >
          <option value="all">All moods</option>
          <option value="positive">Positive</option>
          <option value="mixed">Mixed</option>
          <option value="negative">Negative</option>
        </select>
      </div>
      {filtered.length === 0 && <p className="text-sand/50">No comments match.</p>}
      {filtered.map((f) => (
        <article key={f.id} className="glass rounded-2xl p-5">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm">
              <span className="text-gold">{f.display_name}</span>
              <span className="text-sand/40"> · {f.spots?.name}</span>
              <span className="text-sand/40">
                {" "}
                · {f.rating}/5 {f.emoji}
              </span>
            </p>
            <button type="button" onClick={() => remove(f.id)} className="text-sm text-coral">
              Delete
            </button>
          </div>
          {editing[f.id] !== undefined ? (
            <div className="mt-3">
              <textarea
                value={editing[f.id]}
                onChange={(e) => setEditing({ ...editing, [f.id]: e.target.value })}
                rows={3}
                className="w-full rounded-2xl border border-white/10 bg-ink/40 px-3 py-2 text-sm"
              />
              <button type="button" onClick={() => save(f.id)} className="mt-2 rounded-full bg-gold px-4 py-1 text-sm font-semibold text-ink">
                Save
              </button>
            </div>
          ) : (
            <p className="mt-2 cursor-pointer text-sand/80" onClick={() => setEditing({ ...editing, [f.id]: f.comment })} title="Click to edit">
              {f.comment}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
