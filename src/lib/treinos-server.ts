import { createAdminClient } from "@/lib/supabase/admin";
import {
  addDays,
  combineDateTime,
  weekdayFromDate,
  visibleWeekdaysForPlayer,
  eventKey,
  getUpcomingWeeksRange,
  getMondayOfWeek,
  membershipTypesForWeekday,
  normalizeTime,
  ATTENDANCE_OCCUPIES_SPOT,
  toDateString,
} from "@/lib/treinos";
import type {
  Player,
  Event,
  MembershipType,
  Attendance,
  AttendanceStatus,
  TrainingWithAttendance,
} from "@/lib/types";

const CONFIRMATION_DAYS_BEFORE = 7;

export interface TrainingParticipant {
  attendance_id: string;
  player_id: string;
  name: string;
  nickname: string | null;
  membership_type: MembershipType;
  status: AttendanceStatus;
  waitlist_position: number | null;
  confirmed_at: string | null;
}

function dedupeEvents(events: Event[]): Event[] {
  const seen = new Map<string, Event>();
  for (const e of events) {
    const key = eventKey(e.date, e.start_time);
    const existing = seen.get(key);
    if (!existing || e.id < existing.id) {
      seen.set(key, e);
    }
  }
  return [...seen.values()].sort((a, b) => {
    const cmp = a.date.localeCompare(b.date);
    if (cmp !== 0) return cmp;
    return normalizeTime(a.start_time).localeCompare(normalizeTime(b.start_time));
  });
}

interface TreinoRecorrente {
  id: string;
  weekday: number;
  start_time: string;
  end_time: string;
  location: string;
  capacity: number;
  active: boolean;
}

export async function ensureEventsSemana(weekMonday?: Date) {
  const supabase = createAdminClient();
  const { data: recorrentes } = await supabase
    .from("recurring_trainings")
    .select("*")
    .eq("active", true);

  if (!recorrentes?.length) return;

  const monday = weekMonday ?? getMondayOfWeek(new Date());

  for (let offset = 0; offset < 7; offset++) {
    const dia = addDays(monday, offset);
    const diaSemana = dia.getDay();
    const date = toDateString(dia);

    for (const tr of recorrentes as TreinoRecorrente[]) {
      if (tr.weekday !== diaSemana) continue;

      const horaInicio = normalizeTime(tr.start_time);
      const horaFim = normalizeTime(tr.end_time);

      const { data: existingList } = await supabase
        .from("events")
        .select("id")
        .eq("type", "training")
        .eq("source", "recurring")
        .eq("date", date)
        .eq("start_time", horaInicio)
        .limit(1);

      if (existingList?.length) continue;

      const inicio = combineDateTime(date, horaInicio);
      const abre = addDays(inicio, -CONFIRMATION_DAYS_BEFORE);
      abre.setHours(0, 0, 0, 0);

      const { data: event, error } = await supabase
        .from("events")
        .insert({
          type: "training",
          date,
          start_time: horaInicio,
          end_time: horaFim,
          location: tr.location,
          capacity: tr.capacity,
          confirmation_opens_at: abre.toISOString(),
          confirmation_closes_at: inicio.toISOString(),
          source: "recurring",
        })
        .select()
        .single();

      if (error) {
        if (error.code === "23505") continue;
        console.error("Erro ao criar treino da semana:", error);
        continue;
      }

      if (!event) continue;
    }
  }
}

/** Gera treinos da semana atual e da próxima, garantindo reservas dos members. */
export async function generateWeeklyTrainings(weekMonday?: Date) {
  const monday = weekMonday ?? getMondayOfWeek(new Date());
  const weeks = [monday, addDays(monday, 7)];

  for (const week of weeks) {
    await ensureEventsSemana(week);
    await syncAllAttendancesReservadas(week);
  }
}

export async function syncAllAttendancesReservadas(weekMonday?: Date) {
  const monday = weekMonday ?? getMondayOfWeek(new Date());
  const weekEnd = toDateString(addDays(monday, 6));

  const supabase = createAdminClient();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("type", "training")
    .gte("date", toDateString(monday))
    .lte("date", weekEnd);

  for (const event of dedupeEvents((events ?? []) as Event[])) {
    await syncAttendancesReservadas(event);
  }
}

export async function syncAttendancesReservadas(event: Event) {
  const supabase = createAdminClient();
  const diaSemana = weekdayFromDate(event.date);
  const membership_types = membershipTypesForWeekday(diaSemana);

  if (!membership_types.length) return;

  const { data: players } = await supabase
    .from("players")
    .select("id, membership_type")
    .eq("active", true)
    .eq("membership_status", "approved")
    .in("membership_type", membership_types);

  if (!players?.length) return;

  const { data: existentes } = await supabase
    .from("attendances")
    .select("player_id")
    .eq("event_id", event.id);

  const jaTem = new Set((existentes ?? []).map((p) => p.player_id));
  const novos = players.filter((a) => !jaTem.has(a.id));

  if (!novos.length) return;

  await supabase.from("attendances").insert(
    novos.map((a) => ({
      event_id: event.id,
      player_id: a.id,
      status: "reserved" as AttendanceStatus,
    })),
  );
}

export async function reconcilePlayerTrainingAttendances(
  player: Pick<Player, "id" | "membership_type" | "membership_status">,
) {
  await generateWeeklyTrainings();

  const supabase = createAdminClient();
  const { today, weekEnd } = getUpcomingWeeksRange();
  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("type", "training")
    .gte("date", today)
    .lte("date", weekEnd);

  const trainings = dedupeEvents((events ?? []) as Event[]);
  if (!trainings.length) return;

  const eventIds = trainings.map((event) => event.id);
  const { data: attendances } = await supabase
    .from("attendances")
    .select("*")
    .eq("player_id", player.id)
    .in("event_id", eventIds);

  const attendanceByEvent = new Map(
    ((attendances ?? []) as Attendance[]).map((attendance) => [
      attendance.event_id,
      attendance,
    ]),
  );

  const isApprovedMember =
    player.membership_type !== "A" && player.membership_status === "approved";

  for (const event of trainings) {
    const attendance = attendanceByEvent.get(event.id);
    const canReserve =
      isApprovedMember &&
      visibleWeekdaysForPlayer(player.membership_type).includes(
        weekdayFromDate(event.date),
      );

    if (canReserve) {
      if (!attendance) {
        await supabase.from("attendances").insert({
          event_id: event.id,
          player_id: player.id,
          status: "reserved" as AttendanceStatus,
        });
      } else if (
        ["released", "waitlist", "pending_payment"].includes(attendance.status)
      ) {
        await supabase
          .from("attendances")
          .update({
            status: "reserved" as AttendanceStatus,
            waitlist_position: null,
            confirmed_at: null,
          })
          .eq("id", attendance.id);

        if (attendance.status === "waitlist") {
          await renumberWaitlist(event.id);
        }
      }
      continue;
    }

    if (attendance && attendance.status !== "released") {
      const wasOccupyingSpot = ATTENDANCE_OCCUPIES_SPOT.includes(
        attendance.status,
      );
      const wasWaitlisted = attendance.status === "waitlist";

      await supabase
        .from("attendances")
        .update({
          status: "released" as AttendanceStatus,
          waitlist_position: null,
          confirmed_at: null,
        })
        .eq("id", attendance.id);

      if (wasWaitlisted) {
        await renumberWaitlist(event.id);
      }
      if (wasOccupyingSpot) {
        await promoteWaitlist(event.id, event.capacity);
      }
    }
  }
}

export async function getTreinosParaPlayer(player: Player): Promise<TrainingWithAttendance[]> {
  await generateWeeklyTrainings();

  const supabase = createAdminClient();
  const { today, weekEnd } = getUpcomingWeeksRange();
  const diasPermitidos = visibleWeekdaysForPlayer(player.membership_type);

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("type", "training")
    .gte("date", today)
    .lte("date", weekEnd)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (!events?.length) return [];

  const filtrados = dedupeEvents(
    (events as Event[]).filter((e) =>
      diasPermitidos.includes(weekdayFromDate(e.date)),
    ),
  );

  if (!filtrados.length) return [];

  const eventIds = filtrados.map((e) => e.id);

  const [{ data: attendances }, { data: ocupadas }] = await Promise.all([
    supabase
      .from("attendances")
      .select("*")
      .eq("player_id", player.id)
      .in("event_id", eventIds),
    supabase
      .from("attendances")
      .select("event_id")
      .in("event_id", eventIds)
      .in("status", ATTENDANCE_OCCUPIES_SPOT),
  ]);

  const attendanceMap = new Map(
    ((attendances ?? []) as Attendance[]).map((p) => [p.event_id, p]),
  );

  const ocupadasMap = new Map<string, number>();
  for (const row of ocupadas ?? []) {
    ocupadasMap.set(row.event_id, (ocupadasMap.get(row.event_id) ?? 0) + 1);
  }

  return filtrados.map((event) => ({
    ...event,
    attendance: attendanceMap.get(event.id) ?? null,
    occupied_spots: ocupadasMap.get(event.id) ?? 0,
  }));
}

export async function countVagasOcupadas(eventId: string) {
  const supabase = createAdminClient();
  const { count } = await supabase
    .from("attendances")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .in("status", ATTENDANCE_OCCUPIES_SPOT);
  return count ?? 0;
}

async function renumberWaitlist(eventId: string) {
  const supabase = createAdminClient();
  const { data: fila } = await supabase
    .from("attendances")
    .select("id")
    .eq("event_id", eventId)
    .eq("status", "waitlist")
    .order("waitlist_position", { ascending: true });

  for (let i = 0; i < (fila ?? []).length; i++) {
    await supabase
      .from("attendances")
      .update({ waitlist_position: i + 1 })
      .eq("id", fila![i].id);
  }
}

export async function promoteWaitlist(eventId: string, capacity: number) {
  const ocupadas = await countVagasOcupadas(eventId);
  if (ocupadas >= capacity) return;

  const supabase = createAdminClient();
  const { data: next } = await supabase
    .from("attendances")
    .select("id, player_id")
    .eq("event_id", eventId)
    .eq("status", "waitlist")
    .order("waitlist_position", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!next) return;

  const { data: player } = await supabase
    .from("players")
    .select("membership_type")
    .eq("id", next.player_id)
    .single();

  const newStatus: AttendanceStatus =
    player?.membership_type === "A" ? "pending_payment" : "reserved";

  await supabase
    .from("attendances")
    .update({ status: newStatus, waitlist_position: null, confirmed_at: null })
    .eq("id", next.id);

  await renumberWaitlist(eventId);
  await promoteWaitlist(eventId, capacity);
}

export type AttendanceAction =
  | "confirmar"
  | "cancelar"
  | "entrar_fila"
  | "sair_fila"
  | "solicitar_vaga";

export async function executarAcaoAttendance(
  player: Player,
  eventId: string,
  action: AttendanceAction,
): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .eq("type", "training")
    .single();

  if (!event) return { error: "Treino não encontrado." };

  const ev = event as Event;
  const diaSemana = weekdayFromDate(ev.date);

  if (!visibleWeekdaysForPlayer(player.membership_type).includes(diaSemana)) {
    return { error: "Treino não disponível para sua modalidade." };
  }

  const { data: attendance } = await supabase
    .from("attendances")
    .select("*")
    .eq("event_id", eventId)
    .eq("player_id", player.id)
    .maybeSingle();

  const p = attendance as Attendance | null;

  if (player.membership_type !== "A" && player.membership_status !== "approved") {
    return { error: "Sua modalidade ainda não foi aprovada." };
  }

  if (action === "confirmar") {
    if (!p || p.status !== "reserved") {
      return { error: "Não há vaga reservada para confirmar." };
    }
    await supabase
      .from("attendances")
      .update({ status: "confirmed", confirmed_at: new Date().toISOString() })
      .eq("id", p.id);
    return {};
  }

  if (action === "cancelar") {
    if (!p || !["reserved", "confirmed"].includes(p.status)) {
      return { error: "Não há presença ativa para cancelar." };
    }
    await supabase
      .from("attendances")
      .update({ status: "released", confirmed_at: null, waitlist_position: null })
      .eq("id", p.id);
    await promoteWaitlist(eventId, ev.capacity);
    return {};
  }

  if (action === "entrar_fila") {
    if (player.membership_type !== "A") {
      return { error: "Apenas dropIns entram na fila de espera." };
    }
    if (p && p.status !== "released") {
      return { error: "Você já está inscrito neste treino." };
    }
    const { data: fila } = await supabase
      .from("attendances")
      .select("waitlist_position")
      .eq("event_id", eventId)
      .eq("status", "waitlist")
      .order("waitlist_position", { ascending: false })
      .limit(1);

    const proximaPos = (fila?.[0]?.waitlist_position ?? 0) + 1;

    if (p) {
      await supabase
        .from("attendances")
        .update({ status: "waitlist", waitlist_position: proximaPos })
        .eq("id", p.id);
    } else {
      await supabase.from("attendances").insert({
        event_id: eventId,
        player_id: player.id,
        status: "waitlist",
        waitlist_position: proximaPos,
      });
    }
    return {};
  }

  if (action === "sair_fila") {
    if (!p || p.status !== "waitlist") {
      return { error: "Você não está na fila de espera." };
    }
    await supabase
      .from("attendances")
      .update({ status: "released", waitlist_position: null })
      .eq("id", p.id);
    await renumberWaitlist(eventId);
    return {};
  }

  if (action === "solicitar_vaga") {
    if (player.membership_type !== "A") {
      return { error: "Apenas dropIns solicitam vaga avulsa." };
    }
    const ocupadas = await countVagasOcupadas(eventId);
    if (ocupadas >= ev.capacity) {
      return { error: "Não há vagas disponíveis. Entre na fila de espera." };
    }
    if (p && p.status !== "released") {
      return { error: "Você já está inscrito neste treino." };
    }

    if (p) {
      await supabase
        .from("attendances")
        .update({
          status: "pending_payment",
          waitlist_position: null,
          confirmed_at: null,
        })
        .eq("id", p.id);
    } else {
      await supabase.from("attendances").insert({
        event_id: eventId,
        player_id: player.id,
        status: "pending_payment",
      });
    }
    return {};
  }

  return { error: "Ação inválida." };
}

export async function getAdminTrainings(): Promise<TrainingWithAttendance[]> {
  await generateWeeklyTrainings();

  const supabase = createAdminClient();
  const { today, weekEnd } = getUpcomingWeeksRange();

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("type", "training")
    .gte("date", today)
    .lte("date", weekEnd)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  const filtrados = dedupeEvents((events ?? []) as Event[]);
  if (!filtrados.length) return [];

  const eventIds = filtrados.map((e) => e.id);
  const { data: ocupadas } = await supabase
    .from("attendances")
    .select("event_id")
    .in("event_id", eventIds)
    .in("status", ATTENDANCE_OCCUPIES_SPOT);

  const ocupadasMap = new Map<string, number>();
  for (const row of ocupadas ?? []) {
    ocupadasMap.set(row.event_id, (ocupadasMap.get(row.event_id) ?? 0) + 1);
  }

  return filtrados.map((event) => ({
    ...event,
    attendance: null,
    occupied_spots: ocupadasMap.get(event.id) ?? 0,
  }));
}

export async function getParticipantesEvent(
  eventId: string,
): Promise<TrainingParticipant[]> {
  const supabase = createAdminClient();

  const { data } = await supabase
    .from("attendances")
    .select(
      "id, player_id, status, waitlist_position, confirmed_at, players(name, nickname, membership_type)",
    )
    .eq("event_id", eventId)
    .neq("status", "released")
    .order("status", { ascending: true })
    .order("waitlist_position", { ascending: true, nullsFirst: false });

  const statusOrder: Record<AttendanceStatus, number> = {
    confirmed: 0,
    reserved: 1,
    pending_payment: 2,
    waitlist: 3,
    released: 4,
  };

  type Row = {
    id: string;
    player_id: string;
    status: AttendanceStatus;
    waitlist_position: number | null;
    confirmed_at: string | null;
    players:
      | { name: string; nickname: string | null; membership_type: MembershipType }
      | { name: string; nickname: string | null; membership_type: MembershipType }[]
      | null;
  };

  return ((data ?? []) as Row[])
    .map((row) => {
      const player = Array.isArray(row.players) ? row.players[0] : row.players;
      if (!player) return null;
      return {
        attendance_id: row.id,
        player_id: row.player_id,
        name: player.name,
        nickname: player.nickname,
        membership_type: player.membership_type,
        status: row.status,
        waitlist_position: row.waitlist_position,
        confirmed_at: row.confirmed_at,
      };
    })
    .filter((row): row is TrainingParticipant => row !== null)
    .sort((a, b) => {
      const sa = statusOrder[a.status] ?? 9;
      const sb = statusOrder[b.status] ?? 9;
      if (sa !== sb) return sa - sb;
      if (a.status === "waitlist" && b.status === "waitlist") {
        return (a.waitlist_position ?? 0) - (b.waitlist_position ?? 0);
      }
      return a.name.localeCompare(b.name, "pt-BR");
    });
}

export type AdminAttendanceAction =
  | "confirmar_pagamento"
  | "rejeitar_pagamento"
  | "subir_fila";

export async function executarAcaoAdminAttendance(
  attendanceId: string,
  action: AdminAttendanceAction,
): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  const { data: attendance } = await supabase
    .from("attendances")
    .select("*, events(capacity)")
    .eq("id", attendanceId)
    .single();

  if (!attendance) return { error: "Presença não encontrada." };

  const p = attendance as Attendance & { events: { capacity: number } };
  const capacity = p.events.capacity;

  if (action === "confirmar_pagamento") {
    if (p.status !== "pending_payment") {
      return { error: "Atleta não está aguardando pagamento." };
    }
    const ocupadas = await countVagasOcupadas(p.event_id);
    if (ocupadas >= capacity) {
      return { error: "Treino lotado. Rejeite alguém ou libere uma vaga primeiro." };
    }
    await supabase
      .from("attendances")
      .update({
        status: "confirmed",
        confirmed_at: new Date().toISOString(),
        waitlist_position: null,
      })
      .eq("id", attendanceId);
    return {};
  }

  if (action === "rejeitar_pagamento") {
    if (p.status !== "pending_payment") {
      return { error: "Atleta não está aguardando pagamento." };
    }
    await supabase
      .from("attendances")
      .update({ status: "released", waitlist_position: null, confirmed_at: null })
      .eq("id", attendanceId);
    await promoteWaitlist(p.event_id, capacity);
    return {};
  }

  if (action === "subir_fila") {
    if (p.status !== "waitlist") {
      return { error: "Atleta não está na fila de espera." };
    }
    const ocupadas = await countVagasOcupadas(p.event_id);
    if (ocupadas >= capacity) {
      return { error: "Não há vagas disponíveis." };
    }

    const { data: player } = await supabase
      .from("players")
      .select("membership_type")
      .eq("id", p.player_id)
      .single();

    const newStatus: AttendanceStatus =
      player?.membership_type === "A" ? "pending_payment" : "reserved";

    await supabase
      .from("attendances")
      .update({ status: newStatus, waitlist_position: null, confirmed_at: null })
      .eq("id", attendanceId);

    await renumberWaitlist(p.event_id);
    return {};
  }

  return { error: "Ação inválida." };
}
