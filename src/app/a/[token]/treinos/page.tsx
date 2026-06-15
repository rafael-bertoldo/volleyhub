export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { getAtletaByToken } from "@/lib/atleta-server";
import { getTreinosParaAtleta } from "@/lib/treinos-server";
import { TreinosList } from "./treinos-list";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function TreinosPage({ params }: PageProps) {
  const { token } = await params;
  const atleta = await getAtletaByToken(token);

  if (!atleta) {
    notFound();
  }

  const treinos = await getTreinosParaAtleta(atleta);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Treinos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Treinos desta semana e confirmação de presença.
        </p>
      </div>
      <TreinosList treinos={treinos} atleta={atleta} accessToken={token} />
    </div>
  );
}
