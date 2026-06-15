export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { MODALIDADE_LABELS } from "@/lib/constants";
import { CopyLinkButton } from "../../copy-link-button";
import { AprovarModalidadeButton } from "../../aprovar-modalidade-button";
import { MensalidadeAtletaCell } from "../../mensalidade-atleta-cell";
import { StatusBadge } from "../../status-badge";
import { MENSALIDADE_DIA_LIMITE } from "@/lib/mensalidade";
import type { Atleta } from "@/lib/types";

export default async function AtletasPage() {
  const supabase = createAdminClient();

  const { data: atletas } = await supabase
    .from("atletas")
    .select("*")
    .order("criado_em", { ascending: false });

  const pendentes = (atletas ?? []).filter(
    (a) => a.modalidade !== "A" && a.modalidade_status === "pendente",
  );

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Atletas</h1>
        <p className="text-sm text-gray-500 mt-1">
          {(atletas ?? []).length} cadastrados
          {pendentes.length > 0 && ` · ${pendentes.length} pendente(s)`}
          {" · "}Mensalidade válida até o dia {MENSALIDADE_DIA_LIMITE} de cada mês
        </p>
      </div>

      {pendentes.length > 0 && (
        <section className="card border-amber-200 bg-amber-50">
          <h2 className="section-title text-amber-800">
            Pendentes de aprovação ({pendentes.length})
          </h2>
          <div className="space-y-3">
            {pendentes.map((atleta) => (
              <div
                key={atleta.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white rounded-xl p-4 border border-amber-100"
              >
                <div>
                  <p className="font-semibold text-gray-900">{atleta.nome}</p>
                  <p className="text-sm text-gray-600">
                    {MODALIDADE_LABELS[atleta.modalidade as Atleta["modalidade"]]}
                  </p>
                  <p className="text-xs text-gray-400">
                    {atleta.bairro_cidade} ·{" "}
                    {new Date(atleta.criado_em).toLocaleDateString("pt-BR")}
                  </p>
                </div>
                <AprovarModalidadeButton atletaId={atleta.id} nome={atleta.nome} />
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="card">
        <h2 className="section-title">Todos os atletas</h2>
        {!atletas?.length ? (
          <p className="text-sm text-gray-500">Nenhum atleta cadastrado ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-gray-500 border-b border-gray-100">
                  <th className="pb-2 pr-4 font-medium">Nome</th>
                  <th className="pb-2 pr-4 font-medium">Modalidade</th>
                  <th className="pb-2 pr-4 font-medium">Status</th>
                  <th className="pb-2 pr-4 font-medium">Mensalidade</th>
                  <th className="pb-2 font-medium">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {(atletas as Atleta[]).map((atleta) => (
                  <tr key={atleta.id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900">{atleta.nome}</p>
                      <p className="text-xs text-gray-400">{atleta.bairro_cidade}</p>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">
                      {MODALIDADE_LABELS[atleta.modalidade]}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusBadge atleta={atleta} />
                    </td>
                    <td className="py-3 pr-4 align-top">
                      <MensalidadeAtletaCell atleta={atleta} />
                    </td>
                    <td className="py-3">
                      <CopyLinkButton
                        url={`${appUrl}/a/${atleta.access_token}`}
                        nome={atleta.nome}
                      />
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
