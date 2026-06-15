"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function DeleteAnuncioButton({
  anuncioId,
  titulo,
}: {
  anuncioId: string;
  titulo: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [confirming, setConfirming] = useState(false);

  async function handleDelete() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/anuncios/${anuncioId}`, {
        method: "DELETE",
      });
      if (!res.ok) return;
      router.refresh();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  if (confirming) {
    return (
      <div className="flex gap-2 flex-wrap">
        <span className="text-xs text-red-600 self-center">Excluir &quot;{titulo}&quot;?</span>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          {loading ? "..." : "Confirmar"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="text-xs font-medium px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
    >
      Excluir
    </button>
  );
}
