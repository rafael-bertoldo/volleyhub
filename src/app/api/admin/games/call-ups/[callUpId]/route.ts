import { DELETE as legacyDELETE } from "../../../jogos/convocacoes/[convocacaoId]/route";
import type { NextRequest } from "next/server";

export function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ callUpId: string }> },
) {
  return legacyDELETE(request, {
    params: params.then(({ callUpId }) => ({ convocacaoId: callUpId })),
  });
}
