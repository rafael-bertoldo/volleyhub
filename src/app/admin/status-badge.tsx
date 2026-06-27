import type { Player } from "@/lib/types";

export function StatusBadge({ player }: { player: Player }) {
  if (player.membership_type === "A") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-violet-100 text-violet-700">
        Avulso
      </span>
    );
  }

  const map = {
    pending: "bg-amber-100 text-amber-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  const labels = {
    pending: "Pendente",
    approved: "Aprovado",
    rejected: "Recusado",
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[player.membership_status]}`}
    >
      {labels[player.membership_status]}
    </span>
  );
}
