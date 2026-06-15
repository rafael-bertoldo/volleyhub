import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { convocarAtletas } from "@/lib/jogos-server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id: eventoId } = await params;
  const { atleta_ids } = await request.json();

  if (!Array.isArray(atleta_ids) || !atleta_ids.length) {
    return NextResponse.json(
      { error: "Selecione ao menos um atleta." },
      { status: 400 },
    );
  }

  const result = await convocarAtletas(eventoId, atleta_ids);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true, convocados: result.convocados });
}
