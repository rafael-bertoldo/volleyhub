import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { convocarPlayers } from "@/lib/jogos-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: eventId } = await params;
  const { player_ids } = await request.json();

  if (!Array.isArray(player_ids) || !player_ids.length) {
    return NextResponse.json(
      { error: "Selecione ao menos um atleta." },
      { status: 400 },
    );
  }

  const result = await convocarPlayers(eventId, player_ids);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, calledUp: result.calledUp });
}
