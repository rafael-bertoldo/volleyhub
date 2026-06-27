export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/player-server";
import { getJogosAceitosPlayer } from "@/lib/jogos-server";
import { JogosPlayerList } from "./jogos-player-list";

export default async function JogosPlayerPage() {
  const player = await getCurrentPlayer();

  if (!player) {
    redirect("/login");
  }

  const jogos = await getJogosAceitosPlayer(player.id);

  if (!jogos.length) {
    redirect("/a");
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Jogos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Competições e amistosos que você confirmou presença.
        </p>
      </div>
      <JogosPlayerList jogos={jogos} playerId={player.id} />
    </div>
  );
}
