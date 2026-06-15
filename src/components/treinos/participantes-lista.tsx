"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { REALTIME_EVENTS } from "@/lib/realtime/channels";
import { STATUS_PRESENCA_LABEL } from "@/lib/treinos";
import type { ParticipanteTreino } from "@/lib/treinos-server";

interface ParticipantesListaProps {
  eventoId: string;
  accessToken?: string;
  atletaIdAtual?: string;
  initialParticipantes?: ParticipanteTreino[];
  modo?: "atleta" | "admin";
  presencaVersion?: number;
  onAdminAction?: (
    presencaId: string,
    action: "confirmar_pagamento" | "rejeitar_pagamento" | "subir_fila",
  ) => Promise<void>;
}

export function ParticipantesLista({
  eventoId,
  accessToken,
  atletaIdAtual,
  initialParticipantes,
  modo = "atleta",
  presencaVersion = 0,
  onAdminAction,
}: ParticipantesListaProps) {
  const [participantes, setParticipantes] = useState<ParticipanteTreino[]>(
    initialParticipantes ?? [],
  );
  const [loading, setLoading] = useState(!initialParticipantes);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    if (modo !== "atleta" || !accessToken) return;

    setLoading(true);
    try {
      const res = await fetch(
        `/api/treinos/${eventoId}/participantes?access_token=${encodeURIComponent(accessToken)}`,
      );
      if (res.ok) {
        const data = await res.json();
        setParticipantes(data.participantes ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [eventoId, accessToken, modo]);

  useEffect(() => {
    if (initialParticipantes) {
      setParticipantes(initialParticipantes);
    }
  }, [initialParticipantes]);

  useEffect(() => {
    carregar();
  }, [carregar, presencaVersion]);

  const confirmados = participantes.filter((p) => p.status === "confirmado");
  const reservados = participantes.filter((p) => p.status === "reservado");
  const aguardando = participantes.filter(
    (p) => p.status === "aguardando_pagamento",
  );
  const fila = participantes.filter((p) => p.status === "fila_espera");

  async function handleAdminAction(
    presencaId: string,
    action: "confirmar_pagamento" | "rejeitar_pagamento" | "subir_fila",
  ) {
    if (!onAdminAction) return;
    setActionLoading(`${presencaId}:${action}`);
    try {
      await onAdminAction(presencaId, action);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading && participantes.length === 0) {
    return <p className="text-xs text-gray-400 mt-3">Carregando lista...</p>;
  }

  if (participantes.length === 0) {
    return (
      <p className="text-xs text-gray-500 mt-3">Ninguém inscrito ainda.</p>
    );
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Quem vai ({confirmados.length} confirmados)
      </p>

      {confirmados.length > 0 ? (
        <ListaNomes
          items={confirmados}
          atletaIdAtual={atletaIdAtual}
          variant="confirmado"
        />
      ) : (
        <p className="text-xs text-gray-500">Nenhuma presença confirmada ainda.</p>
      )}

      {reservados.length > 0 && (
        <section>
          <p className="text-xs font-medium text-gray-500 mb-1.5">
            Reservados (ainda não confirmaram)
          </p>
          <ListaNomes
            items={reservados}
            atletaIdAtual={atletaIdAtual}
            variant="reservado"
          />
        </section>
      )}

      {modo === "admin" && aguardando.length > 0 && (
        <section>
          <p className="text-xs font-medium text-orange-700 mb-1.5">
            Aguardando pagamento ({aguardando.length})
          </p>
          <ul className="space-y-1.5">
            {aguardando.map((p) => (
              <li
                key={p.presenca_id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  {p.nome}{" "}
                  <span className="text-xs text-gray-500">({p.modalidade})</span>
                </span>
                <div className="flex gap-1.5">
                  <AdminBtn
                    label="Confirmar"
                    variant="primary"
                    loading={actionLoading === `${p.presenca_id}:confirmar_pagamento`}
                    onClick={() =>
                      handleAdminAction(p.presenca_id, "confirmar_pagamento")
                    }
                  />
                  <AdminBtn
                    label="Rejeitar"
                    variant="secondary"
                    loading={actionLoading === `${p.presenca_id}:rejeitar_pagamento`}
                    onClick={() =>
                      handleAdminAction(p.presenca_id, "rejeitar_pagamento")
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {modo === "atleta" && aguardando.length > 0 && (
        <section>
          <p className="text-xs font-medium text-orange-700 mb-1.5">
            Aguardando confirmação ({aguardando.length})
          </p>
          <ListaNomes
            items={aguardando}
            atletaIdAtual={atletaIdAtual}
            variant="aguardando"
          />
        </section>
      )}

      {fila.length > 0 && (
        <section>
          <p className="text-xs font-medium text-amber-700 mb-1.5">
            Fila de espera ({fila.length})
          </p>
          {modo === "admin" ? (
            <ul className="space-y-1.5">
              {fila.map((p) => (
                <li
                  key={p.presenca_id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>
                    {p.posicao_fila}º — {p.nome}{" "}
                    <span className="text-xs text-gray-500">({p.modalidade})</span>
                  </span>
                  <AdminBtn
                    label="Subir"
                    variant="primary"
                    loading={actionLoading === `${p.presenca_id}:subir_fila`}
                    onClick={() => handleAdminAction(p.presenca_id, "subir_fila")}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <ListaNomes
              items={fila}
              atletaIdAtual={atletaIdAtual}
              variant="fila"
            />
          )}
        </section>
      )}
    </div>
  );
}

function ListaNomes({
  items,
  atletaIdAtual,
  variant,
}: {
  items: ParticipanteTreino[];
  atletaIdAtual?: string;
  variant: "confirmado" | "reservado" | "aguardando" | "fila";
}) {
  const dot =
    variant === "confirmado"
      ? "bg-green-500"
      : variant === "reservado"
        ? "bg-blue-300"
        : variant === "fila"
          ? "bg-amber-400"
          : "bg-orange-400";

  return (
    <ul className="space-y-1">
      {items.map((p) => (
        <li
          key={p.presenca_id}
          className={`flex items-center gap-2 text-sm ${
            p.atleta_id === atletaIdAtual ? "font-semibold text-violet-800" : "text-gray-800"
          }`}
        >
          <span className={`size-2 rounded-full shrink-0 ${dot}`} />
          <span>
            {p.nome}
            {p.atleta_id === atletaIdAtual && (
              <span className="text-xs font-normal text-violet-600"> (você)</span>
            )}
          </span>
          <span className="text-xs text-gray-400 ml-auto">{p.modalidade}</span>
          {variant === "fila" && p.posicao_fila && (
            <span className="text-xs text-amber-600">{p.posicao_fila}º</span>
          )}
          {variant === "reservado" && (
            <span className="text-xs text-gray-400">
              {STATUS_PRESENCA_LABEL.reservado}
            </span>
          )}
        </li>
      ))}
    </ul>
  );
}

function AdminBtn({
  label,
  variant,
  loading,
  onClick,
}: {
  label: string;
  variant: "primary" | "secondary";
  loading: boolean;
  onClick: () => void;
}) {
  const styles =
    variant === "primary"
      ? "bg-violet-600 text-white hover:bg-violet-700"
      : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`text-xs font-medium px-2.5 py-1 rounded-lg transition-colors disabled:opacity-50 ${styles}`}
    >
      {loading ? "..." : label}
    </button>
  );
}
