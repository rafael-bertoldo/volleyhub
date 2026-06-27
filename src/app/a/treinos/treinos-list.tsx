"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { StatusCard } from "../player-ui";
import { ParticipantesLista } from "@/components/treinos/participantes-lista";
import { useTreinosAttendanceRealtime } from "@/hooks/use-attendances-realtime";
import {
  isConfirmationOpen,
  confirmationHasNotOpened,
  confirmationClosed,
  formatTrainingDate,
  formatTime,
  formatConfirmationWindow,
  ATTENDANCE_STATUS_BADGE,
  ATTENDANCE_STATUS_LABEL,
} from "@/lib/treinos";
import type { Player, TrainingWithAttendance } from "@/lib/types";
import type { AttendanceAction } from "@/lib/treinos-server";

interface TreinosListProps {
  treinos: TrainingWithAttendance[];
  player: Player;
}

export function TreinosList({ treinos, player }: TreinosListProps) {
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

  const podeAgir =
    player.membership_type === "A" || player.membership_status === "approved";

  return (
    <div className="space-y-4">
      {!podeAgir && <StatusCard player={player} />}

      {podeAgir && player.membership_type === "A" && (
        <div className="card border-l-4 border-l-violet-500">
          <p className="text-sm text-gray-700">
            Como <strong>avulso</strong>, você pode solicitar vaga quando houver
            disponibilidade ou entrar na fila de espera.
          </p>
        </div>
      )}

      {treinos.length === 0 ? (
        <section className="card">
          <p className="text-sm text-gray-500">
            Nenhum treino agendado nos próximos dias.
          </p>
        </section>
      ) : (
        <div className="space-y-3">
          {treinos.map((treino) => (
            <TreinoCard
              key={treino.id}
              treino={treino}
              player={player}
              podeAgir={podeAgir}
              attendanceVersion={attendanceVersion}
              onUpdate={onAttendanceUpdate}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function TreinoCard({
  treino,
  player,
  podeAgir,
  attendanceVersion,
  onUpdate,
}: {
  treino: TrainingWithAttendance;
  player: Player;
  podeAgir: boolean;
  attendanceVersion: number;
  onUpdate: () => void;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const vagasRestantes = treino.capacity - treino.occupied_spots;
  const attendance = treino.attendance;
  const aberta = isConfirmationOpen(
    treino.confirmation_opens_at,
    treino.confirmation_closes_at,
  );
  const aindaNaoAbriu = confirmationHasNotOpened(treino.confirmation_opens_at);
  const encerrada = confirmationClosed(treino.confirmation_closes_at);

  async function executar(action: AttendanceAction) {
    setLoading(action);
    setError(null);
    try {
      const res = await fetch("/api/trainings/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: treino.id,
          action,
        }),
      });
      const date = await res.json();
      if (!res.ok) {
        setError(date.error ?? "Erro ao processar.");
        return;
      }
      onUpdate();
    } finally {
      setLoading(null);
    }
  }

  const statusAtivo = attendance && attendance.status !== "released";

  return (
    <article className="card border-l-4 border-l-violet-500">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-gray-900">{formatTrainingDate(treino.date)}</p>
          <p className="text-sm text-gray-600 mt-0.5">
            {formatTime(treino.start_time)} – {formatTime(treino.end_time)}
            {treino.location ? ` · ${treino.location}` : ""}
          </p>
        </div>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-gray-100 text-gray-700">
          {treino.occupied_spots}/{treino.capacity} vagas
        </span>
      </div>

      {statusAtivo && attendance && (
        <div className="mt-3">
          <span
            className={`inline-flex text-xs font-medium px-2.5 py-1 rounded-full ${ATTENDANCE_STATUS_BADGE[attendance.status]}`}
          >
            {ATTENDANCE_STATUS_LABEL[attendance.status]}
            {attendance.status === "waitlist" && attendance.waitlist_position
              ? ` · ${attendance.waitlist_position}º`
              : ""}
          </span>
        </div>
      )}

      {aindaNaoAbriu && (
        <p className="text-xs text-gray-500 mt-3">
          Confirmação abre em{" "}
          {formatConfirmationWindow(
            treino.confirmation_opens_at,
            treino.confirmation_closes_at,
          )?.split(" até ")[0]}
        </p>
      )}

      {encerrada && (
        <p className="text-xs text-gray-500 mt-3">Prazo de confirmação encerrado.</p>
      )}

      {error && <p className="text-xs text-red-600 mt-2">{error}</p>}

      <ParticipantesLista
        eventId={treino.id}
        playerIdAtual={player.id}
        modo="player"
        attendanceVersion={attendanceVersion}
      />

      {podeAgir && aberta && (
        <div className="mt-3 pt-3 border-t border-gray-100 flex flex-wrap gap-2 justify-end">
          <TreinoActions
            treino={treino}
            player={player}
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
  player,
  loading,
  vagasRestantes,
  onAction,
}: {
  treino: TrainingWithAttendance;
  player: Player;
  loading: string | null;
  vagasRestantes: number;
  onAction: (action: AttendanceAction) => void;
}) {
  const attendance = treino.attendance;
  const status = attendance?.status;

  if (player.membership_type !== "A") {
    if (status === "reserved") {
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
    if (status === "confirmed") {
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

  if (status === "waitlist") {
    return (
      <ActionButton
        label="Sair da fila"
        variant="secondary"
        loading={loading === "sair_fila"}
        onClick={() => onAction("sair_fila")}
      />
    );
  }

  if (status === "pending_payment") {
    return (
      <p className="text-xs text-orange-700 self-center">
        Aguardando confirmação do pagamento pelo admin.
      </p>
    );
  }

  if (!status || status === "released") {
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
