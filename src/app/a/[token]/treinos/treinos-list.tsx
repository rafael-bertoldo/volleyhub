"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusCard } from "../atleta-ui";
import { ParticipantesLista } from "@/components/treinos/participantes-lista";
import { useTreinosPresencaRealtime } from "@/hooks/use-presencas-realtime";
import {
  confirmacaoAberta,
  confirmacaoAindaNaoAbriu,
  confirmacaoEncerrada,
  formatDataTreino,
  formatHora,
  formatIntervaloConfirmacao,
  STATUS_PRESENCA_BADGE,
  STATUS_PRESENCA_LABEL,
} from "@/lib/treinos";
import type { Atleta, TreinoComPresenca } from "@/lib/types";
import type { PresencaAction } from "@/lib/treinos-server";

interface TreinosListProps {
  treinos: TreinoComPresenca[];
  atleta: Atleta;
  accessToken: string;
}

export function TreinosList({ treinos, atleta, accessToken }: TreinosListProps) {
  const router = useRouter();
  const [items, setItems] = useState(treinos);
  const [presencaVersion, setPresencaVersion] = useState(0);

  useEffect(() => {
    setItems(treinos);
  }, [treinos]);

  const onPresencaUpdate = useCallback(() => {
    setPresencaVersion((v) => v + 1);
    router.refresh();
  }, [router]);

  useTreinosPresencaRealtime(
    items.map((t) => t.id),
    onPresencaUpdate,
  );

  const podeAgir =
    atleta.modalidade === "A" || atleta.modalidade_status === "aprovado";

  return (
    <div className="space-y-4">
      {!podeAgir && <StatusCard atleta={atleta} />}

      {podeAgir && atleta.modalidade === "A" && (
        <div className="card border-l-4 border-l-violet-500">
          <p className="text-sm text-gray-700">
            Como <strong>avulso</strong>, você pode solicitar vaga quando houver
            disponibilidade ou entrar na fila de espera.
          </p>
        </div>
      )}

      {items.length === 0 ? (
        <section className="card">
          <p className="text-sm text-gray-500">
            Nenhum treino agendado nos próximos dias.
          </p>
        </section>
      ) : (
        <div className="space-y-3">
          {items.map((treino) => (
            <TreinoCard
              key={treino.id}
              treino={treino}
              atleta={atleta}
              accessToken={accessToken}
              podeAgir={podeAgir}
              presencaVersion={presencaVersion}
              onUpdate={onPresencaUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreinoCard({
  treino,
  atleta,
  accessToken,
  podeAgir,
  presencaVersion,
  onUpdate,
}: {
  treino: TreinoComPresenca;
  atleta: Atleta;
  accessToken: string;
  podeAgir: boolean;
  presencaVersion: number;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vagasRestantes = treino.capacidade - treino.vagas_ocupadas;
  const presenca = treino.presenca;
  const aberta = confirmacaoAberta(
    treino.confirmacao_abre_em,
    treino.confirmacao_fecha_em,
  );
  const aindaNaoAbriu = confirmacaoAindaNaoAbriu(treino.confirmacao_abre_em);
  const encerrada = confirmacaoEncerrada(treino.confirmacao_fecha_em);

  async function executar(action: PresencaAction) {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch("/api/treinos/presenca", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          access_token: accessToken,
          evento_id: treino.id,
          action,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao processar.");
        return;
      }
      onUpdate();
    } finally {
      setLoading(null);
    }
  }

  const statusAtivo = presenca && presenca.status !== "liberado";

  return (
    <article className="card border-l-4 border-l-violet-500">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{formatDataTreino(treino.data)}</p>
          <p className="text-sm text-gray-600 mt-0.5">
            {formatHora(treino.hora_inicio)} – {formatHora(treino.hora_fim)}
            {treino.local ? ` · ${treino.local}` : ""}
          </p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
          {treino.vagas_ocupadas}/{treino.capacidade} vagas
        </span>
      </div>

      {statusAtivo && presenca && (
        <div className="mt-3">
          <span
            className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${STATUS_PRESENCA_BADGE[presenca.status]}`}
          >
            {STATUS_PRESENCA_LABEL[presenca.status]}
            {presenca.status === "fila_espera" && presenca.posicao_fila
              ? ` · ${presenca.posicao_fila}º`
              : ""}
          </span>
        </div>
      )}

      {aindaNaoAbriu && (
        <p className="text-xs text-gray-500 mt-3">
          Confirmação abre em{" "}
          {formatIntervaloConfirmacao(
            treino.confirmacao_abre_em,
            treino.confirmacao_fecha_em,
          )?.split(" até ")[0]}
        </p>
      )}

      {encerrada && (
        <p className="text-xs text-gray-500 mt-3">Prazo de confirmação encerrado.</p>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      <ParticipantesLista
        eventoId={treino.id}
        accessToken={accessToken}
        atletaIdAtual={atleta.id}
        modo="atleta"
        presencaVersion={presencaVersion}
      />

      {podeAgir && aberta && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
          <TreinoActions
            treino={treino}
            atleta={atleta}
            loading={loading}
            vagasRestantes={vagasRestantes}
            onAction={executar}
          />
        </div>
      )}
    </article>
  );
}

function TreinoActions({
  treino,
  atleta,
  loading,
  vagasRestantes,
  onAction,
}: {
  treino: TreinoComPresenca;
  atleta: Atleta;
  loading: string | null;
  vagasRestantes: number;
  onAction: (action: PresencaAction) => void;
}) {
  const presenca = treino.presenca;
  const status = presenca?.status;

  if (atleta.modalidade !== "A") {
    if (status === "reservado") {
      return (
        <>
          <ActionButton
            label="Confirmar presença"
            variant="primary"
            loading={loading === "confirmar"}
            onClick={() => onAction("confirmar")}
          />
          <ActionButton
            label="Liberar vaga"
            variant="secondary"
            loading={loading === "cancelar"}
            onClick={() => onAction("cancelar")}
          />
        </>
      );
    }
    if (status === "confirmado") {
      return (
        <ActionButton
          label="Cancelar presença"
          variant="secondary"
          loading={loading === "cancelar"}
          onClick={() => onAction("cancelar")}
        />
      );
    }
    return null;
  }

  if (status === "fila_espera") {
    return (
      <ActionButton
        label="Sair da fila"
        variant="secondary"
        loading={loading === "sair_fila"}
        onClick={() => onAction("sair_fila")}
      />
    );
  }

  if (status === "aguardando_pagamento") {
    return (
      <p className="text-xs text-orange-700 self-center">
        Aguardando confirmação do pagamento pelo admin.
      </p>
    );
  }

  if (!status || status === "liberado") {
    if (vagasRestantes > 0) {
      return (
        <>
          <ActionButton
            label="Solicitar vaga"
            variant="primary"
            loading={loading === "solicitar_vaga"}
            onClick={() => onAction("solicitar_vaga")}
          />
          <ActionButton
            label="Entrar na fila"
            variant="secondary"
            loading={loading === "entrar_fila"}
            onClick={() => onAction("entrar_fila")}
          />
        </>
      );
    }
    return (
      <ActionButton
        label="Entrar na fila de espera"
        variant="primary"
        loading={loading === "entrar_fila"}
        onClick={() => onAction("entrar_fila")}
      />
    );
  }

  return null;
}

function ActionButton({
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
  const base =
    "inline-flex items-center text-sm font-medium px-3.5 py-2 rounded-lg border transition-colors disabled:opacity-50";
  const styles =
    variant === "primary"
      ? "border-violet-600 bg-violet-600 text-white hover:bg-violet-700 active:bg-violet-800"
      : "border-gray-200 bg-gray-50 text-gray-700 hover:bg-violet-50 hover:border-violet-200 hover:text-violet-700";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className={`${base} ${styles}`}
    >
      {loading ? "..." : label}
    </button>
  );
}
