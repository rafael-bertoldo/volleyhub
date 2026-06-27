"use client";

import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="w-full rounded-lg bg-violet-700 px-3 py-2 text-sm font-medium text-white hover:bg-violet-600 transition-colors"
    >
      Sair
    </button>
  );
}
