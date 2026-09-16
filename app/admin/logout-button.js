"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export default function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleLogout() {
    if (pending) return;
    setPending(true);
    try {
      await fetch("/api/admin/auth/logout", { method: "POST" });
    } finally {
      router.replace("/admin/login");
      router.refresh();
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={pending}
      className="inline-flex h-10 items-center gap-2 rounded-xs border border-line px-4 text-sm text-ink-soft transition-colors hover:border-ink hover:text-ink disabled:opacity-60"
    >
      <LogOut size={15} strokeWidth={1.75} aria-hidden />
      লগ আউট
    </button>
  );
}
