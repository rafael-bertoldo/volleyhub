"use client";

import { useCallback, useEffect, useState } from "react";
import { formatPlayerName } from "@/lib/players";
import { ATTENDANCE_STATUS_LABEL } from "@/lib/treinos";
import type { TrainingParticipant } from "@/lib/treinos-server";

interface ParticipantesListaProps {
  eventId: string;
  playerIdAtual?: string;
  initialParticipantes?: TrainingParticipant[];
  modo?: "player" | "admin";
  attendanceVersion?: number;
  onAdminAction?: (
    attendanceId: string,
    action: "confirmar_pagamento" | "rejeitar_pagamento" | "subir_fila",
  ) => Promise<void>;
}

export function ParticipantesLista({
  eventId,
  playerIdAtual,
  initialParticipantes,
  modo = "player",
  attendanceVersion = 0,
  onAdminAction,
}: ParticipantesListaProps) {
  const [participantesRemotos, setParticipantesRemotos] = useState<TrainingParticipant[]>([]);
  const [loading, setLoading] = useState(!initialParticipantes);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const participantes = initialParticipantes ?? participantesRemotos;

  const carregar = useCallback(async () => {
    if (modo !== "player") return;

    setLoading(true);
    try {
      const res = await fetch(`/api/trainings/${eventId}/participants`);
      if (res.ok) {
        const date = await res.json();
        setParticipantesRemotos(date.participantes ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [eventId, modo]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      void carregar();
    }, 0);

    return () => window.clearTimeout(timeout);
  }, [carregar, attendanceVersion]);

  const confirmados = participantes.filter((p) => p.status === "confirmed");
  const reservados = participantes.filter((p) => p.status === "reserved");
  const aguardando = participantes.filter(
    (p) => p.status === "pending_payment",
  );
  const fila = participantes.filter((p) => p.status === "waitlist");

  async function handleAdminAction(
    attendanceId: string,
    action: "confirmar_pagamento" | "rejeitar_pagamento" | "subir_fila",
  ) {
    if (!onAdminAction) return;
    setActionLoading(`${attendanceId}:${action}`);
    try {
      await onAdminAction(attendanceId, action);
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
          playerIdAtual={playerIdAtual}
          variant="confirmed"
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
            playerIdAtual={playerIdAtual}
            variant="reserved"
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
                key={p.attendance_id}
                className="flex flex-wrap items-center justify-between gap-2 text-sm"
              >
                <span>
                  {formatPlayerName(p)}{" "}
                  <span className="text-xs text-gray-500">({p.membership_type})</span>
                </span>
                <div className="flex gap-1.5">
                  <AdminBtn
                    label="Confirmar"
                    variant="primary"
                    loading={actionLoading === `${p.attendance_id}:confirmar_pagamento`}
                    onClick={() =>
                      handleAdminAction(p.attendance_id, "confirmar_pagamento")
                    }
                  />
                  <AdminBtn
                    label="Rejeitar"
                    variant="secondary"
                    loading={actionLoading === `${p.attendance_id}:rejeitar_pagamento`}
                    onClick={() =>
                      handleAdminAction(p.attendance_id, "rejeitar_pagamento")
                    }
                  />
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {modo === "player" && aguardando.length > 0 && (
        <section>
          <p className="text-xs font-medium text-orange-700 mb-1.5">
            Aguardando confirmação ({aguardando.length})
          </p>
          <ListaNomes
            items={aguardando}
            playerIdAtual={playerIdAtual}
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
                  key={p.attendance_id}
                  className="flex flex-wrap items-center justify-between gap-2 text-sm"
                >
                  <span>
                    {p.waitlist_position}º — {formatPlayerName(p)}{" "}
                    <span className="text-xs text-gray-500">({p.membership_type})</span>
                  </span>
                  <AdminBtn
                    label="Subir"
                    variant="primary"
                    loading={actionLoading === `${p.attendance_id}:subir_fila`}
                    onClick={() => handleAdminAction(p.attendance_id, "subir_fila")}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <ListaNomes
              items={fila}
              playerIdAtual={playerIdAtual}
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
  playerIdAtual,
  variant,
}: {
  items: TrainingParticipant[];
  playerIdAtual?: string;
  variant: "confirmed" | "reserved" | "aguardando" | "fila";
}) {
  const dot =
    variant === "confirmed"
      ? "bg-green-500"
      : variant === "reserved"
        ? "bg-blue-300"
        : variant === "fila"
          ? "bg-amber-400"
          : "bg-orange-400";

  return (
    <ul className="space-y-1">
      {items.map((p) => (
        <li
          key={p.attendance_id}
          className={`flex items-center gap-2 text-sm ${
            p.player_id === playerIdAtual ? "font-semibold text-violet-800" : "text-gray-800"
          }`}
        >
          <span className={`size-2 rounded-full shrink-0 ${dot}`} />
          <span>
            {formatPlayerName(p)}
            {p.player_id === playerIdAtual && (
              <span className="text-xs font-normal text-violet-600"> (você)</span>
            )}
          </span>
          <span className="text-xs text-gray-400 ml-auto">{p.membership_type}</span>
          {variant === "fila" && p.waitlist_position && (
            <span className="text-xs text-amber-600">{p.waitlist_position}º</span>
          )}
          {variant === "reserved" && (
            <span className="text-xs text-gray-400">
              {ATTENDANCE_STATUS_LABEL.reserved}
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
