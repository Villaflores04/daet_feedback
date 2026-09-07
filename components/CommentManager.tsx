"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Feedback, Spot } from "@/lib/types";

export function CommentManager({ initial, spots = [] }: { initial: Feedback[]; spots?: Spot[] }) {
  const [rows, setRows] = useState(initial);
  const [editing, setEditing] = useState<Record<string, string>>({});
  const [q, setQ] = useState("");
  const [spotId, setSpotId] = useState("all");
  const [sentiment, setSentiment] = useState("all");
  const router = useRouter();

  const locations = useMemo(() => {
    const map = new Map<string, { id: string; name: string; count: number }>();
    for (const s of spots) map.set(s.id, { id: s.id, name: s.name, count: 0 });
    for (const f of rows) {
      const id = f.spot_id;
      const name = f.spots?.name || "Unknown spot";
      const cur = map.get(id) || { id, name, count: 0 };
      cur.count += 1;
      cur.name = name;
      map.set(id, cur);
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }, [rows, spots]);

  const filtered = useMemo(() => {
    return rows.filter((f) => {
      if (spotId !== "all" && f.spot_id !== spotId) return false;
      if (sentiment !== "all" && f.sentiment !== sentiment) return false;
      if (!q.trim()) return true;
      const hay = `${f.display_name} ${f.comment} ${f.spots?.name || ""}`.toLowerCase();
      return hay.includes(q.trim().toLowerCase());
    });
  }, [rows, q, sentiment, spotId]);

  const grouped = useMemo(() => {
    const g = new Map<string, { name: string; items: Feedback[] }>();
    for (const f of filtered) {
      const key = f.spot_id || "unknown";
      const name = f.spots?.name || "Unknown spot";
      if (!g.has(key)) g.set(key, { name, items: [] });
      g.get(key)!.items.push(f);
    }
    return [...g.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name));
  }, [filtered]);

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
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => setSpotId("all")}
          className={spotId === "all" ? "btn-gold" : "btn-ghost"}
        >
          All locations · {rows.length}
        </button>
        {locations.map((l) => (
          <button
            key={l.id}
            type="button"
            onClick={() => setSpotId(l.id)}
            className={spotId === l.id ? "btn-gold" : "btn-ghost"}
          >
            {l.name} · {l.count}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name or words"
          className="min-w-[180px] flex-1 px-3 py-2 text-sm outline-none"
        />
        <select value={sentiment} onChange={(e) => setSentiment(e.target.value)} className="px-3 py-2 text-sm">
          <option value="all">All moods</option>
          <option value="positive">Positive</option>
          <option value="mixed">Mixed</option>
          <option value="negative">Negative</option>
        </select>
      </div>

      {filtered.length === 0 && <p className="text-[13px] text-ink-soft">No comments for this location.</p>}

      {grouped.map(([id, group]) => (
        <section key={id} className="space-y-2">
          <div className="flex items-end justify-between gap-3">
            <div>
              <p className="eyebrow">Location</p>
              <h2 className="mt-0.5">{group.name}</h2>
            </div>
            <p className="text-[11px] text-ink-soft">
              {group.items.length} pulse{group.items.length === 1 ? "" : "s"}
            </p>
          </div>
          {group.items.map((f) => (
            <article key={f.id} className="card p-3">
              <div className="flex items-center justify-between gap-3">
                <p className="text-[13px]">
                  <span className="font-medium">{f.display_name}</span>
                  <span className="text-ink-soft">
                    {" "}
                    · {f.rating}/5 {f.emoji} · {f.sentiment}
                  </span>
                </p>
                <button type="button" onClick={() => remove(f.id)} className="btn-ghost text-coral">
                  Delete
                </button>
              </div>
              {editing[f.id] !== undefined ? (
                <div className="mt-2">
                  <textarea
                    value={editing[f.id]}
                    onChange={(e) => setEditing({ ...editing, [f.id]: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 text-sm"
                  />
                  <button type="button" onClick={() => save(f.id)} className="btn-gold mt-2">
                    Save
                  </button>
                </div>
              ) : (
                <p
                  className="mt-1.5 cursor-pointer text-[13px] text-ink-soft"
                  onClick={() => setEditing({ ...editing, [f.id]: f.comment })}
                  title="Click to edit"
                >
                  {f.comment}
                </p>
              )}
            </article>
          ))}
        </section>
      ))}
    </div>
  );
}
