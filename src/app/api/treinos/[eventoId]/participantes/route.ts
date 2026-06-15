import { NextRequest, NextResponse } from "next/server";
import { getAtletaByToken } from "@/lib/atleta-server";
import { getParticipantesEvento } from "@/lib/treinos-server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventoId: string }> },
) {
  const { eventoId } = await params;
  const accessToken = request.nextUrl.searchParams.get("access_token");

  if (!accessToken) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const atleta = await getAtletaByToken(accessToken);
  if (!atleta) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const participantes = await getParticipantesEvento(eventoId);
  return NextResponse.json({ participantes });
}
