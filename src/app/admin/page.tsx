export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { APP_NAME, MODALIDADE_LABELS } from "@/lib/constants";
import { CopyLinkButton } from "./copy-link-button";
import { AprovarModalidadeButton } from "./aprovar-modalidade-button";
import type { Atleta } from "@/lib/types";

export default async function AdminPage() {
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
    <main className="min-h-full bg-gray-50">
      <header className="bg-violet-800 text-white px-4 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-violet-300 text-sm">Administração</p>
            <h1 className="text-xl font-bold">{APP_NAME}</h1>
          </div>
          <span className="text-xs bg-violet-700 px-3 py-1 rounded-full">
            {(atletas ?? []).length} atletas
          </span>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4 space-y-6">
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
          <h2 className="section-title">Atletas cadastrados</h2>
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

        <section className="card">
          <h2 className="section-title">Links de cadastro</h2>
          <p className="text-sm text-gray-500 mb-3">
            Gere links de convite no Supabase (tabela{" "}
            <code className="text-violet-600">links_convite</code>) ou use o SQL abaixo
            para criar um link de teste.
          </p>
          <pre className="text-xs bg-gray-100 rounded-lg p-3 overflow-x-auto text-gray-700">
            {`INSERT INTO links_convite (token) VALUES ('teste-cadastro');\n-- Link: ${appUrl}/cadastro/teste-cadastro`}
          </pre>
        </section>
      </div>
    </main>
  );
}

function StatusBadge({ atleta }: { atleta: Atleta }) {
  if (atleta.modalidade === "A") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
        Avulso
      </span>
    );
  }

  const map = {
    pendente: "bg-amber-100 text-amber-700",
    aprovado: "bg-green-100 text-green-700",
    recusado: "bg-red-100 text-red-700",
  };

  const labels = {
    pendente: "Pendente",
    aprovado: "Aprovado",
    recusado: "Recusado",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[atleta.modalidade_status]}`}
    >
      {labels[atleta.modalidade_status]}
    </span>
  );
}
