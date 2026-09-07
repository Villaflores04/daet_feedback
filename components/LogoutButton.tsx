"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  return (
    <button
      onClick={async () => {
        await fetch("/api/admin/logout", { method: "POST" });
        router.push("/admin/login");
        router.refresh();
      }}
      className="rounded-full px-3 py-1.5 text-sm text-ink-soft hover:text-ink"
    >
      Sign out
    </button>
  );
}
