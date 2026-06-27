import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { cancelGame, deleteGame, updateGame } from "@/lib/jogos-server";

function parseGameBody(body: Record<string, unknown>) {
  const type = body.type;
  const date = body.date;
  const start_time = body.start_time;
  const end_time = body.end_time;
  const location = body.location;
  const opponent = body.opponent;
  const capacity = Number(body.capacity);
  const notes = body.notes;

  if (!type || !["game", "friendly"].includes(String(type))) {
    return { error: "Tipo inválido." };
  }
  if (!date || !start_time || !end_time) {
    return { error: "Informe data e horários." };
  }
  if (typeof opponent !== "string" || !opponent.trim()) {
    return { error: "Informe o adversário." };
  }
  if (!capacity || capacity < 1 || capacity > 99) {
    return { error: "Capacidade inválida." };
  }

  return {
    input: {
      type: type as "game" | "friendly",
      date: String(date),
      start_time: String(start_time),
      end_time: String(end_time),
      location: typeof location === "string" ? location : "",
      opponent,
      capacity,
      notes: typeof notes === "string" ? notes : "",
    },
  };
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const body = (await request.json()) as Record<string, unknown>;

  if (body.action === "cancel") {
    const result = await cancelGame(id);
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  }

  const parsed = parseGameBody(body);
  if ("error" in parsed) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const result = await updateGame(id, parsed.input);
  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ event: result.event });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;
  const result = await deleteGame(id);

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
