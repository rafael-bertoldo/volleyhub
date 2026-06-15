import type { Modalidade } from "./types";

export const APP_NAME = "Roxinhos";

export const ATHLETE_COOKIE_NAME = "roxinhos_atleta_token";
export const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 400; // ~400 dias (máximo prático dos browsers)

export const MODALIDADES: {
  value: Modalidade;
  label: string;
  descricao: string;
  requerAprovacao: boolean;
}[] = [
  {
    value: "ON",
    label: "ON",
    descricao: "Mensalista terças e quintas",
    requerAprovacao: true,
  },
  {
    value: "MF",
    label: "MF",
    descricao: "Mensalista funcional — terças-feiras",
    requerAprovacao: true,
  },
  {
    value: "MR",
    label: "MR",
    descricao: "Mensalista recreativo — quintas-feiras",
    requerAprovacao: true,
  },
  {
    value: "MP",
    label: "MP",
    descricao: "Mensalista play — sextas-feiras",
    requerAprovacao: true,
  },
  {
    value: "A",
    label: "A",
    descricao: "Avulso",
    requerAprovacao: false,
  },
];

export const MODALIDADE_LABELS: Record<Modalidade, string> = {
  ON: "ON — Terças e quintas",
  MF: "MF — Funcional (terças)",
  MR: "MR — Recreativo (quintas)",
  MP: "MP — Play (sextas)",
  A: "Avulso",
};

export const DIAS_POR_MODALIDADE: Record<Modalidade, number[]> = {
  ON: [2, 4],
  MF: [2],
  MR: [4],
  MP: [5],
  A: [],
};
