import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getMensalidadeMesAtual, isMensalista } from "@/lib/mensalidade";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Atleta } from "@/lib/types";

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: atleta } = await supabase
    .from("atletas")
    .select("id, modalidade, modalidade_status")
    .eq("id", id)
    .single();

  if (!atleta) {
    return NextResponse.json({ error: "Atleta não encontrado." }, { status: 404 });
  }

  if (!isMensalista(atleta as Pick<Atleta, "modalidade" | "modalidade_status">)) {
    return NextResponse.json(
      { error: "Mensalidade só se aplica a mensalistas aprovados." },
      { status: 400 },
    );
  }

  const mensalidadeMes = getMensalidadeMesAtual();

  const { data, error } = await supabase
    .from("atletas")
    .update({
      mensalidade_mes: mensalidadeMes,
      mensalidade_paga_em: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, mensalidade_mes, mensalidade_paga_em")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Erro ao registrar pagamento." }, { status: 500 });
  }

  return NextResponse.json({ atleta: data });
}
