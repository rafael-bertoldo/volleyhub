import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { createGame } from "@/lib/jogos-server";

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  try {
    const body = await request.json();
    const {
      type,
      date,
      start_time,
      end_time,
      location,
      opponent,
      capacity,
      notes,
    } = body;

    if (!type || !["game", "friendly"].includes(type)) {
      return NextResponse.json({ error: "Tipo inválido." }, { status: 400 });
    }
    if (!date || !start_time || !end_time) {
      return NextResponse.json({ error: "Informe data e horários." }, { status: 400 });
    }
    if (!opponent?.trim()) {
      return NextResponse.json({ error: "Informe o adversário." }, { status: 400 });
    }

    const cap = Number(capacity);
    if (!cap || cap < 1 || cap > 99) {
      return NextResponse.json({ error: "Capacidade inválida." }, { status: 400 });
    }

    const event = await createGame({
      type,
      date,
      start_time,
      end_time,
      location: location ?? "",
      opponent,
      capacity: cap,
      notes,
    });

    return NextResponse.json({ event });
  } catch {
    return NextResponse.json({ error: "Erro ao criar jogo." }, { status: 500 });
  }
}
