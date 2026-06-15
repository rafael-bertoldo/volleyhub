import { MODALIDADE_LABELS } from "@/lib/constants";
import type { Atleta } from "@/lib/types";

export function StatusCard({ atleta }: { atleta: Atleta }) {
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

export function DataRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-2">
      <dt className="text-gray-500 w-32 shrink-0">{label}</dt>
      <dd className="text-gray-900 font-medium">{value}</dd>
    </div>
  );
}
