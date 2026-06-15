import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function validateAtleta(atleta_id: string, access_token: string) {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("atletas")
    .select("id")
    .eq("id", atleta_id)
    .eq("access_token", access_token)
    .eq("ativo", true)
    .single();
  return data;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: feedId } = await params;
  const { atleta_id, access_token } = await request.json();

  if (!atleta_id || !access_token) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const atleta = await validateAtleta(atleta_id, access_token);
  if (!atleta) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();

  const { error } = await supabase.from("feed_arquivados").upsert(
    { atleta_id, feed_id: feedId },
    { onConflict: "atleta_id,feed_id" },
  );

  if (error) {
    return NextResponse.json({ error: "Erro ao arquivar." }, { status: 500 });
  }

  if (feedId) {
    const { data: feedItem } = await supabase
      .from("feed")
      .select("atleta_id")
      .eq("id", feedId)
      .single();

    if (feedItem?.atleta_id === atleta_id) {
      await supabase.from("feed").update({ lido: true }).eq("id", feedId);
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: feedId } = await params;
  const { atleta_id, access_token } = await request.json();

  if (!atleta_id || !access_token) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const atleta = await validateAtleta(atleta_id, access_token);
  if (!atleta) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("feed_arquivados")
    .delete()
    .eq("atleta_id", atleta_id)
    .eq("feed_id", feedId);

  if (error) {
    return NextResponse.json({ error: "Erro ao restaurar." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
