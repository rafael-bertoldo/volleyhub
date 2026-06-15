"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useConvocacoesRealtime } from "@/hooks/use-presencas-realtime";
import { formatJogoTitulo } from "@/lib/jogos";
import { formatDataTreino, formatHora } from "@/lib/treinos";
import type { Evento } from "@/lib/types";

export function JogosAtletaList({
  jogos,
  atletaId,
}: {
  jogos: Evento[];
  atletaId: string;
}) {
  const router = useRouter();

  const onConvocacaoChange = useCallback(() => {
    router.refresh();
  }, [router]);

  useConvocacoesRealtime(atletaId, onConvocacaoChange);
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
            {formatDataTreino(jogo.data)} · {formatHora(jogo.hora_inicio)} –{" "}
            {formatHora(jogo.hora_fim)}
          </p>
          {jogo.local?.trim() && (
            <p className="text-sm text-gray-600 mt-0.5">{jogo.local.trim()}</p>
          )}
          {jogo.observacoes?.trim() && (
            <p className="text-sm text-gray-500 mt-2 whitespace-pre-wrap">
              {jogo.observacoes.trim()}
            </p>
          )}
        </article>
      ))}
    </div>
  );
}
