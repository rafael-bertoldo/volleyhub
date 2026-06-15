"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useConvocacoesRealtime } from "@/hooks/use-presencas-realtime";

/** Atualiza o layout do atleta quando convocações mudam (aceitar, recusar, remover). */
export function AtletaNavSync({ atletaId }: { atletaId: string }) {
  const router = useRouter();

  const onConvocacaoChange = useCallback(() => {
    router.refresh();
  }, [router]);

  useConvocacoesRealtime(atletaId, onConvocacaoChange);

  return null;
}
