export type ConviteStatus = "disponivel" | "used" | "expirado";

export function getConviteStatus(convite: {
  used: boolean;
  expires_at: string | null;
}): ConviteStatus {
  if (convite.used) return "used";
  if (convite.expires_at && new Date(convite.expires_at) < new Date()) {
    return "expirado";
  }
  return "disponivel";
}

export const CONVITE_STATUS_LABEL: Record<ConviteStatus, string> = {
  disponivel: "Disponível",
  used: "Usado",
  expirado: "Expirado",
};

export const CONVITE_STATUS_BADGE: Record<ConviteStatus, string> = {
  disponivel: "bg-green-100 text-green-800",
  used: "bg-gray-100 text-gray-600",
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
