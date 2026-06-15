import { NextRequest, NextResponse } from "next/server";
import { getAtletaByToken } from "@/lib/atleta-server";
import { responderConvocacao } from "@/lib/jogos-server";

export async function POST(request: NextRequest) {
  const { access_token, evento_id, resposta } = await request.json();

  if (!access_token || !evento_id || !resposta) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (!["aceito", "recusado"].includes(resposta)) {
    return NextResponse.json({ error: "Resposta inválida." }, { status: 400 });
  }

  const atleta = await getAtletaByToken(access_token);
  if (!atleta) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const result = await responderConvocacao(
    atleta,
    evento_id,
    resposta as "aceito" | "recusado",
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
