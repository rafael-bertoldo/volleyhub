export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { MEMBERSHIP_TYPE_LABELS, POSITION_LABELS } from "@/lib/constants";
import { formatPlayerName } from "@/lib/players";
import { getCurrentPlayer } from "@/lib/player-server";
import { DataRow, StatusCard } from "../player-ui";

export default async function PerfilPage() {
  const player = await getCurrentPlayer();

  if (!player) {
    redirect("/login");
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Perfil</h1>

      <StatusCard player={player} />

      <section className="card">
        <h2 className="section-title">Seus dados</h2>
        <dl className="space-y-2 text-sm">
          <DataRow label="Nome" value={formatPlayerName(player)} />
          {player.email && <DataRow label="E-mail" value={player.email} />}
          <DataRow
            label="Nascimento"
            value={new Date(player.birth_date + "T12:00:00").toLocaleDateString("pt-BR")}
          />
          <DataRow label="Endereço" value={player.address} />
          <DataRow label="Bairro / Cidade" value={player.city_area} />
          <DataRow label="Modalidade" value={MEMBERSHIP_TYPE_LABELS[player.membership_type]} />
          {player.preferred_position && (
            <DataRow label="Posição" value={POSITION_LABELS[player.preferred_position]} />
          )}
          <DataRow
            label="Competições"
            value={
              player.competition_interest === "yes"
                ? "Tenho interesse e disponibilidade"
                : "No momento não"
            }
          />
          {player.notes && (
            <DataRow label="Observações" value={player.notes} />
          )}
        </dl>
      </section>

      <p className="text-xs text-center text-gray-400">
        Use seu e-mail e senha para acessar a área do atleta em qualquer dispositivo.
      </p>
    </div>
  );
}
