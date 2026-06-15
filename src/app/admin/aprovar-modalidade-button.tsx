"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

interface AprovarModalidadeButtonProps {
  atletaId: string;
  nome: string;
}

export function AprovarModalidadeButton({
  atletaId,
  nome,
}: AprovarModalidadeButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"aprovar" | "recusar" | null>(null);

  async function handleAction(action: "aprovar" | "recusar") {
    setLoading(action);
    try {
      await fetch("/api/admin/modalidade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atleta_id: atletaId, action }),
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
        title={`Recusar modalidade de ${nome}`}
      >
        {loading === "recusar" ? "..." : "Recusar"}
      </button>
    </div>
  );
}
