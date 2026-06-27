import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/player-server";
import { responderCallUp } from "@/lib/jogos-server";

export async function POST(request: NextRequest) {
  const { event_id, resposta } = await request.json();

  if (!event_id || !resposta) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (!["accepted", "declined"].includes(resposta)) {
    return NextResponse.json({ error: "Resposta inválida." }, { status: 400 });
  }

  const player = await getCurrentPlayer();
  if (!player) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await responderCallUp(
    player,
    event_id,
    resposta as "accepted" | "declined",
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
