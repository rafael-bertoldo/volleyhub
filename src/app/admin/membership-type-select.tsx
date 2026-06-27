"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MEMBERSHIP_TYPES } from "@/lib/constants";
import type { MembershipType } from "@/lib/types";

interface MembershipTypeSelectProps {
  playerId: string;
  currentMembershipType: MembershipType;
}

export function MembershipTypeSelect({
  playerId,
  currentMembershipType,
}: MembershipTypeSelectProps) {
  const router = useRouter();
  const [value, setValue] = useState<MembershipType>(currentMembershipType);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const changed = value !== currentMembershipType;

  async function handleSave() {
    if (!changed) return;

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/membership-type", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          player_id: playerId,
          action: "alterar",
          membership_type: value,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok) {
        setError(data?.error ?? "Erro ao alterar modalidade.");
        return;
      }

      router.refresh();
    } catch {
      setError("Erro de conexão.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5 min-w-[12rem]">
      <div className="flex items-center gap-2">
        <select
          value={value}
          onChange={(event) => setValue(event.target.value as MembershipType)}
          disabled={loading}
          className="rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 disabled:opacity-50"
          aria-label="Alterar modalidade"
        >
          {MEMBERSHIP_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={handleSave}
          disabled={!changed || loading}
          className="rounded-lg bg-violet-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "..." : "Salvar"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
