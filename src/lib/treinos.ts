import { DIAS_POR_MODALIDADE } from "./constants";
import type { Modalidade, StatusPresenca } from "./types";

export const DIAS_SEMANA_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const DIAS_SEMANA_CURTO = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export const STATUS_OCUPA_VAGA: StatusPresenca[] = [
  "reservado",
  "confirmado",
  "aguardando_pagamento",
];

export const STATUS_PRESENCA_LABEL: Record<StatusPresenca, string> = {
  reservado: "Vaga reservada",
  confirmado: "Presença confirmada",
  liberado: "Vaga liberada",
  fila_espera: "Na fila de espera",
  aguardando_pagamento: "Aguardando pagamento",
};

export const STATUS_PRESENCA_BADGE: Record<StatusPresenca, string> = {
  reservado: "bg-blue-100 text-blue-800",
  confirmado: "bg-green-100 text-green-800",
  liberado: "bg-gray-100 text-gray-600",
  fila_espera: "bg-amber-100 text-amber-800",
  aguardando_pagamento: "bg-orange-100 text-orange-800",
};

export function formatHora(time: string) {
  return time.slice(0, 5);
}

export function normalizeHora(time: string) {
  const [h, m, s = "00"] = time.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0").slice(0, 2)}`;
}

export function eventoChave(data: string, horaInicio: string) {
  return `${data}|${normalizeHora(horaInicio)}`;
}

export function formatDataTreino(data: string) {
  const [y, m, d] = data.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const dia = DIAS_SEMANA_LABELS[date.getDay()];
  const dataFmt = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${dia}, ${dataFmt}`;
}

export function diaSemanaFromData(data: string) {
  const [y, m, d] = data.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function modalidadesParaDia(diaSemana: number): Modalidade[] {
  return (["ON", "MF", "MR", "MP"] as Modalidade[]).filter((m) =>
    DIAS_POR_MODALIDADE[m].includes(diaSemana),
  );
}

export function atletaPodeParticipar(
  modalidade: Modalidade,
  modalidadeStatus: string,
  diaSemana: number,
): boolean {
  if (modalidade === "A") return true;
  if (modalidadeStatus !== "aprovado") return false;
  return DIAS_POR_MODALIDADE[modalidade].includes(diaSemana);
}

export function diasVisiveisParaAtleta(modalidade: Modalidade): number[] {
  if (modalidade === "A") return [2, 4, 5];
  return DIAS_POR_MODALIDADE[modalidade];
}

export function formatIntervaloConfirmacao(abre: string | null, fecha: string | null) {
  if (!abre || !fecha) return null;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  return `${fmt(abre)} até ${fmt(fecha)}`;
}

export function confirmacaoAberta(
  abre: string | null,
  fecha: string | null,
  agora = new Date(),
) {
  if (!abre || !fecha) return true;
  const t = agora.getTime();
  return t >= new Date(abre).getTime() && t <= new Date(fecha).getTime();
}

export function confirmacaoAindaNaoAbriu(abre: string | null, agora = new Date()) {
  if (!abre) return false;
  return agora.getTime() < new Date(abre).getTime();
}

export function confirmacaoEncerrada(fecha: string | null, agora = new Date()) {
  if (!fecha) return false;
  return agora.getTime() > new Date(fecha).getTime();
}

export function toDateString(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function addDays(date: Date, days: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Segunda-feira 00:00 da semana da data informada */
export function getMondayOfWeek(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return d;
}

export function getSundayOfWeek(monday: Date) {
  return addDays(monday, 6);
}

export function getIntervaloSemanaAtual(ref = new Date()) {
  const monday = getMondayOfWeek(ref);
  const sunday = getSundayOfWeek(monday);
  const hoje = new Date(ref);
  hoje.setHours(0, 0, 0, 0);
  return {
    inicioSemana: toDateString(monday),
    fimSemana: toDateString(sunday),
    hoje: toDateString(hoje),
  };
}

export function combineDateTime(data: string, hora: string) {
  const h = formatHora(hora);
  return new Date(`${data}T${h}:00`);
}
