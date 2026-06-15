import type { Atleta } from "@/lib/types";

export function StatusBadge({ atleta }: { atleta: Atleta }) {
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
