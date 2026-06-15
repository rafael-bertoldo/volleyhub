"use client";

import { useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { REALTIME_EVENTS } from "@/lib/realtime/channels";

/**
 * Escuta atualizações de presença (broadcast + postgres_changes) para um treino.
 */
export function usePresencasRealtime(
  eventoId: string | null,
  onUpdate: () => void,
) {
  const eventoIds = eventoId ? [eventoId] : [];
  useTreinosPresencaRealtime(eventoIds, onUpdate);
}

/**
 * Escuta presenças de vários treinos — uma inscrição por evento, sem conflito de canal.
 */
export function useTreinosPresencaRealtime(
  eventoIds: string[],
  onUpdate: () => void,
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const idsKey = eventoIds.join(",");

  useEffect(() => {
    if (!eventoIds.length) return;

    const supabase = createClient();
    const channels = eventoIds.flatMap((eventoId) => [
      supabase
        .channel(`treino:${eventoId}`)
        .on(
          "broadcast",
          { event: REALTIME_EVENTS.PRESENCA_UPDATE },
          () => onUpdateRef.current(),
        )
        .subscribe(),
      supabase
        .channel(`presencas-pg:${eventoId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "presencas",
            filter: `evento_id=eq.${eventoId}`,
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
  }, [idsKey]);
}

/**
 * Escuta convocações privadas do atleta (feed + tabela convocacoes).
 */
export function useConvocacoesRealtime(
  atletaId: string,
  onConvocacaoChange: () => void,
) {
  useEffect(() => {
    const supabase = createClient();

    const pgChannel = supabase
      .channel(`convocacoes-pg:${atletaId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "convocacoes",
          filter: `atleta_id=eq.${atletaId}`,
        },
        () => onConvocacaoChange(),
      )
      .subscribe();

    const bcChannel = supabase
      .channel(`atleta:${atletaId}`)
      .on("broadcast", { event: REALTIME_EVENTS.CONVOCACAO_UPDATE }, () =>
        onConvocacaoChange(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pgChannel);
      supabase.removeChannel(bcChannel);
    };
  }, [atletaId, onConvocacaoChange]);
}

/**
 * Escuta convocações de jogos no admin (broadcast + postgres_changes).
 */
export function useJogosConvocacoesRealtime(
  eventoIds: string[],
  onUpdate: () => void,
) {
  const onUpdateRef = useRef(onUpdate);
  onUpdateRef.current = onUpdate;

  const idsKey = eventoIds.join(",");

  useEffect(() => {
    if (!eventoIds.length) return;

    const supabase = createClient();
    const channels = eventoIds.flatMap((eventoId) => [
      supabase
        .channel(`jogo:${eventoId}`)
        .on(
          "broadcast",
          { event: REALTIME_EVENTS.CONVOCACAO_UPDATE },
          () => onUpdateRef.current(),
        )
        .subscribe(),
      supabase
        .channel(`convocacoes-jogo-pg:${eventoId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "convocacoes",
            filter: `evento_id=eq.${eventoId}`,
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
  }, [idsKey]);
}
