import { NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/player-server";
import { getParticipantesEvent } from "@/lib/treinos-server";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventoId: string }> },
) {
  const { eventoId } = await params;
  const eventId = eventoId;

  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const participantes = await getParticipantesEvent(eventId);
  return NextResponse.json({ participantes });
}
