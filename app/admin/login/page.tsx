"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const json = await res.json();
    setBusy(false);
    if (!res.ok) {
      setError(json.error || "Could not sign in.");
      return;
    }
    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-md">
      <p className="text-xs uppercase tracking-[0.22em] text-gold">Restricted</p>
      <h1 className="mt-2 font-display text-5xl">Tourism desk</h1>
      <p className="mt-3 text-sand/60">
        Officers only. Visitors never see a login. Set{" "}
        <code className="text-gold">ADMIN_PASSWORD</code> on the server.
      </p>
      <form onSubmit={submit} className="glass mt-8 rounded-3xl p-6">
        <label className="text-xs uppercase tracking-[0.16em] text-sand/45">Desk password</label>
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-2xl border border-white/10 bg-ink/50 px-4 py-3 outline-none focus:ring-2 focus:ring-gold/40" />
        {error && <p className="mt-3 text-sm text-coral">{error}</p>}
        <button disabled={busy} className="mt-5 w-full rounded-full bg-gold py-3 font-semibold text-ink">{busy ? "Checking..." : "Enter desk"}</button>
      </form>
    </div>
  );
}
