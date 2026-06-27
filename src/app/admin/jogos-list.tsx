"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useJogosConvocacoesRealtime } from "@/hooks/use-attendances-realtime";
import {
  CONVOCACAO_STATUS_BADGE,
  CONVOCACAO_STATUS_LABEL,
  EVENT_STATUS_BADGE,
  EVENT_STATUS_LABEL,
  formatJogoTitulo,
} from "@/lib/jogos";
import { formatPlayerName } from "@/lib/players";
import { formatTrainingDate, formatTime } from "@/lib/treinos";
import type { EligiblePlayer, CallUpWithPlayer, GameWithCallUps } from "@/lib/types";
import { JogoForm } from "./jogo-form";

export function JogosList({ jogos }: { jogos: GameWithCallUps[] }) {
  const router = useRouter();
  const [callingUpId, setConvocandoId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmingAction, setConfirmingAction] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const onCallUpUpdate = useCallback(() => {
    router.refresh();
  }, [router]);

  useJogosConvocacoesRealtime(
    jogos.map((j) => j.id),
    onCallUpUpdate,
  );

  async function handleCancel(eventId: string) {
    setActionLoading(`cancel:${eventId}`);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/games/${eventId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setActionError(data?.error ?? "Erro ao cancelar evento.");
        return;
      }
      setConfirmingAction(null);
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete(eventId: string) {
    setActionLoading(`delete:${eventId}`);
    setActionError(null);
    try {
      const res = await fetch(`/api/admin/games/${eventId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        setActionError(data?.error ?? "Erro ao excluir evento.");
        return;
      }
      setConfirmingAction(null);
      router.refresh();
    } finally {
      setActionLoading(null);
    }
  }

  if (!jogos.length) {
    return <p className="text-sm text-gray-500">Nenhum jogo ou amistoso agendado.</p>;
  }

  return (
    <div className="space-y-4">
      {jogos.map((jogo) => (
        <article key={jogo.id} className="rounded-xl border border-gray-100 p-4 space-y-3">
          {editingId === jogo.id ? (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-900">Remarcar evento</h3>
              <JogoForm
                event={jogo}
                onDone={() => setEditingId(null)}
                onCancel={() => setEditingId(null)}
              />
            </div>
          ) : (
            <>
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">{formatJogoTitulo(jogo)}</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {formatTrainingDate(jogo.date)} · {formatTime(jogo.start_time)} –{" "}
                {formatTime(jogo.end_time)}
                {jogo.location ? ` · ${jogo.location}` : ""}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full ${EVENT_STATUS_BADGE[jogo.status]}`}
              >
                {EVENT_STATUS_LABEL[jogo.status]}
              </span>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                {jogo.capacity} vagas
              </span>
            </div>
          </div>

          {jogo.notes && (
            <p className="text-sm text-gray-600">{jogo.notes}</p>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            <StatPill label="Convocados" value={jogo.stats.total} />
            <StatPill label="Pendentes" value={jogo.stats.pending} color="amber" />
            <StatPill label="Aceitos" value={jogo.stats.accepted} color="green" />
            <StatPill label="Recusados" value={jogo.stats.declined} color="red" />
          </div>

          {jogo.call_ups.length > 0 && (
            <ul className="text-sm space-y-1 border-t border-gray-50 pt-3">
              {jogo.call_ups.map((c) => (
                <ConvocadoRow
                  key={c.id}
                  convocacao={c}
                  onRemoved={onCallUpUpdate}
                />
              ))}
            </ul>
          )}

          <div className="pt-2 border-t border-gray-50 flex flex-wrap gap-2">
            {jogo.status !== "canceled" && callingUpId === jogo.id ? (
              <ConvocarPanel
                eventId={jogo.id}
                capacity={jogo.capacity}
                onClose={() => setConvocandoId(null)}
              />
            ) : (
              <>
                {jogo.status !== "canceled" && (
                  <button
                    type="button"
                    onClick={() => setConvocandoId(jogo.id)}
                    className="text-sm font-medium px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700"
                  >
                    Convocar atletas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setEditingId(jogo.id)}
                  className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
                >
                  Remarcar
                </button>
                {jogo.status !== "canceled" && (
                  confirmingAction === `cancel:${jogo.id}` ? (
                    <InlineConfirm
                      message="Cancelar este evento?"
                      confirmLabel={
                        actionLoading === `cancel:${jogo.id}` ? "Cancelando..." : "Confirmar"
                      }
                      disabled={actionLoading === `cancel:${jogo.id}`}
                      onConfirm={() => handleCancel(jogo.id)}
                      onCancel={() => setConfirmingAction(null)}
                      tone="amber"
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setActionError(null);
                        setConfirmingAction(`cancel:${jogo.id}`);
                      }}
                      className="text-sm font-medium px-4 py-2 rounded-lg border border-amber-200 text-amber-800 hover:bg-amber-50"
                    >
                      Cancelar evento
                    </button>
                  )
                )}
                {confirmingAction === `delete:${jogo.id}` ? (
                  <InlineConfirm
                    message="Excluir evento e convocações?"
                    confirmLabel={
                      actionLoading === `delete:${jogo.id}` ? "Excluindo..." : "Confirmar"
                    }
                    disabled={actionLoading === `delete:${jogo.id}`}
                    onConfirm={() => handleDelete(jogo.id)}
                    onCancel={() => setConfirmingAction(null)}
                    tone="red"
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setActionError(null);
                      setConfirmingAction(`delete:${jogo.id}`);
                    }}
                    className="text-sm font-medium px-4 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50"
                  >
                    Excluir
                  </button>
                )}
              </>
            )}
          </div>
          {actionError && <p className="text-sm text-red-600">{actionError}</p>}
            </>
          )}
        </article>
      ))}
    </div>
  );
}

function InlineConfirm({
  message,
  confirmLabel,
  disabled,
  onConfirm,
  onCancel,
  tone,
}: {
  message: string;
  confirmLabel: string;
  disabled: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tone: "amber" | "red";
}) {
  const confirmClass =
    tone === "red"
      ? "bg-red-600 text-white hover:bg-red-700"
      : "bg-amber-500 text-white hover:bg-amber-600";

  return (
    <div className="flex w-full flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2 sm:w-auto sm:flex-row sm:items-center">
      <span className="text-sm text-gray-700">{message}</span>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={disabled}
          className={`text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-50 ${confirmClass}`}
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={disabled}
          className="text-sm font-medium px-3 py-2 rounded-lg bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Não
        </button>
      </div>
    </div>
  );
}

function ConvocadoRow({
  convocacao,
  onRemoved,
}: {
  convocacao: CallUpWithPlayer;
  onRemoved: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/games/call-ups/${convocacao.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        onRemoved();
      }
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }

  return (
    <li className="flex items-center justify-between gap-2 py-1">
      <span className="min-w-0">
        {formatPlayerName(convocacao.player)}{" "}
        <span className="text-xs text-gray-400">({convocacao.player.membership_type})</span>
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <span
          className={`text-xs px-2 py-0.5 rounded-full ${CONVOCACAO_STATUS_BADGE[convocacao.status]}`}
        >
          {CONVOCACAO_STATUS_LABEL[convocacao.status]}
        </span>
        {confirming ? (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleRemove}
              disabled={loading}
              className="text-xs font-medium px-2 py-1 rounded-md bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "..." : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => setConfirming(false)}
              disabled={loading}
              className="text-xs font-medium px-2 py-1 rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50"
            >
              Não
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="text-xs font-medium px-2 py-1 rounded-md text-red-600 hover:bg-red-50"
            title="Remover da convocação"
          >
            Remover
          </button>
        )}
      </div>
    </li>
  );
}

function ConvocarPanel({
  eventId,
  capacity,
  onClose,
}: {
  eventId: string;
  capacity: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [members, setMensalistas] = useState<EligiblePlayer[]>([]);
  const [dropIns, setAvulsos] = useState<EligiblePlayer[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    const timeout = window.setTimeout(() => {
      setLoading(true);
      fetch(`/api/admin/games/${eventId}/eligible`)
        .then((r) => r.json())
        .then((date) => {
          if (cancelled) return;
          setMensalistas(date.members ?? []);
          setAvulsos(date.dropIns ?? []);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [eventId]);

  const disponiveisMembers = members.filter((a) => !a.already_called_up);
  const disponiveisAvulsos = dropIns.filter((a) => !a.already_called_up);
  const vagasParaAvulsos = Math.max(0, capacity - members.length);
  const podeConvocarAvulsos = members.length < capacity;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= capacity) return prev;
        const isAvulso = dropIns.some((a) => a.id === id);
        if (isAvulso) {
          if (!podeConvocarAvulsos) return prev;
          const dropInsNoSet = [...next].filter((x) => dropIns.some((a) => a.id === x)).length;
          if (dropInsNoSet >= vagasParaAvulsos) return prev;
        }
        next.add(id);
      }
      return next;
    });
  }

  function selectAllMensalistas() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const m of disponiveisMembers) {
        if (next.size >= capacity) break;
        next.add(m.id);
      }
      return next;
    });
  }

  async function handleConvocar() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/games/${eventId}/call-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ player_ids: [...selected] }),
      });
      const date = await res.json();
      if (!res.ok) {
        setError(date.error ?? "Erro ao convocar.");
        return;
      }
      router.refresh();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-gray-500">Carregando atletas...</p>
        <button
          type="button"
          onClick={onClose}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-700">
        Selecionados: <strong>{selected.size}</strong>/{capacity}
        {podeConvocarAvulsos && (
          <span className="text-gray-500"> · até {vagasParaAvulsos} avulso(s)</span>
        )}
      </p>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">
            Mensalistas ({disponiveisMembers.length} disponíveis)
          </h4>
          <button
            type="button"
            onClick={selectAllMensalistas}
            className="text-xs text-violet-600 hover:text-violet-800"
          >
            Selecionar todos
          </button>
        </div>
        <PlayerCheckList
          players={disponiveisMembers}
          selected={selected}
          onToggle={toggle}
        />
      </section>

      <section>
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Avulsos ({disponiveisAvulsos.length} disponíveis)
          {!podeConvocarAvulsos && (
            <span className="text-xs font-normal text-amber-700 ml-2">
              — vagas preenchidas por mensalistas
            </span>
          )}
        </h4>
        <PlayerCheckList
          players={disponiveisAvulsos}
          selected={selected}
          onToggle={toggle}
          disabled={!podeConvocarAvulsos}
        />
      </section>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="text-sm font-medium px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          type="button"
          onClick={handleConvocar}
          disabled={submitting || selected.size === 0}
          className="text-sm font-medium px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50"
        >
          {submitting ? "Convocando..." : `Convocar ${selected.size} atleta(s)`}
        </button>
      </div>
    </div>
  );
}

function PlayerCheckList({
  players,
  selected,
  onToggle,
  disabled,
}: {
  players: EligiblePlayer[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  disabled?: boolean;
}) {
  if (!players.length) {
    return <p className="text-xs text-gray-500">Nenhum atleta disponível.</p>;
  }

  return (
    <ul className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-2">
      {players.map((a) => (
        <li key={a.id}>
          <label
            className={`flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg cursor-pointer hover:bg-gray-50 ${
              disabled ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <input
              type="checkbox"
              checked={selected.has(a.id)}
              disabled={disabled}
              onChange={() => onToggle(a.id)}
              className="rounded border-gray-300 text-violet-600"
            />
            <span>{formatPlayerName(a)}</span>
            <span className="text-xs text-gray-400 ml-auto">{a.membership_type}</span>
          </label>
        </li>
      ))}
    </ul>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "amber" | "green" | "red";
}) {
  const colors = {
    default: "bg-gray-100 text-gray-700",
    amber: "bg-amber-50 text-amber-800",
    green: "bg-green-50 text-green-800",
    red: "bg-red-50 text-red-800",
  };
  const c = color ? colors[color] : colors.default;

  return (
    <span className={`px-2.5 py-1 rounded-full font-medium ${c}`}>
      {label}: {value}
    </span>
  );
}
