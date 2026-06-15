"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useJogosConvocacoesRealtime } from "@/hooks/use-presencas-realtime";
import {
  CONVOCACAO_STATUS_BADGE,
  CONVOCACAO_STATUS_LABEL,
  formatJogoTitulo,
} from "@/lib/jogos";
import { formatDataTreino, formatHora } from "@/lib/treinos";
import type { AtletaElegivel, ConvocacaoComAtleta, JogoComConvocacoes } from "@/lib/types";

export function JogosList({ jogos }: { jogos: JogoComConvocacoes[] }) {
  const router = useRouter();
  const [convocandoId, setConvocandoId] = useState<string | null>(null);

  const onConvocacaoUpdate = useCallback(() => {
    router.refresh();
  }, [router]);

  useJogosConvocacoesRealtime(
    jogos.map((j) => j.id),
    onConvocacaoUpdate,
  );

  if (!jogos.length) {
    return <p className="text-sm text-gray-500">Nenhum jogo ou amistoso agendado.</p>;
  }

  return (
    <div className="space-y-4">
      {jogos.map((jogo) => (
        <article key={jogo.id} className="rounded-xl border border-gray-100 p-4 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-semibold text-gray-900">{formatJogoTitulo(jogo)}</p>
              <p className="text-sm text-gray-600 mt-0.5">
                {formatDataTreino(jogo.data)} · {formatHora(jogo.hora_inicio)} –{" "}
                {formatHora(jogo.hora_fim)}
                {jogo.local ? ` · ${jogo.local}` : ""}
              </p>
            </div>
            <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
              {jogo.capacidade} vagas
            </span>
          </div>

          {jogo.observacoes && (
            <p className="text-sm text-gray-600">{jogo.observacoes}</p>
          )}

          <div className="flex flex-wrap gap-2 text-xs">
            <StatPill label="Convocados" value={jogo.stats.total} />
            <StatPill label="Pendentes" value={jogo.stats.pendentes} color="amber" />
            <StatPill label="Aceitos" value={jogo.stats.aceitos} color="green" />
            <StatPill label="Recusados" value={jogo.stats.recusados} color="red" />
          </div>

          {jogo.convocacoes.length > 0 && (
            <ul className="text-sm space-y-1 border-t border-gray-50 pt-3">
              {jogo.convocacoes.map((c) => (
                <ConvocadoRow
                  key={c.id}
                  convocacao={c}
                  onRemoved={onConvocacaoUpdate}
                />
              ))}
            </ul>
          )}

          <div className="pt-2 border-t border-gray-50">
            {convocandoId === jogo.id ? (
              <ConvocarPanel
                eventoId={jogo.id}
                capacidade={jogo.capacidade}
                onClose={() => setConvocandoId(null)}
              />
            ) : (
              <button
                type="button"
                onClick={() => setConvocandoId(jogo.id)}
                className="text-sm font-medium px-4 py-2 rounded-lg bg-violet-600 text-white hover:bg-violet-700"
              >
                Convocar atletas
              </button>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function ConvocadoRow({
  convocacao,
  onRemoved,
}: {
  convocacao: ConvocacaoComAtleta;
  onRemoved: () => void;
}) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleRemove() {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/jogos/convocacoes/${convocacao.id}`, {
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
        {convocacao.atleta.nome}{" "}
        <span className="text-xs text-gray-400">({convocacao.atleta.modalidade})</span>
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
  eventoId,
  capacidade,
  onClose,
}: {
  eventoId: string;
  capacidade: number;
  onClose: () => void;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensalistas, setMensalistas] = useState<AtletaElegivel[]>([]);
  const [avulsos, setAvulsos] = useState<AtletaElegivel[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLoading(true);
    fetch(`/api/admin/jogos/${eventoId}/elegiveis`)
      .then((r) => r.json())
      .then((data) => {
        setMensalistas(data.mensalistas ?? []);
        setAvulsos(data.avulsos ?? []);
      })
      .finally(() => setLoading(false));
  }, [eventoId]);

  const disponiveisMensalistas = mensalistas.filter((a) => !a.ja_convocado);
  const disponiveisAvulsos = avulsos.filter((a) => !a.ja_convocado);
  const vagasParaAvulsos = Math.max(0, capacidade - mensalistas.length);
  const podeConvocarAvulsos = mensalistas.length < capacidade;

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (next.size >= capacidade) return prev;
        const isAvulso = avulsos.some((a) => a.id === id);
        if (isAvulso) {
          if (!podeConvocarAvulsos) return prev;
          const avulsosNoSet = [...next].filter((x) => avulsos.some((a) => a.id === x)).length;
          if (avulsosNoSet >= vagasParaAvulsos) return prev;
        }
        next.add(id);
      }
      return next;
    });
  }

  function selectAllMensalistas() {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const m of disponiveisMensalistas) {
        if (next.size >= capacidade) break;
        next.add(m.id);
      }
      return next;
    });
  }

  async function handleConvocar() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/jogos/${eventoId}/convocar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ atleta_ids: [...selected] }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao convocar.");
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
        Selecionados: <strong>{selected.size}</strong>/{capacidade}
        {podeConvocarAvulsos && (
          <span className="text-gray-500"> · até {vagasParaAvulsos} avulso(s)</span>
        )}
      </p>

      <section>
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">
            Mensalistas ({disponiveisMensalistas.length} disponíveis)
          </h4>
          <button
            type="button"
            onClick={selectAllMensalistas}
            className="text-xs text-violet-600 hover:text-violet-800"
          >
            Selecionar todos
          </button>
        </div>
        <AtletaCheckList
          atletas={disponiveisMensalistas}
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
        <AtletaCheckList
          atletas={disponiveisAvulsos}
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

function AtletaCheckList({
  atletas,
  selected,
  onToggle,
  disabled,
}: {
  atletas: AtletaElegivel[];
  selected: Set<string>;
  onToggle: (id: string) => void;
  disabled?: boolean;
}) {
  if (!atletas.length) {
    return <p className="text-xs text-gray-500">Nenhum atleta disponível.</p>;
  }

  return (
    <ul className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-lg p-2">
      {atletas.map((a) => (
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
            <span>{a.nome}</span>
            <span className="text-xs text-gray-400 ml-auto">{a.modalidade}</span>
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
