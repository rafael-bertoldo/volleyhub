import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { atleta_id, access_token } = await request.json();

  if (!atleta_id || !access_token) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data: atleta } = await supabase
    .from("atletas")
    .select("id")
    .eq("id", atleta_id)
    .eq("access_token", access_token)
    .eq("ativo", true)
    .single();

  if (!atleta) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { error } = await supabase
    .from("feed")
    .update({ lido: true })
    .eq("id", id)
    .eq("atleta_id", atleta_id);

  if (error) {
    return NextResponse.json({ error: "Erro ao atualizar." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
