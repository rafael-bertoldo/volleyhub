import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth/admin";
import { broadcastPresencaUpdate } from "@/lib/realtime/broadcast-server";
import {
  executarAcaoAdminPresenca,
  type AdminPresencaAction,
} from "@/lib/treinos-server";
import { createAdminClient } from "@/lib/supabase/admin";

const ACTIONS: AdminPresencaAction[] = [
  "confirmar_pagamento",
  "rejeitar_pagamento",
  "subir_fila",
];

export async function POST(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { presenca_id, action } = await request.json();

  if (!presenca_id || !action) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (!ACTIONS.includes(action as AdminPresencaAction)) {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: presenca } = await supabase
    .from("presencas")
    .select("evento_id")
    .eq("id", presenca_id)
    .single();

  if (!presenca) {
    return NextResponse.json({ error: "Presença não encontrada." }, { status: 404 });
  }

  const result = await executarAcaoAdminPresenca(
    presenca_id,
    action as AdminPresencaAction,
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await broadcastPresencaUpdate(presenca.evento_id, {
    evento_id: presenca.evento_id,
    action,
  });

  return NextResponse.json({ success: true });
}
