"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useConvocacoesRealtime } from "@/hooks/use-attendances-realtime";
import { formatJogoTitulo } from "@/lib/jogos";
import { formatTrainingDate, formatTime } from "@/lib/treinos";
import type { Event } from "@/lib/types";

export function JogosPlayerList({
  jogos,
  playerId,
}: {
  jogos: Event[];
  playerId: string;
}) {
  const router = useRouter();

  const onCallUpChange = useCallback(() => {
    router.refresh();
  }, [router]);

  useConvocacoesRealtime(playerId, onCallUpChange);
  if (!jogos.length) {
    return (
      <p className="text-sm text-gray-500">
        Nenhum jogo confirmado. Aceite uma convocação no feed para vê-lo aqui.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {jogos.map((jogo) => (
        <article
          key={jogo.id}
          className="rounded-xl border border-gray-100 bg-white p-4 border-l-4 border-l-amber-500"
        >
          <h2 className="font-semibold text-gray-900">{formatJogoTitulo(jogo)}</h2>
          <p className="text-sm text-gray-600 mt-1">
            {formatTrainingDate(jogo.date)} · {formatTime(jogo.start_time)} –{" "}
            {formatTime(jogo.end_time)}
          </p>
          {jogo.location?.trim() && (
            <p className="text-sm text-gray-600 mt-0.5">{jogo.location.trim()}</p>
          )}
          {jogo.notes?.trim() && (
            <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">
              {jogo.notes.trim()}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
