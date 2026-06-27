import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastFeedToPlayer } from "@/lib/realtime/broadcast-server";
import { MEMBERSHIP_TYPE_LABELS, MEMBERSHIP_TYPES } from "@/lib/constants";
import { reconcilePlayerTrainingAttendances } from "@/lib/treinos-server";
import type { FeedItem, MembershipType } from "@/lib/types";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { player_id, action, membership_type } = (await request.json()) as {
    player_id?: string;
    action?: "aprovar" | "recusar" | "alterar";
    membership_type?: MembershipType;
  };

  if (!player_id || !["aprovar", "recusar", "alterar"].includes(action ?? "")) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const validAction = action as "aprovar" | "recusar" | "alterar";

  if (
    validAction === "alterar" &&
    !MEMBERSHIP_TYPES.some((type) => type.value === membership_type)
  ) {
    return NextResponse.json({ error: "Modalidade inválida." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const update =
    validAction === "alterar"
      ? { membership_type: membership_type as MembershipType, membership_status: "approved" as const }
      : { membership_status: validAction === "aprovar" ? "approved" as const : "rejected" as const };

  const { data: player, error } = await supabase
    .from("players")
    .update(update)
    .eq("id", player_id)
    .select("id, name, membership_type, membership_status")
    .single();

  if (error || !player) {
    return NextResponse.json({ error: "Atleta não encontrado." }, { status: 404 });
  }

  await reconcilePlayerTrainingAttendances(player);

  const membershipLabel =
    MEMBERSHIP_TYPE_LABELS[player.membership_type as keyof typeof MEMBERSHIP_TYPE_LABELS];

  const titleByAction = {
    aprovar: "Modalidade aprovada!",
    recusar: "Modalidade não disponível",
    alterar: "Modalidade alterada",
  };

  const bodyByAction = {
    aprovar: `Sua solicitação de ${membershipLabel} foi aprovada. Bem-vindo ao time!`,
    recusar: `No momento não há vaga disponível para ${membershipLabel}. Entre em contato com o administrador.`,
    alterar: `Sua modalidade foi alterada para ${membershipLabel} pelo administrador.`,
  };

  const title = titleByAction[validAction];
  const body = bodyByAction[validAction];

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
