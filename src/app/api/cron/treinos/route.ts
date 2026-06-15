import { NextRequest, NextResponse } from "next/server";
import { gerarTreinosSemana } from "@/lib/treinos-server";

export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { error: "CRON_SECRET não configurado." },
      { status: 500 },
    );
  }

  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  await gerarTreinosSemana();

  return NextResponse.json({ success: true });
}
