export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { MODALIDADE_LABELS } from "@/lib/constants";
import { getAtletaByToken } from "@/lib/atleta-server";
import { DataRow, StatusCard } from "../atleta-ui";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function PerfilPage({ params }: PageProps) {
  const { token } = await params;
  const atleta = await getAtletaByToken(token);

  if (!atleta) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Perfil</h1>

      <StatusCard atleta={atleta} />

      <section className="card">
        <h2 className="section-title">Seus dados</h2>
        <dl className="space-y-2 text-sm">
          <DataRow label="Nome" value={atleta.nome} />
          <DataRow
            label="Nascimento"
            value={new Date(atleta.nascimento + "T12:00:00").toLocaleDateString("pt-BR")}
          />
          <DataRow label="Endereço" value={atleta.endereco} />
          <DataRow label="Bairro / Cidade" value={atleta.bairro_cidade} />
          <DataRow label="Modalidade" value={MODALIDADE_LABELS[atleta.modalidade]} />
          <DataRow
            label="Competições"
            value={
              atleta.interesse_competicoes === "sim"
                ? "Tenho interesse e disponibilidade"
                : "No momento não"
            }
          />
          {atleta.observacoes && (
            <DataRow label="Observações" value={atleta.observacoes} />
          )}
        </dl>
      </section>

      <p className="text-xs text-center text-gray-400">
        Trocou de celular? Peça seu link de acesso ao administrador.
      </p>
    </div>
  );
}
