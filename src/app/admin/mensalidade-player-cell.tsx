"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  MEMBERSHIP_FEE_STATUS_BADGE,
  MEMBERSHIP_FEE_STATUS_LABEL,
  formatMembershipFeeMonth,
  getCurrentMembershipFeeMonth,
  getMembershipFeeStatusPlayer,
} from "@/lib/mensalidade";
import type { Player } from "@/lib/types";

export function MensalidadePlayerCell({ player }: { player: Player }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const status = getMembershipFeeStatusPlayer(player);

  if (status === "nao_aplica") {
    return <span className="text-xs text-gray-400">—</span>;
  }

  const mesAtual = getCurrentMembershipFeeMonth().slice(0, 7);
  const jaPagoMesAtual = player.membership_fee_month?.slice(0, 7) === mesAtual;

  async function handleRegistrar() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/players/${player.id}/membership-fee`, {
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
        className={`inline-flex w-fit text-xs font-medium px-2 py-0.5 rounded-full ${MEMBERSHIP_FEE_STATUS_BADGE[status]}`}
      >
        {MEMBERSHIP_FEE_STATUS_LABEL[status]}
      </span>
      {player.membership_fee_month && (
        <span className="text-xs text-gray-500">
          Ref. {formatMembershipFeeMonth(player.membership_fee_month)}
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
