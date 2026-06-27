"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ParticipantesLista } from "@/components/treinos/participantes-lista";
import { useTreinosAttendanceRealtime } from "@/hooks/use-attendances-realtime";
import { formatTrainingDate, formatTime } from "@/lib/treinos";
import type { TrainingParticipant } from "@/lib/treinos-server";
import type { TrainingWithAttendance } from "@/lib/types";

interface AdminTreinosListProps {
  treinos: TrainingWithAttendance[];
  participantesPorEvent: Record<string, TrainingParticipant[]>;
}

export function AdminTreinosList({
  treinos,
  participantesPorEvent,
}: AdminTreinosListProps) {
  const router = useRouter();
  const [attendanceVersion, setAttendanceVersion] = useState(0);

  const onAttendanceUpdate = useCallback(() => {
    setAttendanceVersion((v) => v + 1);
    router.refresh();
  }, [router]);

  useTreinosAttendanceRealtime(
    treinos.map((t) => t.id),
    onAttendanceUpdate,
  );

  async function handleAdminAction(
    attendanceId: string,
    action: "confirmar_pagamento" | "rejeitar_pagamento" | "subir_fila",
  ) {
    const res = await fetch("/api/admin/trainings/attendance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attendance_id: attendanceId, action }),
    });
    if (res.ok) onAttendanceUpdate();
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
        const participantes = participantesPorEvent[treino.id] ?? [];
        const confirmados = participantes.filter((p) => p.status === "confirmed").length;
        const reservados = participantes.filter((p) => p.status === "reserved").length;
        const aguardando = participantes.filter(
          (p) => p.status === "pending_payment",
        ).length;

        return (
          <article key={treino.id} className="card border-l-4 border-l-violet-500">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-semibold text-gray-900">
                  {formatTrainingDate(treino.date)}
                </p>
                <p className="text-sm text-gray-600 mt-0.5">
                  {formatTime(treino.start_time)} – {formatTime(treino.end_time)}
                  {treino.location ? ` · ${treino.location}` : ""}
                </p>
              </div>
              <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
                {treino.occupied_spots}/{treino.capacity} vagas
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
              eventId={treino.id}
              initialParticipantes={participantes}
              modo="admin"
              attendanceVersion={attendanceVersion}
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
