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
            className="pnl-btn pnl-btn-ghost pnl-btn-sm w-full"
        >
            <LogOut size={15} strokeWidth={1.75} aria-hidden />
            লগ আউট
        </button>
    );
}
