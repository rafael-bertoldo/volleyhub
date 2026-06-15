export const dynamic = "force-dynamic";

import { notFound, redirect } from "next/navigation";
import { getAtletaByToken } from "@/lib/atleta-server";
import { getJogosAceitosAtleta } from "@/lib/jogos-server";
import { JogosAtletaList } from "./jogos-atleta-list";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function JogosAtletaPage({ params }: PageProps) {
  const { token } = await params;
  const atleta = await getAtletaByToken(token);

  if (!atleta) {
    notFound();
  }

  const jogos = await getJogosAceitosAtleta(atleta.id);

  if (!jogos.length) {
    redirect(`/a/${token}`);
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Jogos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Competições e amistosos que você confirmou presença.
        </p>
      </div>
      <JogosAtletaList jogos={jogos} atletaId={atleta.id} />
    </div>
  );
}
