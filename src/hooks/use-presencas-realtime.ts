"use client";

import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { REALTIME_EVENTS } from "@/lib/realtime/channels";

/**
 * Escuta atualizações da lista de presença de um treino em tempo real.
 * Usar na página de treinos quando implementada.
 */
export function usePresencasRealtime(
  eventoId: string | null,
  onUpdate: () => void,
) {
  useEffect(() => {
    if (!eventoId) return;

    const supabase = createClient();

    const pgChannel = supabase
      .channel(`presencas-pg:${eventoId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "presencas",
          filter: `evento_id=eq.${eventoId}`,
        },
        () => onUpdate(),
      )
      .subscribe();

    const bcChannel = supabase
      .channel(`treino:${eventoId}`)
      .on("broadcast", { event: REALTIME_EVENTS.PRESENCA_UPDATE }, () =>
        onUpdate(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pgChannel);
      supabase.removeChannel(bcChannel);
    };
  }, [eventoId, onUpdate]);
}

/**
 * Escuta convocações privadas do atleta (feed + tabela convocacoes).
 */
export function useConvocacoesRealtime(
  atletaId: string,
  onFeedItem: (item: unknown) => void,
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
