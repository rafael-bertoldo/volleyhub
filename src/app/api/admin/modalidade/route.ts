import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { MODALIDADE_LABELS } from "@/lib/constants";

export async function POST(request: NextRequest) {
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

  await supabase.from("feed").insert({
    tipo: "sistema",
    atleta_id: atleta.id,
    titulo,
    corpo,
  });

  return NextResponse.json({ success: true });
}
