import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/player-server";
import { broadcastAttendanceUpdate } from "@/lib/realtime/broadcast-server";
import {
  isConfirmationOpen,
  confirmationHasNotOpened,
  confirmationClosed,
} from "@/lib/treinos";
import {
  executarAcaoAttendance,
  type AttendanceAction,
} from "@/lib/treinos-server";

const ACTIONS: AttendanceAction[] = [
  "confirmar",
  "cancelar",
  "entrar_fila",
  "sair_fila",
  "solicitar_vaga",
];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { event_id, action } = body as {
    event_id?: string;
    action?: string;
  };

  if (!event_id || !action) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (!ACTIONS.includes(action as AttendanceAction)) {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data: event } = await supabase
    .from("events")
    .select("confirmation_opens_at, confirmation_closes_at")
    .eq("id", event_id)
    .single();

  if (event) {
    if (confirmationHasNotOpened(event.confirmation_opens_at)) {
      return NextResponse.json(
        { error: "A confirmação de presença ainda não abriu." },
        { status: 400 },
      );
    }
    if (confirmationClosed(event.confirmation_closes_at)) {
      return NextResponse.json(
        { error: "O prazo de confirmação encerrou." },
        { status: 400 },
      );
    }
    if (
      !isConfirmationOpen(
        event.confirmation_opens_at,
        event.confirmation_closes_at,
      )
    ) {
      return NextResponse.json(
        { error: "Fora do período de confirmação." },
        { status: 400 },
      );
    }
  }

  const result = await executarAcaoAttendance(
    player,
    event_id,
    action as AttendanceAction,
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await broadcastAttendanceUpdate(event_id, { event_id, action });

  return NextResponse.json({ success: true });
}
