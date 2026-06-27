import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { getPlayersElegiveis } from "@/lib/jogos-server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    const elegiveis = await getPlayersElegiveis(id);
    return NextResponse.json(elegiveis);
  } catch {
    return NextResponse.json({ error: "Evento não encontrado." }, { status: 404 });
  }
}
