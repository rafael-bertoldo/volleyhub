import { formatDataTreino, formatHora } from "./treinos";
import type { Evento, StatusConvocacao, TipoEvento } from "./types";

export const TIPO_JOGO_LABEL: Record<"jogo" | "amistoso", string> = {
  jogo: "Competição",
  amistoso: "Amistoso",
};

export const CONVOCACAO_STATUS_LABEL: Record<StatusConvocacao, string> = {
  pendente: "Aguardando resposta",
  aceito: "Confirmado",
  recusado: "Recusado",
};

export const CONVOCACAO_STATUS_BADGE: Record<StatusConvocacao, string> = {
  pendente: "bg-amber-100 text-amber-800",
  aceito: "bg-green-100 text-green-800",
  recusado: "bg-red-100 text-red-700",
};

export function isJogoOuAmistoso(tipo: TipoEvento) {
  return tipo === "jogo" || tipo === "amistoso";
}

export function formatJogoTitulo(evento: Pick<Evento, "tipo" | "adversario">) {
  const tipo = TIPO_JOGO_LABEL[evento.tipo as "jogo" | "amistoso"] ?? evento.tipo;
  if (evento.adversario?.trim()) {
    return `${tipo} vs ${evento.adversario.trim()}`;
  }
  return tipo;
}

export function formatJogoResumo(evento: Evento) {
  const linhas = [
    formatDataTreino(evento.data),
    `${formatHora(evento.hora_inicio)} – ${formatHora(evento.hora_fim)}`,
  ];
  if (evento.local?.trim()) linhas.push(evento.local.trim());
  if (evento.adversario?.trim()) linhas.push(`Adversário: ${evento.adversario.trim()}`);
  return linhas.join("\n");
}

export function buildConvocacaoFeed(evento: Evento) {
  const titulo = `Convocação: ${formatJogoTitulo(evento)}`;
  const corpo = `${formatJogoResumo(evento)}\n\nConfirme se você pode jogar.`;
  return { titulo, corpo };
}
