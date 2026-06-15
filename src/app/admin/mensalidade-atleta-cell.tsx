"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  MENSALIDADE_STATUS_BADGE,
  MENSALIDADE_STATUS_LABEL,
  formatMensalidadeMes,
  getMensalidadeMesAtual,
  getMensalidadeStatusAtleta,
} from "@/lib/mensalidade";
import type { Atleta } from "@/lib/types";

export function MensalidadeAtletaCell({ atleta }: { atleta: Atleta }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const status = getMensalidadeStatusAtleta(atleta);

  if (status === "nao_aplica") {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const mesAtual = getMensalidadeMesAtual().slice(0, 7);
  const jaPagoMesAtual = atleta.mensalidade_mes?.slice(0, 7) === mesAtual;

  async function handleRegistrar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/atletas/${atleta.id}/mensalidade`, {
        method: "POST",
      });
      if (res.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[9rem]">
      <span
        className={`inline-flex w-fit text-xs font-medium px-2 py-0.5 rounded-full ${MENSALIDADE_STATUS_BADGE[status]}`}
      >
        {MENSALIDADE_STATUS_LABEL[status]}
      </span>
      {atleta.mensalidade_mes && (
        <span className="text-xs text-gray-500">
          Ref. {formatMensalidadeMes(atleta.mensalidade_mes)}
        </span>
      )}
      <button
        type="button"
        onClick={handleRegistrar}
        disabled={loading || jaPagoMesAtual}
        className="text-xs font-medium px-2.5 py-1.5 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed w-fit"
        title="Registra pagamento da mensalidade do mês atual"
      >
        {loading ? "Salvando..." : jaPagoMesAtual ? "Pago este mês" : "Registrar pagamento"}
      </button>
    </div>
  );
}
