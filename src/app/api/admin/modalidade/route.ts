import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastFeedToPlayer } from "@/lib/realtime/broadcast-server";
import { MEMBERSHIP_TYPE_LABELS } from "@/lib/constants";
import type { FeedItem } from "@/lib/types";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { player_id, action } = await request.json();

  if (!player_id || !["aprovar", "recusar"].includes(action)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const status = action === "aprovar" ? "approved" : "rejected";
  const supabase = createAdminClient();

  const { data: player, error } = await supabase
    .from("players")
    .update({ membership_status: status })
    .eq("id", player_id)
    .select("id, name, membership_type")
    .single();

  if (error || !player) {
    return NextResponse.json({ error: "Atleta não encontrado." }, { status: 404 });
  }

  const title =
    action === "aprovar" ? "Modalidade aprovada!" : "Modalidade não disponível";

  const body =
    action === "aprovar"
      ? `Sua solicitação de ${MEMBERSHIP_TYPE_LABELS[player.membership_type as keyof typeof MEMBERSHIP_TYPE_LABELS]} foi aprovada. Bem-vindo ao time!`
      : `No momento não há vaga disponível para ${MEMBERSHIP_TYPE_LABELS[player.membership_type as keyof typeof MEMBERSHIP_TYPE_LABELS]}. Entre em contato com o administrador.`;

  const { data: feedItem, error: feedError } = await supabase
    .from("feed")
    .insert({
      type: "system",
      player_id: player.id,
      title,
      body,
    })
    .select()
    .single();

  if (feedError) {
    console.error("Erro ao inserir no feed:", feedError);
  } else if (feedItem) {
    await broadcastFeedToPlayer(player.id, feedItem as FeedItem);
  }

  return NextResponse.json({ success: true });
}
