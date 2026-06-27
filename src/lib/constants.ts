import type { MembershipType, PreferredPosition } from "./types";

export const APP_NAME = "VolleyHub";

export const MEMBERSHIP_TYPES: {
  value: MembershipType;
  label: string;
  description: string;
  requiresApproval: boolean;
}[] = [
  {
    value: "ON",
    label: "ON",
    description: "Mensalista terças e quintas",
    requiresApproval: true,
  },
  {
    value: "MF",
    label: "MF",
    description: "Mensalista funcional — terças-feiras",
    requiresApproval: true,
  },
  {
    value: "MR",
    label: "MR",
    description: "Mensalista recreativo — quintas-feiras",
    requiresApproval: true,
  },
  {
    value: "MP",
    label: "MP",
    description: "Mensalista play — sextas-feiras",
    requiresApproval: true,
  },
  {
    value: "A",
    label: "A",
    description: "Avulso",
    requiresApproval: false,
  },
];

export const MEMBERSHIP_TYPE_LABELS: Record<MembershipType, string> = {
  ON: "ON — Terças e quintas",
  MF: "MF — Funcional (terças)",
  MR: "MR — Recreativo (quintas)",
  MP: "MP — Play (sextas)",
  A: "Avulso",
};

export const WEEKDAYS_BY_MEMBERSHIP: Record<MembershipType, number[]> = {
  ON: [2, 4],
  MF: [2],
  MR: [4],
  MP: [5],
  A: [],
};

export const POSITIONS: { value: PreferredPosition; label: string }[] = [
  { value: "setter", label: "Levantador" },
  { value: "outside_hitter", label: "Ponteiro" },
  { value: "opposite", label: "Oposto" },
  { value: "middle_blocker", label: "Central" },
  { value: "libero", label: "Líbero" },
];

export const POSITION_LABELS: Record<PreferredPosition, string> = {
  setter: "Levantador",
  outside_hitter: "Ponteiro",
  opposite: "Oposto",
  middle_blocker: "Central",
  libero: "Líbero",
};
