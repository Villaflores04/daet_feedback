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
    <div className="mx-auto max-w-sm">
      <p className="eyebrow">Officer desk</p>
      <h1 className="mt-1">Sign in</h1>
      <p className="mt-1.5 text-[13px] text-ink-soft">Officers only. Visitors never see a login.</p>
      <form onSubmit={submit} className="card mt-4 p-4">
        <label className="lbl">Desk password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 text-sm outline-none"
        />
        {error && <p className="mt-2 text-sm text-coral">{error}</p>}
        <button disabled={busy} className="btn-gold mt-3 w-full min-h-9">
          {busy ? "Checking…" : "Enter desk"}
        </button>
      </form>
    </div>
  );
}
