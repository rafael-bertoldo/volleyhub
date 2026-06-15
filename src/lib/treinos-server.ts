import { createAdminClient } from "@/lib/supabase/admin";
import {
  addDays,
  combineDateTime,
  diaSemanaFromData,
  diasVisiveisParaAtleta,
  eventoChave,
  getIntervaloSemanaAtual,
  getMondayOfWeek,
  modalidadesParaDia,
  normalizeHora,
  STATUS_OCUPA_VAGA,
  toDateString,
} from "@/lib/treinos";
import type {
  Atleta,
  Evento,
  Modalidade,
  Presenca,
  StatusPresenca,
  TreinoComPresenca,
} from "@/lib/types";

const CONFIRMATION_DAYS_BEFORE = 7;

export interface ParticipanteTreino {
  presenca_id: string;
  atleta_id: string;
  nome: string;
  modalidade: Modalidade;
  status: StatusPresenca;
  posicao_fila: number | null;
  confirmado_em: string | null;
}

function dedupeEventos(eventos: Evento[]): Evento[] {
  const seen = new Map<string, Evento>();
  for (const e of eventos) {
    const key = eventoChave(e.data, e.hora_inicio);
    const existing = seen.get(key);
    if (!existing || e.id < existing.id) {
      seen.set(key, e);
    }
  }
  return [...seen.values()].sort((a, b) => {
    const cmp = a.data.localeCompare(b.data);
    if (cmp !== 0) return cmp;
    return normalizeHora(a.hora_inicio).localeCompare(normalizeHora(b.hora_inicio));
  });
}

interface TreinoRecorrente {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  local: string;
  capacidade: number;
  ativo: boolean;
}

export async function ensureEventosSemana(weekMonday?: Date) {
  const supabase = createAdminClient();
  const { data: recorrentes } = await supabase
    .from("treinos_recorrentes")
    .select("*")
    .eq("ativo", true);

  if (!recorrentes?.length) return;

  const monday = weekMonday ?? getMondayOfWeek(new Date());

  for (let offset = 0; offset < 7; offset++) {
    const dia = addDays(monday, offset);
    const diaSemana = dia.getDay();
    const data = toDateString(dia);

    for (const tr of recorrentes as TreinoRecorrente[]) {
      if (tr.dia_semana !== diaSemana) continue;

      const horaInicio = normalizeHora(tr.hora_inicio);
      const horaFim = normalizeHora(tr.hora_fim);

      const { data: existingList } = await supabase
        .from("eventos")
        .select("id")
        .eq("tipo", "treino")
        .eq("origem", "recorrente")
        .eq("data", data)
        .eq("hora_inicio", horaInicio)
        .limit(1);

      if (existingList?.length) continue;

      const inicio = combineDateTime(data, horaInicio);
      const abre = addDays(inicio, -CONFIRMATION_DAYS_BEFORE);
      abre.setHours(0, 0, 0, 0);

      const { data: evento, error } = await supabase
        .from("eventos")
        .insert({
          tipo: "treino",
          data,
          hora_inicio: horaInicio,
          hora_fim: horaFim,
          local: tr.local,
          capacidade: tr.capacidade,
          confirmacao_abre_em: abre.toISOString(),
          confirmacao_fecha_em: inicio.toISOString(),
          origem: "recorrente",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") continue;
        console.error("Erro ao criar evento da semana:", error);
        continue;
      }

      if (!evento) continue;
    }
  }
}

/** Gera treinos da semana e garante reservas dos mensalistas em todos os eventos */
export async function gerarTreinosSemana(weekMonday?: Date) {
  await ensureEventosSemana(weekMonday);
  await syncAllPresencasReservadas(weekMonday);
}

export async function syncAllPresencasReservadas(weekMonday?: Date) {
  const monday = weekMonday ?? getMondayOfWeek(new Date());
  const fimSemana = toDateString(addDays(monday, 6));

  const supabase = createAdminClient();
  const { data: eventos } = await supabase
    .from("eventos")
    .select("*")
    .eq("tipo", "treino")
    .gte("data", toDateString(monday))
    .lte("data", fimSemana);

  for (const evento of dedupeEventos((eventos ?? []) as Evento[])) {
    await syncPresencasReservadas(evento);
  }
}

export async function syncPresencasReservadas(evento: Evento) {
  const supabase = createAdminClient();
  const diaSemana = diaSemanaFromData(evento.data);
  const modalidades = modalidadesParaDia(diaSemana);

  if (!modalidades.length) return;

  const { data: atletas } = await supabase
    .from("atletas")
    .select("id, modalidade")
    .eq("ativo", true)
    .eq("modalidade_status", "aprovado")
    .in("modalidade", modalidades);

  if (!atletas?.length) return;

  const { data: existentes } = await supabase
    .from("presencas")
    .select("atleta_id")
    .eq("evento_id", evento.id);

  const jaTem = new Set((existentes ?? []).map((p) => p.atleta_id));
  const novos = atletas.filter((a) => !jaTem.has(a.id));

  if (!novos.length) return;

  await supabase.from("presencas").insert(
    novos.map((a) => ({
      evento_id: evento.id,
      atleta_id: a.id,
      status: "reservado" as StatusPresenca,
    })),
  );
}

export async function getTreinosParaAtleta(atleta: Atleta): Promise<TreinoComPresenca[]> {
  await gerarTreinosSemana();

  const supabase = createAdminClient();
  const { hoje, fimSemana } = getIntervaloSemanaAtual();
  const diasPermitidos = diasVisiveisParaAtleta(atleta.modalidade);

  const { data: eventos } = await supabase
    .from("eventos")
    .select("*")
    .eq("tipo", "treino")
    .gte("data", hoje)
    .lte("data", fimSemana)
    .order("data", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (!eventos?.length) return [];

  const filtrados = dedupeEventos(
    (eventos as Evento[]).filter((e) =>
      diasPermitidos.includes(diaSemanaFromData(e.data)),
    ),
  );

  if (!filtrados.length) return [];

  const eventoIds = filtrados.map((e) => e.id);

  const [{ data: presencas }, { data: ocupadas }] = await Promise.all([
    supabase
      .from("presencas")
      .select("*")
      .eq("atleta_id", atleta.id)
      .in("evento_id", eventoIds),
    supabase
      .from("presencas")
      .select("evento_id")
      .in("evento_id", eventoIds)
      .in("status", STATUS_OCUPA_VAGA),
  ]);

  const presencaMap = new Map(
    ((presencas ?? []) as Presenca[]).map((p) => [p.evento_id, p]),
  );

  const ocupadasMap = new Map<string, number>();
  for (const row of ocupadas ?? []) {
    ocupadasMap.set(row.evento_id, (ocupadasMap.get(row.evento_id) ?? 0) + 1);
  }

  return filtrados.map((evento) => ({
    ...evento,
    presenca: presencaMap.get(evento.id) ?? null,
    vagas_ocupadas: ocupadasMap.get(evento.id) ?? 0,
  }));
}

export async function countVagasOcupadas(eventoId: string) {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("presencas")
    .select("*", { count: "exact", head: true })
    .eq("evento_id", eventoId)
    .in("status", STATUS_OCUPA_VAGA);
  return count ?? 0;
}

async function renumberWaitlist(eventoId: string) {
  const supabase = createAdminClient();
  const { data: fila } = await supabase
    .from("presencas")
    .select("id")
    .eq("evento_id", eventoId)
    .eq("status", "fila_espera")
    .order("posicao_fila", { ascending: true });

  for (let i = 0; i < (fila ?? []).length; i++) {
    await supabase
      .from("presencas")
      .update({ posicao_fila: i + 1 })
      .eq("id", fila![i].id);
  }
}

export async function promoteWaitlist(eventoId: string, capacidade: number) {
  const ocupadas = await countVagasOcupadas(eventoId);
  if (ocupadas >= capacidade) return;

  const supabase = createAdminClient();
  const { data: next } = await supabase
    .from("presencas")
    .select("id, atleta_id")
    .eq("evento_id", eventoId)
    .eq("status", "fila_espera")
    .order("posicao_fila", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!next) return;

  const { data: atleta } = await supabase
    .from("atletas")
    .select("modalidade")
    .eq("id", next.atleta_id)
    .single();

  const newStatus: StatusPresenca =
    atleta?.modalidade === "A" ? "aguardando_pagamento" : "reservado";

  await supabase
    .from("presencas")
    .update({ status: newStatus, posicao_fila: null, confirmado_em: null })
    .eq("id", next.id);

  await renumberWaitlist(eventoId);
  await promoteWaitlist(eventoId, capacidade);
}

export type PresencaAction =
  | "confirmar"
  | "cancelar"
  | "entrar_fila"
  | "sair_fila"
  | "solicitar_vaga";

export async function executarAcaoPresenca(
  atleta: Atleta,
  eventoId: string,
  action: PresencaAction,
): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  const { data: evento } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", eventoId)
    .eq("tipo", "treino")
    .single();

  if (!evento) return { error: "Treino não encontrado." };

  const ev = evento as Evento;
  const diaSemana = diaSemanaFromData(ev.data);

  if (!diasVisiveisParaAtleta(atleta.modalidade).includes(diaSemana)) {
    return { error: "Treino não disponível para sua modalidade." };
  }

  const { data: presenca } = await supabase
    .from("presencas")
    .select("*")
    .eq("evento_id", eventoId)
    .eq("atleta_id", atleta.id)
    .maybeSingle();

  const p = presenca as Presenca | null;

  if (atleta.modalidade !== "A" && atleta.modalidade_status !== "aprovado") {
    return { error: "Sua modalidade ainda não foi aprovada." };
  }

  if (action === "confirmar") {
    if (!p || p.status !== "reservado") {
      return { error: "Não há vaga reservada para confirmar." };
    }
    await supabase
      .from("presencas")
      .update({ status: "confirmado", confirmado_em: new Date().toISOString() })
      .eq("id", p.id);
    return {};
  }

  if (action === "cancelar") {
    if (!p || !["reservado", "confirmado"].includes(p.status)) {
      return { error: "Não há presença ativa para cancelar." };
    }
    await supabase
      .from("presencas")
      .update({ status: "liberado", confirmado_em: null, posicao_fila: null })
      .eq("id", p.id);
    await promoteWaitlist(eventoId, ev.capacidade);
    return {};
  }

  if (action === "entrar_fila") {
    if (atleta.modalidade !== "A") {
      return { error: "Apenas avulsos entram na fila de espera." };
    }
    if (p && p.status !== "liberado") {
      return { error: "Você já está inscrito neste treino." };
    }
    const { data: fila } = await supabase
      .from("presencas")
      .select("posicao_fila")
      .eq("evento_id", eventoId)
      .eq("status", "fila_espera")
      .order("posicao_fila", { ascending: false })
      .limit(1);

    const proximaPos = (fila?.[0]?.posicao_fila ?? 0) + 1;

    if (p) {
      await supabase
        .from("presencas")
        .update({ status: "fila_espera", posicao_fila: proximaPos })
        .eq("id", p.id);
    } else {
      await supabase.from("presencas").insert({
        evento_id: eventoId,
        atleta_id: atleta.id,
        status: "fila_espera",
        posicao_fila: proximaPos,
      });
    }
    return {};
  }

  if (action === "sair_fila") {
    if (!p || p.status !== "fila_espera") {
      return { error: "Você não está na fila de espera." };
    }
    await supabase
      .from("presencas")
      .update({ status: "liberado", posicao_fila: null })
      .eq("id", p.id);
    await renumberWaitlist(eventoId);
    return {};
  }

  if (action === "solicitar_vaga") {
    if (atleta.modalidade !== "A") {
      return { error: "Apenas avulsos solicitam vaga avulsa." };
    }
    const ocupadas = await countVagasOcupadas(eventoId);
    if (ocupadas >= ev.capacidade) {
      return { error: "Não há vagas disponíveis. Entre na fila de espera." };
    }
    if (p && p.status !== "liberado") {
      return { error: "Você já está inscrito neste treino." };
    }

    if (p) {
      await supabase
        .from("presencas")
        .update({
          status: "aguardando_pagamento",
          posicao_fila: null,
          confirmado_em: null,
        })
        .eq("id", p.id);
    } else {
      await supabase.from("presencas").insert({
        evento_id: eventoId,
        atleta_id: atleta.id,
        status: "aguardando_pagamento",
      });
    }
    return {};
  }

  return { error: "Ação inválida." };
}

export async function getTreinosAdmin(): Promise<TreinoComPresenca[]> {
  await gerarTreinosSemana();

  const supabase = createAdminClient();
  const { hoje, fimSemana } = getIntervaloSemanaAtual();

  const { data: eventos } = await supabase
    .from("eventos")
    .select("*")
    .eq("tipo", "treino")
    .gte("data", hoje)
    .lte("data", fimSemana)
    .order("data", { ascending: true })
    .order("hora_inicio", { ascending: true });

  const filtrados = dedupeEventos((eventos ?? []) as Evento[]);
  if (!filtrados.length) return [];

  const eventoIds = filtrados.map((e) => e.id);
  const { data: ocupadas } = await supabase
    .from("presencas")
    .select("evento_id")
    .in("evento_id", eventoIds)
    .in("status", STATUS_OCUPA_VAGA);

  const ocupadasMap = new Map<string, number>();
  for (const row of ocupadas ?? []) {
    ocupadasMap.set(row.evento_id, (ocupadasMap.get(row.evento_id) ?? 0) + 1);
  }

  return filtrados.map((evento) => ({
    ...evento,
    presenca: null,
    vagas_ocupadas: ocupadasMap.get(evento.id) ?? 0,
  }));
}

export async function getParticipantesEvento(
  eventoId: string,
): Promise<ParticipanteTreino[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("presencas")
    .select(
      "id, atleta_id, status, posicao_fila, confirmado_em, atletas(nome, modalidade)",
    )
    .eq("evento_id", eventoId)
    .neq("status", "liberado")
    .order("status", { ascending: true })
    .order("posicao_fila", { ascending: true, nullsFirst: false });

  const statusOrder: Record<StatusPresenca, number> = {
    confirmado: 0,
    reservado: 1,
    aguardando_pagamento: 2,
    fila_espera: 3,
    liberado: 4,
  };

  type Row = {
    id: string;
    atleta_id: string;
    status: StatusPresenca;
    posicao_fila: number | null;
    confirmado_em: string | null;
    atletas: { nome: string; modalidade: Modalidade } | { nome: string; modalidade: Modalidade }[] | null;
  };

  return ((data ?? []) as Row[])
    .map((row) => {
      const atleta = Array.isArray(row.atletas) ? row.atletas[0] : row.atletas;
      if (!atleta) return null;
      return {
        presenca_id: row.id,
        atleta_id: row.atleta_id,
        nome: atleta.nome,
        modalidade: atleta.modalidade,
        status: row.status,
        posicao_fila: row.posicao_fila,
        confirmado_em: row.confirmado_em,
      };
    })
    .filter((row): row is ParticipanteTreino => row !== null)
    .sort((a, b) => {
      const sa = statusOrder[a.status] ?? 9;
      const sb = statusOrder[b.status] ?? 9;
      if (sa !== sb) return sa - sb;
      if (a.status === "fila_espera" && b.status === "fila_espera") {
        return (a.posicao_fila ?? 0) - (b.posicao_fila ?? 0);
      }
      return a.nome.localeCompare(b.nome, "pt-BR");
    });
}

export type AdminPresencaAction =
  | "confirmar_pagamento"
  | "rejeitar_pagamento"
  | "subir_fila";

export async function executarAcaoAdminPresenca(
  presencaId: string,
  action: AdminPresencaAction,
): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  const { data: presenca } = await supabase
    .from("presencas")
    .select("*, eventos(capacidade)")
    .eq("id", presencaId)
    .single();

  if (!presenca) return { error: "Presença não encontrada." };

  const p = presenca as Presenca & { eventos: { capacidade: number } };
  const capacidade = p.eventos.capacidade;

  if (action === "confirmar_pagamento") {
    if (p.status !== "aguardando_pagamento") {
      return { error: "Atleta não está aguardando pagamento." };
    }
    const ocupadas = await countVagasOcupadas(p.evento_id);
    if (ocupadas >= capacidade) {
      return { error: "Treino lotado. Rejeite alguém ou libere uma vaga primeiro." };
    }
    await supabase
      .from("presencas")
      .update({
        status: "confirmado",
        confirmado_em: new Date().toISOString(),
        posicao_fila: null,
      })
      .eq("id", presencaId);
    return {};
  }

  if (action === "rejeitar_pagamento") {
    if (p.status !== "aguardando_pagamento") {
      return { error: "Atleta não está aguardando pagamento." };
    }
    await supabase
      .from("presencas")
      .update({ status: "liberado", posicao_fila: null, confirmado_em: null })
      .eq("id", presencaId);
    await promoteWaitlist(p.evento_id, capacidade);
    return {};
  }

  if (action === "subir_fila") {
    if (p.status !== "fila_espera") {
      return { error: "Atleta não está na fila de espera." };
    }
    const ocupadas = await countVagasOcupadas(p.evento_id);
    if (ocupadas >= capacidade) {
      return { error: "Não há vagas disponíveis." };
    }

    const { data: atleta } = await supabase
      .from("atletas")
      .select("modalidade")
      .eq("id", p.atleta_id)
      .single();

    const newStatus: StatusPresenca =
      atleta?.modalidade === "A" ? "aguardando_pagamento" : "reservado";

    await supabase
      .from("presencas")
      .update({ status: newStatus, posicao_fila: null, confirmado_em: null })
      .eq("id", presencaId);

    await renumberWaitlist(p.evento_id);
    return {};
  }

  return { error: "Ação inválida." };
}
