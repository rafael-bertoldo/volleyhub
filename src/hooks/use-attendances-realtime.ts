"use client";

import { useEffect, useId, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { REALTIME_EVENTS } from "@/lib/realtime/channels";

/**
 * Escuta atualizações de presença (broadcast + postgres_changes) para um treino.
 */
export function useAttendancesRealtime(
  eventId: string | null,
  onUpdate: () => void,
) {
  const eventIds = eventId ? [eventId] : [];
  useTreinosAttendanceRealtime(eventIds, onUpdate);
}

/**
 * Escuta presenças de vários treinos — uma inscrição por event, sem conflito de canal.
 */
export function useTreinosAttendanceRealtime(
  eventIds: string[],
  onUpdate: () => void,
) {
  const onUpdateRef = useRef(onUpdate);
  const channelScope = useChannelScope();

  const idsKey = eventIds.join(",");

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];
    if (!ids.length) return;

    const supabase = createClient();
    const channels = ids.flatMap((eventId) => [
      supabase
        .channel(`treino:${eventId}:${channelScope}`)
        .on(
          "broadcast",
          { event: REALTIME_EVENTS.ATTENDANCE_UPDATE },
          () => onUpdateRef.current(),
        )
        .subscribe(),
      supabase
        .channel(`attendances-pg:${eventId}:${channelScope}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "attendances",
            filter: `event_id=eq.${eventId}`,
          },
          () => onUpdateRef.current(),
        )
        .subscribe(),
    ]);

    return () => {
      for (const ch of channels) {
        supabase.removeChannel(ch);
      }
    };
  }, [idsKey, channelScope]);
}

/**
 * Escuta convocações privadas do player (feed + tabela call_ups).
 */
export function useConvocacoesRealtime(
  playerId: string,
  onCallUpChange: () => void,
) {
  const channelScope = useChannelScope();

  useEffect(() => {
    const supabase = createClient();

    const pgChannel = supabase
      .channel(`call_ups-pg:${playerId}:${channelScope}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "call_ups",
          filter: `player_id=eq.${playerId}`,
        },
        () => onCallUpChange(),
      )
      .subscribe();

    const bcChannel = supabase
      .channel(`player:${playerId}:${channelScope}`)
      .on("broadcast", { event: REALTIME_EVENTS.CALL_UP_UPDATE }, () =>
        onCallUpChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pgChannel);
      supabase.removeChannel(bcChannel);
    };
  }, [playerId, onCallUpChange, channelScope]);
}

/**
 * Escuta convocações de jogos no admin (broadcast + postgres_changes).
 */
export function useJogosConvocacoesRealtime(
  eventIds: string[],
  onUpdate: () => void,
) {
  const onUpdateRef = useRef(onUpdate);
  const channelScope = useChannelScope();

  const idsKey = eventIds.join(",");

  useEffect(() => {
    onUpdateRef.current = onUpdate;
  }, [onUpdate]);

  useEffect(() => {
    const ids = idsKey ? idsKey.split(",") : [];
    if (!ids.length) return;

    const supabase = createClient();
    const channels = ids.flatMap((eventId) => [
      supabase
        .channel(`jogo:${eventId}:${channelScope}`)
        .on(
          "broadcast",
          { event: REALTIME_EVENTS.CALL_UP_UPDATE },
          () => onUpdateRef.current(),
        )
        .subscribe(),
      supabase
        .channel(`call_ups-jogo-pg:${eventId}:${channelScope}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "call_ups",
            filter: `event_id=eq.${eventId}`,
          },
          () => onUpdateRef.current(),
        )
        .subscribe(),
    ]);

    return () => {
      for (const ch of channels) {
        supabase.removeChannel(ch);
      }
    };
  }, [idsKey, channelScope]);
}

function useChannelScope() {
  return useId().replace(/:/g, "");
}
