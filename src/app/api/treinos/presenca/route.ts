import { NextRequest, NextResponse } from "next/server";
import { getAtletaByToken } from "@/lib/atleta-server";
import { broadcastPresencaUpdate } from "@/lib/realtime/broadcast-server";
import {
  confirmacaoAberta,
  confirmacaoAindaNaoAbriu,
  confirmacaoEncerrada,
} from "@/lib/treinos";
import {
  executarAcaoPresenca,
  type PresencaAction,
} from "@/lib/treinos-server";

const ACTIONS: PresencaAction[] = [
  "confirmar",
  "cancelar",
  "entrar_fila",
  "sair_fila",
  "solicitar_vaga",
];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { access_token, evento_id, action } = body as {
    access_token?: string;
    evento_id?: string;
    action?: string;
  };

  if (!access_token || !evento_id || !action) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  if (!ACTIONS.includes(action as PresencaAction)) {
    return NextResponse.json({ error: "Ação inválida." }, { status: 400 });
  }

  const atleta = await getAtletaByToken(access_token);
  if (!atleta) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const { createAdminClient } = await import("@/lib/supabase/admin");
  const supabase = createAdminClient();
  const { data: evento } = await supabase
    .from("eventos")
    .select("confirmacao_abre_em, confirmacao_fecha_em")
    .eq("id", evento_id)
    .single();

  if (evento) {
    if (confirmacaoAindaNaoAbriu(evento.confirmacao_abre_em)) {
      return NextResponse.json(
        { error: "A confirmação de presença ainda não abriu." },
        { status: 400 },
      );
    }
    if (confirmacaoEncerrada(evento.confirmacao_fecha_em)) {
      return NextResponse.json(
        { error: "O prazo de confirmação encerrou." },
        { status: 400 },
      );
    }
    if (
      !confirmacaoAberta(
        evento.confirmacao_abre_em,
        evento.confirmacao_fecha_em,
      )
    ) {
      return NextResponse.json(
        { error: "Fora do período de confirmação." },
        { status: 400 },
      );
    }
  }

  const result = await executarAcaoPresenca(
    atleta,
    evento_id,
    action as PresencaAction,
  );

  if (result.error) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  await broadcastPresencaUpdate(evento_id, { evento_id, action });

  return NextResponse.json({ success: true });
}
