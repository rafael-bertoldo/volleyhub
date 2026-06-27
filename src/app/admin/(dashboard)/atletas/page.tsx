export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { MEMBERSHIP_TYPE_LABELS, POSITION_LABELS } from "@/lib/constants";
import { formatPlayerName } from "@/lib/players";
import { AprovarMembershipTypeButton } from "../../aprovar-membership_type-button";
import { MensalidadePlayerCell } from "../../mensalidade-player-cell";
import { StatusBadge } from "../../status-badge";
import { MEMBERSHIP_FEE_DUE_DAY } from "@/lib/mensalidade";
import type { Player } from "@/lib/types";

function formatPosicao(preferred_position: Player["preferred_position"]) {
  return preferred_position ? POSITION_LABELS[preferred_position] : null;
}

export default async function PlayersPage() {
  const supabase = createAdminClient();

  const { data: players } = await supabase
    .from("players")
    .select("*")
    .order("created_at", { ascending: false });

  const playersList = (players ?? []) as Player[];
  const pending = playersList.filter(
    (a) => a.membership_type !== "A" && a.membership_status === "pending",
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Players</h1>
        <p className="text-sm text-gray-500 mt-1">
          {playersList.length} cadastrados
          {pending.length > 0 && ` · ${pending.length} pendente(s)`}
          {" · "}Mensalidade válida até o dia {MEMBERSHIP_FEE_DUE_DAY} de cada mês
        </p>
      </div>

      {pending.length > 0 && (
        <section className="card border-amber-200 bg-amber-50">
          <h2 className="section-title text-amber-800">
            Pendentes de aprovação ({pending.length})
          </h2>
          <div className="space-y-3">
            {pending.map((player) => {
              const preferred_positionLabel = formatPosicao(player.preferred_position);

              return (
                <div
                  key={player.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl p-4 border border-amber-100"
                >
                  <div>
                    <p className="font-semibold text-gray-900">
                      {formatPlayerName(player)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {MEMBERSHIP_TYPE_LABELS[player.membership_type]}
                      {preferred_positionLabel && ` · ${preferred_positionLabel}`}
                    </p>
                    <p className="text-xs text-gray-400">
                      {player.city_area} ·{" "}
                      {new Date(player.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <AprovarMembershipTypeButton
                    playerId={player.id}
                    name={formatPlayerName(player)}
                  />
                </div>
              );
            })}
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="section-title">Todos os players</h2>
        {!playersList.length ? (
          <p className="text-sm text-gray-500">Nenhum player cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4 font-medium">Nome</th>
                  <th className="pb-2 pr-4 font-medium">E-mail</th>
                  <th className="pb-2 pr-4 font-medium">MembershipType</th>
                  <th className="pb-2 pr-4 font-medium">Posição</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Mensalidade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {playersList.map((player) => (
                  <tr key={player.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">
                        {formatPlayerName(player)}
                      </p>
                      <p className="text-xs text-gray-400">{player.city_area}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {player.email ?? "Sem login vinculado"}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {MEMBERSHIP_TYPE_LABELS[player.membership_type]}
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {player.preferred_position ? POSITION_LABELS[player.preferred_position] : "-"}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge player={player} />
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <MensalidadePlayerCell player={player} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
