import { NextRequest, NextResponse } from "next/server";
import { getCurrentPlayer } from "@/lib/player-server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  await request.json().catch(() => null);

  const player = await getCurrentPlayer();

  if (!player) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("feed")
    .update({ is_read: true })
    .eq("id", id)
    .eq("player_id", player.id);

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
