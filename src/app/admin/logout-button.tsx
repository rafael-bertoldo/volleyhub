"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    setLoading(true);
    try {
      await fetch("/api/admin/logout", { method: "POST" });
      router.push("/admin/login");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="w-full text-sm font-medium px-3 py-2 rounded-lg bg-violet-700 text-violet-100 hover:bg-violet-600 disabled:opacity-50 transition-colors"
    >
      {loading ? "Saindo..." : "Sair"}
    </button>
  );
}
