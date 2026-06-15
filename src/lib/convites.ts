export type ConviteStatus = "disponivel" | "usado" | "expirado";

export function getConviteStatus(convite: {
  usado: boolean;
  expira_em: string | null;
}): ConviteStatus {
  if (convite.usado) return "usado";
  if (convite.expira_em && new Date(convite.expira_em) < new Date()) {
    return "expirado";
  }
  return "disponivel";
}

export const CONVITE_STATUS_LABEL: Record<ConviteStatus, string> = {
  disponivel: "Disponível",
  usado: "Usado",
  expirado: "Expirado",
};

export const CONVITE_STATUS_BADGE: Record<ConviteStatus, string> = {
  disponivel: "bg-green-100 text-green-800",
  usado: "bg-gray-100 text-gray-600",
  expirado: "bg-red-100 text-red-700",
};

export function conviteCadastroUrl(token: string, appUrl: string) {
  return `${appUrl}/cadastro/${token}`;
}

export function formatConviteDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const TOKEN_PATTERN = /^[a-zA-Z0-9_-]{3,40}$/;
