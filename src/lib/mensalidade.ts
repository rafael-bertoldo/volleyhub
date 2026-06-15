import type { Atleta } from "./types";

/** Dia do mês até o qual a mensalidade do mês anterior ainda vale. */
export const MENSALIDADE_DIA_LIMITE = 10;

export type MensalidadeStatus = "em_dia" | "pendente" | "atrasada" | "nao_aplica";

export const MENSALIDADE_STATUS_LABEL: Record<
  Exclude<MensalidadeStatus, "nao_aplica">,
  string
> = {
  em_dia: "Em dia",
  pendente: "Pendente",
  atrasada: "Atrasada",
};

export const MENSALIDADE_STATUS_BADGE: Record<
  Exclude<MensalidadeStatus, "nao_aplica">,
  string
> = {
  em_dia: "bg-green-100 text-green-800",
  pendente: "bg-amber-100 text-amber-800",
  atrasada: "bg-red-100 text-red-800",
};

export function isMensalista(
  atleta: Pick<Atleta, "modalidade" | "modalidade_status">,
): boolean {
  return atleta.modalidade !== "A" && atleta.modalidade_status === "aprovado";
}

function mesReferencia(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

function mesAnterior(ref: string): string {
  const [y, m] = ref.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return mesReferencia(d);
}

/** Primeiro dia do mês atual (YYYY-MM-01) para gravar no banco. */
export function getMensalidadeMesAtual(): string {
  const hoje = new Date();
  const y = hoje.getFullYear();
  const m = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function formatMensalidadeMes(mes: string | null): string {
  if (!mes) return "—";
  const [y, m] = mes.slice(0, 10).split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

/**
 * Regra: mensalidade do mês M cobre M; até o dia 10 de M+1 ainda vale a de M.
 */
export function getMensalidadeStatus(
  mensalidadeMes: string | null,
  hoje = new Date(),
): MensalidadeStatus {
  const dia = hoje.getDate();
  const mesAtual = mesReferencia(hoje);
  const mesAnt = mesAnterior(mesAtual);

  if (!mensalidadeMes) {
    return dia <= MENSALIDADE_DIA_LIMITE ? "pendente" : "atrasada";
  }

  const pagoMes = mensalidadeMes.slice(0, 7);

  if (pagoMes === mesAtual) return "em_dia";
  if (dia <= MENSALIDADE_DIA_LIMITE && pagoMes === mesAnt) return "em_dia";

  return "atrasada";
}

export function getMensalidadeStatusAtleta(
  atleta: Pick<Atleta, "modalidade" | "modalidade_status" | "mensalidade_mes">,
): MensalidadeStatus {
  if (!isMensalista(atleta)) return "nao_aplica";
  return getMensalidadeStatus(atleta.mensalidade_mes);
}
