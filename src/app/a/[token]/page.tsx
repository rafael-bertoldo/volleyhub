export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { setAthleteCookie } from "@/lib/auth/athlete-cookie";
import { APP_NAME, MODALIDADE_LABELS } from "@/lib/constants";
import type { Atleta } from "@/lib/types";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function AtletaPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: atleta } = await supabase
    .from("atletas")
    .select("*")
    .eq("access_token", token)
    .eq("ativo", true)
    .single();

  if (!atleta) {
    notFound();
  }

  await setAthleteCookie(token);

  return (
    <main className="min-h-full bg-gray-50">
      <header className="bg-violet-700 text-white px-4 py-5">
        <div className="max-w-2xl mx-auto">
          <p className="text-violet-200 text-sm">{APP_NAME}</p>
          <h1 className="text-xl font-bold mt-0.5">Olá, {atleta.nome.split(" ")[0]}!</h1>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <StatusCard atleta={atleta as Atleta} />

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
            <DataRow
              label="Modalidade"
              value={MODALIDADE_LABELS[atleta.modalidade as keyof typeof MODALIDADE_LABELS]}
            />
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

        <section className="card">
          <h2 className="section-title">Feed</h2>
          <p className="text-sm text-gray-500">
            Anúncios, convocações e avisos aparecerão aqui em breve.
          </p>
        </section>

        <section className="card">
          <h2 className="section-title">Presença nos treinos</h2>
          <p className="text-sm text-gray-500">
            Confirmação de presença e lista de espera serão implementados em breve.
          </p>
        </section>

        <p className="text-xs text-center text-gray-400 pb-6">
          Trocou de celular? Peça seu link de acesso ao administrador.
        </p>
      </div>
    </main>
  );
}

function StatusCard({ atleta }: { atleta: Atleta }) {
  if (atleta.modalidade === "A") {
    return (
      <div className="card border-l-4 border-l-violet-500">
        <p className="text-sm text-gray-700">
          Você está cadastrado como <strong>avulso</strong>. Poderá entrar na lista de
          espera dos treinos quando as vagas estiverem disponíveis.
        </p>
      </div>
    );
  }

  if (atleta.modalidade_status === "pendente") {
    return (
      <div className="card border-l-4 border-l-amber-400 bg-amber-50">
        <p className="text-sm font-medium text-amber-800">Aguardando confirmação</p>
        <p className="text-sm text-amber-700 mt-1">
          Sua solicitação de modalidade{" "}
          <strong>{MODALIDADE_LABELS[atleta.modalidade]}</strong> está pendente. O
          administrador confirmará sua disponibilidade em breve.
        </p>
      </div>
    );
  }

  if (atleta.modalidade_status === "recusado") {
    return (
      <div className="card border-l-4 border-l-red-400 bg-red-50">
        <p className="text-sm font-medium text-red-800">Modalidade não disponível</p>
        <p className="text-sm text-red-700 mt-1">
          No momento não há vaga para sua modalidade solicitada. Entre em contato com o
          administrador.
        </p>
      </div>
    );
  }

  return (
    <div className="card border-l-4 border-l-green-500 bg-green-50">
      <p className="text-sm font-medium text-green-800">Modalidade confirmada</p>
      <p className="text-sm text-green-700 mt-1">
        Você está ativo como <strong>{MODALIDADE_LABELS[atleta.modalidade]}</strong>.
      </p>
    </div>
  );
}

function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-gray-500 w-32 shrink-0">{label}</dt>
      <dd className="text-gray-900 font-medium">{value}</dd>
    </div>
  );
}
