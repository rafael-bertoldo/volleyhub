import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createAdminClient } from "@/lib/supabase/admin";
import { broadcastFeedToAtleta } from "@/lib/realtime/broadcast-server";
import { MODALIDADE_LABELS } from "@/lib/constants";
import type { FeedItem } from "@/lib/types";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { atleta_id, action } = await request.json();

  if (!atleta_id || !["aprovar", "recusar"].includes(action)) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const status = action === "aprovar" ? "aprovado" : "recusado";
  const supabase = createAdminClient();

  const { data: atleta, error } = await supabase
    .from("atletas")
    .update({ modalidade_status: status })
    .eq("id", atleta_id)
    .select("id, nome, modalidade")
    .single();

  if (error || !atleta) {
    return NextResponse.json({ error: "Atleta não encontrado." }, { status: 404 });
  }

  const titulo =
    action === "aprovar" ? "Modalidade aprovada!" : "Modalidade não disponível";

  const corpo =
    action === "aprovar"
      ? `Sua solicitação de ${MODALIDADE_LABELS[atleta.modalidade as keyof typeof MODALIDADE_LABELS]} foi aprovada. Bem-vindo ao time!`
      : `No momento não há vaga disponível para ${MODALIDADE_LABELS[atleta.modalidade as keyof typeof MODALIDADE_LABELS]}. Entre em contato com o administrador.`;

  const { data: feedItem, error: feedError } = await supabase
    .from("feed")
    .insert({
      tipo: "sistema",
      atleta_id: atleta.id,
      titulo,
      corpo,
    })
    .select()
    .single();

  if (feedError) {
    console.error("Erro ao inserir no feed:", feedError);
  } else if (feedItem) {
    await broadcastFeedToAtleta(atleta.id, feedItem as FeedItem);
  }

  return NextResponse.json({ success: true });
}
