import { formatTrainingDate, formatTime } from "./treinos";
import type { Event, CallUpStatus, EventStatus, EventType } from "./types";

export const TIPO_JOGO_LABEL: Record<"game" | "friendly", string> = {
  game: "Competição",
  friendly: "Amistoso",
};

export const CONVOCACAO_STATUS_LABEL: Record<CallUpStatus, string> = {
  pending: "Aguardando resposta",
  accepted: "Confirmado",
  declined: "Recusado",
};

export const CONVOCACAO_STATUS_BADGE: Record<CallUpStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-700",
};

export const EVENT_STATUS_LABEL: Record<EventStatus, string> = {
  scheduled: "Agendado",
  canceled: "Cancelado",
};

export const EVENT_STATUS_BADGE: Record<EventStatus, string> = {
  scheduled: "bg-green-50 text-green-800",
  canceled: "bg-red-50 text-red-700",
};

export function isJogoOuAmistoso(type: EventType) {
  return type === "game" || type === "friendly";
}

export function formatJogoTitulo(event: Pick<Event, "type" | "opponent">) {
  const type = TIPO_JOGO_LABEL[event.type as "game" | "friendly"] ?? event.type;
  if (event.opponent?.trim()) {
    return `${type} vs ${event.opponent.trim()}`;
  }
  return type;
}

export function formatJogoResumo(event: Event) {
  const linhas = [
    formatTrainingDate(event.date),
    `${formatTime(event.start_time)} – ${formatTime(event.end_time)}`,
  ];
  if (event.location?.trim()) linhas.push(event.location.trim());
  if (event.opponent?.trim()) linhas.push(`Adversário: ${event.opponent.trim()}`);
  return linhas.join("\n");
}

export function buildCallUpFeed(event: Event) {
  const title = `Convocação: ${formatJogoTitulo(event)}`;
  const body = `${formatJogoResumo(event)}\n\nConfirme se você pode jogar.`;
  return { title, body };
}

export function buildGameChangedFeed(event: Event) {
  return {
    title: `Jogo remarcado: ${formatJogoTitulo(event)}`,
    body: `${formatJogoResumo(event)}\n\nConfira a nova data, horário e local do evento.`,
  };
}

export function buildGameCanceledFeed(event: Event) {
  return {
    title: `Jogo cancelado: ${formatJogoTitulo(event)}`,
    body: `${formatJogoResumo(event)}\n\nEste evento foi cancelado pelo administrador.`,
  };
}
