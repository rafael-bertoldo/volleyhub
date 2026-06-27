"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useConvocacoesRealtime } from "@/hooks/use-attendances-realtime";

/** Atualiza o layout do player quando convocações mudam (aceitar, recusar, remover). */
export function PlayerNavSync({ playerId }: { playerId: string }) {
  const router = useRouter();

  const onCallUpChange = useCallback(() => {
    router.refresh();
  }, [router]);

  useConvocacoesRealtime(playerId, onCallUpChange);

  return null;
}
