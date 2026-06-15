"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ParticipantesLista } from "@/components/treinos/participantes-lista";
import { useTreinosPresencaRealtime } from "@/hooks/use-presencas-realtime";
import { formatDataTreino, formatHora } from "@/lib/treinos";
import type { ParticipanteTreino } from "@/lib/treinos-server";
import type { TreinoComPresenca } from "@/lib/types";

interface AdminTreinosListProps {
  treinos: TreinoComPresenca[];
  participantesPorEvento: Record<string, ParticipanteTreino[]>;
}

export function AdminTreinosList({
  treinos,
  participantesPorEvento,
}: AdminTreinosListProps) {
  const router = useRouter();
  const [presencaVersion, setPresencaVersion] = useState(0);

  const onPresencaUpdate = useCallback(() => {
    setPresencaVersion((v) => v + 1);
    router.refresh();
  }, [router]);

  useTreinosPresencaRealtime(
    treinos.map((t) => t.id),
    onPresencaUpdate,
  );

  async function handleAdminAction(
    presencaId: string,
    action: "confirmar_pagamento" | "rejeitar_pagamento" | "subir_fila",
  ) {
    const res = await fetch("/api/admin/treinos/presenca", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presenca_id: presencaId, action }),
    });
    if (res.ok) onPresencaUpdate();
  }

  if (treinos.length === 0) {
    return (
      <section className="card">
        <p className="text-sm text-gray-500">Nenhum treino agendado.</p>
      </section>
    );
  }

  return (
    <div className="space-y-4">
      {treinos.map((treino) => {
        const participantes = participantesPorEvento[treino.id] ?? [];
        const confirmados = participantes.filter((p) => p.status === "confirmado").length;
        const reservados = participantes.filter((p) => p.status === "reservado").length;
        const aguardando = participantes.filter(
          (p) => p.status === "aguardando_pagamento",
        ).length;

        return (
          <article key={treino.id} className="card border-l-4 border-l-violet-500">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">
                  {formatDataTreino(treino.data)}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {formatHora(treino.hora_inicio)} – {formatHora(treino.hora_fim)}
                  {treino.local ? ` · ${treino.local}` : ""}
                </p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                {treino.vagas_ocupadas}/{treino.capacidade} vagas
              </span>
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              <StatPill label="Confirmados" value={confirmados} color="green" />
              <StatPill label="Reservados" value={reservados} color="blue" />
              {aguardando > 0 && (
                <StatPill label="Aguard. pagamento" value={aguardando} color="orange" />
              )}
            </div>

            <ParticipantesLista
              eventoId={treino.id}
              initialParticipantes={participantes}
              modo="admin"
              presencaVersion={presencaVersion}
              onAdminAction={handleAdminAction}
            />
          </article>
        );
      })}
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "green" | "blue" | "orange";
}) {
  const colors = {
    green: "bg-green-50 text-green-800",
    blue: "bg-blue-50 text-blue-800",
    orange: "bg-orange-50 text-orange-800",
  };

  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${colors[color]}`}>
      {label}: {value}
    </span>
  );
}
