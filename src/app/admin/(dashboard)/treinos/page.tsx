export const dynamic = "force-dynamic";

import {
  getParticipantesEvento,
  getTreinosAdmin,
} from "@/lib/treinos-server";
import { AdminTreinosList } from "./admin-treinos-list";

export default async function AdminTreinosPage() {
  const treinos = await getTreinosAdmin();

  const participantesEntries = await Promise.all(
    treinos.map(async (t) => [t.id, await getParticipantesEvento(t.id)] as const),
  );

  const participantesPorEvento = Object.fromEntries(participantesEntries);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Treinos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Presenças desta semana — confirmações e fila de espera.
        </p>
      </div>

      <AdminTreinosList
        treinos={treinos}
        participantesPorEvento={participantesPorEvento}
      />
    </div>
  );
}
