import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { criarJogo } from "@/lib/jogos-server";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const {
      tipo,
      data,
      hora_inicio,
      hora_fim,
      local,
      adversario,
      capacidade,
      observacoes,
    } = body;

    if (!tipo || !["jogo", "amistoso"].includes(tipo)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }
    if (!data || !hora_inicio || !hora_fim) {
      return NextResponse.json({ error: "Informe data e horários." }, { status: 400 });
    }
    if (!adversario?.trim()) {
      return NextResponse.json({ error: "Informe o adversário." }, { status: 400 });
    }

    const cap = Number(capacidade);
    if (!cap || cap < 1 || cap > 99) {
      return NextResponse.json({ error: "Capacidade inválida." }, { status: 400 });
    }

    const evento = await criarJogo({
      tipo,
      data,
      hora_inicio,
      hora_fim,
      local: local ?? "",
      adversario,
      capacidade: cap,
      observacoes,
    });

    return NextResponse.json({ evento });
  } catch {
    return NextResponse.json({ error: "Erro ao criar evento." }, { status: 500 });
  }
}
