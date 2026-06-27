import { createAdminClient } from "@/lib/supabase/admin";
import {
  broadcastCallUpUpdate,
  broadcastFeedDeletedToPlayer,
  broadcastFeedToPlayer,
  broadcastJogoCallUpUpdate,
} from "@/lib/realtime/broadcast-server";
import { buildCallUpFeed } from "@/lib/jogos";
import { normalizeTime } from "@/lib/treinos";
import type {
  Player,
  EligiblePlayer,
  CallUpWithPlayer,
  CallUpStats,
  Event,
  FeedItem,
  GameWithCallUps,
  MembershipType,
} from "@/lib/types";

export interface CreateGameInput {
  type: "game" | "friendly";
  date: string;
  start_time: string;
  end_time: string;
  location: string;
  opponent: string;
  capacity: number;
  notes?: string;
}

function calcStats(call_ups: CallUpWithPlayer[]): CallUpStats {
  return {
    total: call_ups.length,
    pending: call_ups.filter((c) => c.status === "pending").length,
    accepted: call_ups.filter((c) => c.status === "accepted").length,
    declined: call_ups.filter((c) => c.status === "declined").length,
  };
}

export async function createGame(input: CreateGameInput): Promise<Event> {
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("events")
    .insert({
      type: input.type,
      date: input.date,
      start_time: normalizeTime(input.start_time),
      end_time: normalizeTime(input.end_time),
      location: input.location.trim(),
      opponent: input.opponent.trim(),
      capacity: input.capacity,
      notes: input.notes?.trim() ?? "",
      source: "manual",
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error("Erro ao criar jogo.");
  }

  return data as Event;
}

export async function getAdminGames(): Promise<GameWithCallUps[]> {
  const supabase = createAdminClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .in("type", ["game", "friendly"])
    .gte("date", hoje)
    .order("date", { ascending: true })
    .order("start_time", { ascending: true });

  if (!events?.length) return [];

  const eventIds = events.map((e) => e.id);
  const { data: call_ups } = await supabase
    .from("call_ups")
    .select("*, players(id, name, nickname, membership_type)")
    .in("event_id", eventIds);

  const porEvent = new Map<string, CallUpWithPlayer[]>();
  for (const row of call_ups ?? []) {
    const player = Array.isArray(row.players) ? row.players[0] : row.players;
    if (!player) continue;
    const lista = porEvent.get(row.event_id) ?? [];
    lista.push({
      id: row.id,
      event_id: row.event_id,
      player_id: row.player_id,
      status: row.status,
      message: row.message,
      called_up_at: row.called_up_at,
      responded_at: row.responded_at,
      player,
    });
    porEvent.set(row.event_id, lista);
  }

  return (events as Event[]).map((event) => {
    const callUps = porEvent.get(event.id) ?? [];
    return {
      ...event,
      call_ups: callUps,
      stats: calcStats(callUps),
    };
  });
}

export async function getPlayersElegiveis(
  eventId: string,
): Promise<{ members: EligiblePlayer[]; dropIns: EligiblePlayer[]; capacity: number }> {
  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("capacity")
    .eq("id", eventId)
    .in("type", ["game", "friendly"])
    .single();

  if (!event) {
    throw new Error("Evento não encontrado.");
  }

  const [{ data: players }, { data: calledUp }] = await Promise.all([
    supabase
      .from("players")
      .select("id, name, nickname, membership_type, membership_status, competition_interest")
      .eq("active", true)
      .eq("competition_interest", "yes"),
    supabase
      .from("call_ups")
      .select("player_id")
      .eq("event_id", eventId),
  ]);

  const jaConvocados = new Set((calledUp ?? []).map((c) => c.player_id));

  const members: EligiblePlayer[] = [];
  const dropIns: EligiblePlayer[] = [];

  for (const a of players ?? []) {
    const base = {
      id: a.id,
      name: a.name,
      nickname: a.nickname,
      membership_type: a.membership_type as MembershipType,
      already_called_up: jaConvocados.has(a.id),
    };

    if (a.membership_type === "A") {
      dropIns.push({ ...base, group: "drop_in" });
    } else if (a.membership_status === "approved") {
      members.push({ ...base, group: "member" });
    }
  }

  members.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  dropIns.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));

  return {
    members,
    dropIns,
    capacity: event.capacity,
  };
}

export async function convocarPlayers(
  eventId: string,
  playerIds: string[],
): Promise<{ error?: string; calledUp?: number }> {
  if (!playerIds.length) {
    return { error: "Selecione ao menos um atleta." };
  }

  const supabase = createAdminClient();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", eventId)
    .in("type", ["game", "friendly"])
    .single();

  if (!event) return { error: "Evento não encontrado." };

  const ev = event as Event;
  const elegiveis = await getPlayersElegiveis(eventId);
  const elegivelIds = new Set([
    ...elegiveis.members.map((a) => a.id),
    ...elegiveis.dropIns.map((a) => a.id),
  ]);

  const ids = [...new Set(playerIds)];
  if (ids.some((id) => !elegivelIds.has(id))) {
    return { error: "Um ou mais atletas não são elegíveis." };
  }

  const { data: players } = await supabase
    .from("players")
    .select("id, membership_type")
    .in("id", ids);

  const dropInsSel = (players ?? []).filter((a) => a.membership_type === "A");

  if (ids.length > ev.capacity) {
    return { error: `Máximo de ${ev.capacity} convocados para este evento.` };
  }

  const vagasParaAvulsos = Math.max(0, ev.capacity - elegiveis.members.length);
  if (dropInsSel.length > 0 && elegiveis.members.length >= ev.capacity) {
    return {
      error:
        "Mensalistas com interesse preenchem todas as vagas. Avulsos não podem ser convocados.",
    };
  }
  if (dropInsSel.length > vagasParaAvulsos) {
    return {
      error: `No máximo ${vagasParaAvulsos} avulso(s) podem ser convocados neste evento.`,
    };
  }

  const { title, body } = buildCallUpFeed(ev);
  let calledUp = 0;

  for (const playerId of ids) {
    const { data: existente } = await supabase
      .from("call_ups")
      .select("id")
      .eq("event_id", eventId)
      .eq("player_id", playerId)
      .maybeSingle();

    if (existente) continue;

    const { error: convError } = await supabase.from("call_ups").insert({
      event_id: eventId,
      player_id: playerId,
      status: "pending",
    });

    if (convError) continue;

    const { data: feedItem, error: feedError } = await supabase
      .from("feed")
      .insert({
        type: "call_up",
        player_id: playerId,
        event_id: eventId,
        title,
        body,
      })
      .select()
      .single();

    if (!feedError && feedItem) {
      await broadcastFeedToPlayer(playerId, feedItem as FeedItem);
    }

    await broadcastCallUpUpdate(playerId, { event_id: eventId });
    await broadcastJogoCallUpUpdate(eventId, { event_id: eventId, player_id: playerId });
    calledUp++;
  }

  return { calledUp };
}

export async function responderCallUp(
  player: Player,
  eventId: string,
  resposta: "accepted" | "declined",
): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  const { data: convocacao } = await supabase
    .from("call_ups")
    .select("*")
    .eq("event_id", eventId)
    .eq("player_id", player.id)
    .single();

  if (!convocacao) {
    return { error: "Convocação não encontrada." };
  }

  if (convocacao.status !== "pending") {
    return { error: "Esta convocação já foi respondida." };
  }

  await supabase
    .from("call_ups")
    .update({
      status: resposta,
      responded_at: new Date().toISOString(),
    })
    .eq("id", convocacao.id);

  await supabase
    .from("feed")
    .update({ is_read: true })
    .eq("player_id", player.id)
    .eq("event_id", eventId)
    .eq("type", "call_up");

  await broadcastCallUpUpdate(player.id, {
    event_id: eventId,
    status: resposta,
  });
  await broadcastJogoCallUpUpdate(eventId, {
    event_id: eventId,
    player_id: player.id,
    status: resposta,
  });

  return {};
}

export async function removerCallUp(
  convocacaoId: string,
): Promise<{ error?: string }> {
  const supabase = createAdminClient();

  const { data: convocacao } = await supabase
    .from("call_ups")
    .select("id, event_id, player_id, events(type)")
    .eq("id", convocacaoId)
    .single();

  if (!convocacao) {
    return { error: "Convocação não encontrada." };
  }

  const event = Array.isArray(convocacao.events)
    ? convocacao.events[0]
    : convocacao.events;

  if (!event || !["game", "friendly"].includes(event.type)) {
    return { error: "Convocação inválida." };
  }

  const { error } = await supabase.from("call_ups").delete().eq("id", convocacaoId);

  if (error) {
    return { error: "Erro ao remover convocação." };
  }

  const { data: feedItems } = await supabase
    .from("feed")
    .select("id")
    .eq("player_id", convocacao.player_id)
    .eq("event_id", convocacao.event_id)
    .eq("type", "call_up");

  for (const feedItem of feedItems ?? []) {
    await supabase.from("feed").delete().eq("id", feedItem.id);
    await broadcastFeedDeletedToPlayer(convocacao.player_id, feedItem.id);
  }

  await broadcastCallUpUpdate(convocacao.player_id, {
    event_id: convocacao.event_id,
    removed: true,
  });
  await broadcastJogoCallUpUpdate(convocacao.event_id, {
    event_id: convocacao.event_id,
    player_id: convocacao.player_id,
    removed: true,
  });

  return {};
}

export async function getJogosAceitosPlayer(playerId: string) {
  const supabase = createAdminClient();
  const hoje = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("call_ups")
    .select("*, events(*)")
    .eq("player_id", playerId)
    .eq("status", "accepted");

  return ((data ?? []) as Array<{
    id: string;
    status: string;
    events: Event | Event[] | null;
  }>)
    .map((row) => {
      const event = Array.isArray(row.events) ? row.events[0] : row.events;
      return event;
    })
    .filter((e): e is Event => !!e && e.date >= hoje)
    .sort((a, b) => {
      const cmp = a.date.localeCompare(b.date);
      if (cmp !== 0) return cmp;
      return a.start_time.localeCompare(b.start_time);
    });
}

export async function countJogosAceitosPlayer(playerId: string) {
  const jogos = await getJogosAceitosPlayer(playerId);
  return jogos.length;
}

export async function getCallUpStatusPorEvent(
  playerId: string,
  eventIds: string[],
): Promise<Map<string, string>> {
  if (!eventIds.length) return new Map();

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("call_ups")
    .select("event_id, status")
    .eq("player_id", playerId)
    .in("event_id", eventIds);

  return new Map((data ?? []).map((c) => [c.event_id, c.status]));
}
