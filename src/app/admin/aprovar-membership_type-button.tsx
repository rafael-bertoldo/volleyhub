"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface AprovarMembershipTypeButtonProps {
  playerId: string;
  name: string;
}

export function AprovarMembershipTypeButton({
  playerId,
  name,
}: AprovarMembershipTypeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"aprovar" | "recusar" | null>(null);

  async function handleAction(action: "aprovar" | "recusar") {
    setLoading(action);
    try {
      await fetch("/api/admin/membership-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_id: playerId, action }),
      });
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="flex gap-2 shrink-0">
      <button
        onClick={() => handleAction("aprovar")}
        disabled={loading !== null}
        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {loading === "aprovar" ? "..." : "Aprovar"}
      </button>
      <button
        onClick={() => handleAction("recusar")}
        disabled={loading !== null}
        className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50 transition-colors"
        title={`Recusar modalidade de ${name}`}
      >
        {loading === "recusar" ? "..." : "Recusar"}
      </button>
    </div>
  );
}
