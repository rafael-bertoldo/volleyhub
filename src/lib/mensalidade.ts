import type { Player } from "./types";

/** Dia do mês até o qual a mensalidade do mês anterior ainda vale. */
export const MEMBERSHIP_FEE_DUE_DAY = 10;

export type MembershipFeeStatus = "em_dia" | "pending" | "atrasada" | "nao_aplica";

export const MEMBERSHIP_FEE_STATUS_LABEL: Record<
  Exclude<MembershipFeeStatus, "nao_aplica">,
  string
> = {
  em_dia: "Em dia",
  pending: "Pendente",
  atrasada: "Atrasada",
};

export const MEMBERSHIP_FEE_STATUS_BADGE: Record<
  Exclude<MembershipFeeStatus, "nao_aplica">,
  string
> = {
  em_dia: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  atrasada: "bg-red-100 text-red-800",
};

export function isMember(
  player: Pick<Player, "membership_type" | "membership_status">,
): boolean {
  return player.membership_type !== "A" && player.membership_status === "approved";
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
export function getCurrentMembershipFeeMonth(): string {
  const hoje = new Date();
  const y = hoje.getFullYear();
  const m = String(hoje.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}-01`;
}

export function formatMembershipFeeMonth(mes: string | null): string {
  if (!mes) return "—";
  const [y, m] = mes.slice(0, 10).split("-");
  const date = new Date(Number(y), Number(m) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "short", year: "numeric" });
}

/**
 * Regra: mensalidade do mês M cobre M; até o dia 10 de M+1 ainda vale a de M.
 */
export function getMembershipFeeStatus(
  mensalidadeMes: string | null,
  hoje = new Date(),
): MembershipFeeStatus {
  const dia = hoje.getDate();
  const mesAtual = mesReferencia(hoje);
  const mesAnt = mesAnterior(mesAtual);

  if (!mensalidadeMes) {
    return dia <= MEMBERSHIP_FEE_DUE_DAY ? "pending" : "atrasada";
  }

  const pagoMes = mensalidadeMes.slice(0, 7);

  if (pagoMes === mesAtual) return "em_dia";
  if (dia <= MEMBERSHIP_FEE_DUE_DAY && pagoMes === mesAnt) return "em_dia";

  return "atrasada";
}

export function getMembershipFeeStatusPlayer(
  player: Pick<Player, "membership_type" | "membership_status" | "membership_fee_month">,
): MembershipFeeStatus {
  if (!isMember(player)) return "nao_aplica";
  return getMembershipFeeStatus(player.membership_fee_month);
}
