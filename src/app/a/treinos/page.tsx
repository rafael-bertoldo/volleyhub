export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getCurrentPlayer } from "@/lib/player-server";
import { getTreinosParaPlayer } from "@/lib/treinos-server";
import { TreinosList } from "./treinos-list";

export default async function TreinosPage() {
  const player = await getCurrentPlayer();

  if (!player) {
    redirect("/login");
  }

  const treinos = await getTreinosParaPlayer(player);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Treinos</h1>
        <p className="text-sm text-gray-500 mt-1">
          Treinos desta semana e confirmação de presença.
        </p>
      </div>
      <TreinosList treinos={treinos} player={player} />
    </div>
  );
}
