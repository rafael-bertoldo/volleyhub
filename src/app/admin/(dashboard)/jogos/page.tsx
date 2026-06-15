export const dynamic = "force-dynamic";

import { getJogosAdmin } from "@/lib/jogos-server";
import { JogoForm } from "../../jogo-form";
import { JogosList } from "../../jogos-list";

export default async function AdminJogosPage() {
  const jogos = await getJogosAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Jogos e Competições</h1>
        <p className="text-sm text-gray-500 mt-1">
          Crie eventos, convoque atletas e acompanhe confirmações.
        </p>
      </div>

      <section className="card">
        <h2 className="section-title">Novo evento</h2>
        <JogoForm />
      </section>

      <section className="card">
        <h2 className="section-title">Próximos jogos</h2>
        <JogosList jogos={jogos} />
      </section>
    </div>
  );
}
