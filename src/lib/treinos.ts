import { WEEKDAYS_BY_MEMBERSHIP } from "./constants";
import type { MembershipType, AttendanceStatus } from "./types";

export const WEEKDAY_LABELS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const SHORT_WEEKDAY_LABELS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"] as const;

export const ATTENDANCE_OCCUPIES_SPOT: AttendanceStatus[] = [
  "reserved",
  "confirmed",
  "pending_payment",
];

export const ATTENDANCE_STATUS_LABEL: Record<AttendanceStatus, string> = {
  reserved: "Vaga reservada",
  confirmed: "Presença confirmada",
  released: "Vaga liberada",
  waitlist: "Na fila de espera",
  pending_payment: "Aguardando pagamento",
};

export const ATTENDANCE_STATUS_BADGE: Record<AttendanceStatus, string> = {
  reserved: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  released: "bg-gray-100 text-gray-600",
  waitlist: "bg-amber-100 text-amber-800",
  pending_payment: "bg-orange-100 text-orange-800",
};

export function formatTime(time: string) {
  return time.slice(0, 5);
}

export function normalizeTime(time: string) {
  const [h, m, s = "00"] = time.split(":");
  return `${h.padStart(2, "0")}:${m.padStart(2, "0")}:${s.padStart(2, "0").slice(0, 2)}`;
}

export function eventKey(date: string, startTime: string) {
  return `${date}|${normalizeTime(startTime)}`;
}

export function formatTrainingDate(dateString: string) {
  const [y, m, d] = dateString.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  const weekday = WEEKDAY_LABELS[date.getDay()];
  const formattedDate = date.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });
  return `${weekday}, ${formattedDate}`;
}

export function weekdayFromDate(dateString: string) {
  const [y, m, d] = dateString.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function membershipTypesForWeekday(weekday: number): MembershipType[] {
  return (["ON", "MF", "MR", "MP"] as MembershipType[]).filter((m) =>
    WEEKDAYS_BY_MEMBERSHIP[m].includes(weekday),
  );
}

export function canPlayerAttend(
  membershipType: MembershipType,
  membershipStatus: string,
  weekday: number,
): boolean {
  if (membershipType === "A") return true;
  if (membershipStatus !== "approved") return false;
  return WEEKDAYS_BY_MEMBERSHIP[membershipType].includes(weekday);
}

export function visibleWeekdaysForPlayer(membershipType: MembershipType): number[] {
  if (membershipType === "A") return [2, 4, 5];
  return WEEKDAYS_BY_MEMBERSHIP[membershipType];
}

export function formatConfirmationWindow(opensAt: string | null, closesAt: string | null) {
  if (!opensAt || !closesAt) return null;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  return `${fmt(opensAt)} até ${fmt(closesAt)}`;
}

export function isConfirmationOpen(
  opensAt: string | null,
  closesAt: string | null,
  now = new Date(),
) {
  if (!opensAt || !closesAt) return true;
  const t = now.getTime();
  return t >= new Date(opensAt).getTime() && t <= new Date(closesAt).getTime();
}

export function confirmationHasNotOpened(opensAt: string | null, now = new Date()) {
  if (!opensAt) return false;
  return now.getTime() < new Date(opensAt).getTime();
}

export function confirmationClosed(closesAt: string | null, now = new Date()) {
  if (!closesAt) return false;
  return now.getTime() > new Date(closesAt).getTime();
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

/** Segunda-feira 00:00 da semana da date informada */
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

export function getCurrentWeekRange(ref = new Date()) {
  const monday = getMondayOfWeek(ref);
  const sunday = getSundayOfWeek(monday);
  const today = new Date(ref);
  today.setHours(0, 0, 0, 0);
  return {
    weekStart: toDateString(monday),
    weekEnd: toDateString(sunday),
    today: toDateString(today),
  };
}

export function getUpcomingWeeksRange(ref = new Date()) {
  const monday = getMondayOfWeek(ref);
  const nextSunday = getSundayOfWeek(addDays(monday, 7));
  const today = new Date(ref);
  today.setHours(0, 0, 0, 0);
  return {
    weekStart: toDateString(monday),
    weekEnd: toDateString(nextSunday),
    today: toDateString(today),
  };
}

export function combineDateTime(date: string, time: string) {
  const h = formatTime(time);
  return new Date(`${date}T${h}:00`);
}
