import { createAdminClient } from "@/lib/supabase/admin";
import {
  broadcastConvocacaoUpdate,
  broadcastFeedDeletedToAtleta,
  broadcastFeedToAtleta,
  broadcastJogoConvocacaoUpdate,
} from "@/lib/realtime/broadcast-server";
import { buildConvocacaoFeed } from "@/lib/jogos";
import { normalizeHora } from "@/lib/treinos";
import type {
  Atleta,
  AtletaElegivel,
  ConvocacaoComAtleta,
  ConvocacaoStats,
  Evento,
  FeedItem,
  JogoComConvocacoes,
  Modalidade,
} from "@/lib/types";

export interface CriarJogoInput {
  tipo: "jogo" | "amistoso";
  data: string;
  hora_inicio: string;
  hora_fim: string;
  local: string;
  adversario: string;
  capacidade: number;
  observacoes?: string;
}

function calcStats(convocacoes: ConvocacaoComAtleta[]): ConvocacaoStats {
  return {
    total: convocacoes.length,
    pendentes: convocacoes.filter((c) => c.status === "pendente").length,
    aceitos: convocacoes.filter((c) => c.status === "aceito").length,
    recusados: convocacoes.filter((c) => c.status === "recusado").length,
  };
}

export async function criarJogo(input: CriarJogoInput): Promise<Evento> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("eventos")
    .insert({
      tipo: input.tipo,
      data: input.data,
      hora_inicio: normalizeHora(input.hora_inicio),
      hora_fim: normalizeHora(input.hora_fim),
      local: input.local.trim(),
      adversario: input.adversario.trim(),
      capacidade: input.capacidade,
      observacoes: input.observacoes?.trim() ?? "",
      origem: "manual",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("Erro ao criar evento.");
  }

  return data as Evento;
}

export async function getJogosAdmin(): Promise<JogoComConvocacoes[]> {
  const supabase = createAdminClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data: eventos } = await supabase
    .from("eventos")
    .select("*")
    .in("tipo", ["jogo", "amistoso"])
    .gte("data", hoje)
    .order("data", { ascending: true })
    .order("hora_inicio", { ascending: true });

  if (!eventos?.length) return [];

  const eventoIds = eventos.map((e) => e.id);
  const { data: convocacoes } = await supabase
    .from("convocacoes")
    .select("*, atletas(id, nome, modalidade)")
    .in("evento_id", eventoIds);

  const porEvento = new Map<string, ConvocacaoComAtleta[]>();
  for (const row of convocacoes ?? []) {
    const atleta = Array.isArray(row.atletas) ? row.atletas[0] : row.atletas;
    if (!atleta) continue;
    const lista = porEvento.get(row.evento_id) ?? [];
    lista.push({
      id: row.id,
      evento_id: row.evento_id,
      atleta_id: row.atleta_id,
      status: row.status,
      mensagem: row.mensagem,
      convocado_em: row.convocado_em,
      respondido_em: row.respondido_em,
      atleta,
    });
    porEvento.set(row.evento_id, lista);
  }

  return (eventos as Evento[]).map((evento) => {
    const convs = porEvento.get(evento.id) ?? [];
    return {
      ...evento,
      convocacoes: convs,
      stats: calcStats(convs),
    };
  });
}

export async function getAtletasElegiveis(
  eventoId: string,
): Promise<{ mensalistas: AtletaElegivel[]; avulsos: AtletaElegivel[]; capacidade: number }> {
  const supabase = createAdminClient();

  const { data: evento } = await supabase
    .from("eventos")
    .select("capacidade")
    .eq("id", eventoId)
    .in("tipo", ["jogo", "amistoso"])
    .single();

  if (!evento) {
    throw new Error("Evento não encontrado.");
  }

  const [{ data: atletas }, { data: convocados }] = await Promise.all([
    supabase
      .from("atletas")
      .select("id, nome, modalidade, modalidade_status, interesse_competicoes")
      .eq("ativo", true)
      .eq("interesse_competicoes", "sim"),
    supabase
      .from("convocacoes")
      .select("atleta_id")
      .eq("evento_id", eventoId),
  ]);

  const jaConvocados = new Set((convocados ?? []).map((c) => c.atleta_id));

  const mensalistas: AtletaElegivel[] = [];
  const avulsos: AtletaElegivel[] = [];

  for (const a of atletas ?? []) {
    const base = {
      id: a.id,
      nome: a.nome,
      modalidade: a.modalidade as Modalidade,
      ja_convocado: jaConvocados.has(a.id),
    };

    if (a.modalidade === "A") {
      avulsos.push({ ...base, grupo: "avulso" });
    } else if (a.modalidade_status === "aprovado") {
      mensalistas.push({ ...base, grupo: "mensalista" });
    }
  }

  mensalistas.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));
  avulsos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

  return {
    mensalistas,
    avulsos,
    capacidade: evento.capacidade,
  };
}

export async function convocarAtletas(
  eventoId: string,
  atletaIds: string[],
): Promise<{ error?: string; convocados?: number }> {
  if (!atletaIds.length) {
    return { error: "Selecione ao menos um atleta." };
  }

  const supabase = createAdminClient();

  const { data: evento } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", eventoId)
    .in("tipo", ["jogo", "amistoso"])
    .single();

  if (!evento) return { error: "Evento não encontrado." };

  const ev = evento as Evento;
  const elegiveis = await getAtletasElegiveis(eventoId);
  const elegivelIds = new Set([
    ...elegiveis.mensalistas.map((a) => a.id),
    ...elegiveis.avulsos.map((a) => a.id),
  ]);

  const ids = [...new Set(atletaIds)];
  if (ids.some((id) => !elegivelIds.has(id))) {
    return { error: "Um ou mais atletas não são elegíveis." };
  }

  const { data: atletas } = await supabase
    .from("atletas")
    .select("id, modalidade")
    .in("id", ids);

  const mensalistasSel = (atletas ?? []).filter((a) => a.modalidade !== "A");
  const avulsosSel = (atletas ?? []).filter((a) => a.modalidade === "A");

  if (ids.length > ev.capacidade) {
    return { error: `Máximo de ${ev.capacidade} convocados para este evento.` };
  }

  const vagasParaAvulsos = Math.max(0, ev.capacidade - elegiveis.mensalistas.length);
  if (avulsosSel.length > 0 && elegiveis.mensalistas.length >= ev.capacidade) {
    return {
      error:
        "Mensalistas com interesse preenchem todas as vagas. Avulsos não podem ser convocados.",
    };
  }
  if (avulsosSel.length > vagasParaAvulsos) {
    return {
      error: `No máximo ${vagasParaAvulsos} avulso(s) podem ser convocados neste evento.`,
    };
  }

  const { titulo, corpo } = buildConvocacaoFeed(ev);
  let convocados = 0;

  for (const atletaId of ids) {
    const { data: existente } = await supabase
      .from("convocacoes")
      .select("id")
      .eq("evento_id", eventoId)
      .eq("atleta_id", atletaId)
      .maybeSingle();

    if (existente) continue;

    const { error: convError } = await supabase.from("convocacoes").insert({
      evento_id: eventoId,
      atleta_id: atletaId,
      status: "pendente",
    });

    if (convError) continue;

    const { data: feedItem, error: feedError } = await supabase
      .from("feed")
      .insert({
        tipo: "convocacao",
        atleta_id: atletaId,
        evento_id: eventoId,
        titulo,
        corpo,
      })
      .select()
      .single();

    if (!feedError && feedItem) {
      await broadcastFeedToAtleta(atletaId, feedItem as FeedItem);
    }

    await broadcastConvocacaoUpdate(atletaId, { evento_id: eventoId });
    await broadcastJogoConvocacaoUpdate(eventoId, { evento_id: eventoId, atleta_id: atletaId });
    convocados++;
  }

  return { convocados };
}

export async function responderConvocacao(
  atleta: Atleta,
  eventoId: string,
  resposta: "aceito" | "recusado",
): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  const { data: convocacao } = await supabase
    .from("convocacoes")
    .select("*")
    .eq("evento_id", eventoId)
    .eq("atleta_id", atleta.id)
    .single();

  if (!convocacao) {
    return { error: "Convocação não encontrada." };
  }

  if (convocacao.status !== "pendente") {
    return { error: "Esta convocação já foi respondida." };
  }

  await supabase
    .from("convocacoes")
    .update({
      status: resposta,
      respondido_em: new Date().toISOString(),
    })
    .eq("id", convocacao.id);

  await supabase
    .from("feed")
    .update({ lido: true })
    .eq("atleta_id", atleta.id)
    .eq("evento_id", eventoId)
    .eq("tipo", "convocacao");

  await broadcastConvocacaoUpdate(atleta.id, {
    evento_id: eventoId,
    status: resposta,
  });
  await broadcastJogoConvocacaoUpdate(eventoId, {
    evento_id: eventoId,
    atleta_id: atleta.id,
    status: resposta,
  });

  return {};
}

export async function removerConvocacao(
  convocacaoId: string,
): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  const { data: convocacao } = await supabase
    .from("convocacoes")
    .select("id, evento_id, atleta_id, eventos(tipo)")
    .eq("id", convocacaoId)
    .single();

  if (!convocacao) {
    return { error: "Convocação não encontrada." };
  }

  const evento = Array.isArray(convocacao.eventos)
    ? convocacao.eventos[0]
    : convocacao.eventos;

  if (!evento || !["jogo", "amistoso"].includes(evento.tipo)) {
    return { error: "Convocação inválida." };
  }

  const { error } = await supabase.from("convocacoes").delete().eq("id", convocacaoId);

  if (error) {
    return { error: "Erro ao remover convocação." };
  }

  const { data: feedItems } = await supabase
    .from("feed")
    .select("id")
    .eq("atleta_id", convocacao.atleta_id)
    .eq("evento_id", convocacao.evento_id)
    .eq("tipo", "convocacao");

  for (const feedItem of feedItems ?? []) {
    await supabase.from("feed").delete().eq("id", feedItem.id);
    await broadcastFeedDeletedToAtleta(convocacao.atleta_id, feedItem.id);
  }

  await broadcastConvocacaoUpdate(convocacao.atleta_id, {
    evento_id: convocacao.evento_id,
    removed: true,
  });
  await broadcastJogoConvocacaoUpdate(convocacao.evento_id, {
    evento_id: convocacao.evento_id,
    atleta_id: convocacao.atleta_id,
    removed: true,
  });

  return {};
}

export async function getJogosAceitosAtleta(atletaId: string) {
  const supabase = createAdminClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("convocacoes")
    .select("*, eventos(*)")
    .eq("atleta_id", atletaId)
    .eq("status", "aceito");

  return ((data ?? []) as Array<{
    id: string;
    status: string;
    eventos: Evento | Evento[] | null;
  }>)
    .map((row) => {
      const evento = Array.isArray(row.eventos) ? row.eventos[0] : row.eventos;
      return evento;
    })
    .filter((e): e is Evento => !!e && e.data >= hoje)
    .sort((a, b) => {
      const cmp = a.data.localeCompare(b.data);
      if (cmp !== 0) return cmp;
      return a.hora_inicio.localeCompare(b.hora_inicio);
    });
}

export async function countJogosAceitosAtleta(atletaId: string) {
  const jogos = await getJogosAceitosAtleta(atletaId);
  return jogos.length;
}

export async function getConvocacaoStatusPorEvento(
  atletaId: string,
  eventoIds: string[],
): Promise<Map<string, string>> {
  if (!eventoIds.length) return new Map();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("convocacoes")
    .select("evento_id, status")
    .eq("atleta_id", atletaId)
    .in("evento_id", eventoIds);

  return new Map((data ?? []).map((c) => [c.evento_id, c.status]));
}
