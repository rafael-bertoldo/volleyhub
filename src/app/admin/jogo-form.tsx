"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Event } from "@/lib/types";

interface JogoFormProps {
  event?: Event;
  onDone?: () => void;
  onCancel?: () => void;
}

export function JogoForm({ event, onDone, onCancel }: JogoFormProps = {}) {
  const router = useRouter();
  const [type, setTipo] = useState<"game" | "friendly">(
    event?.type === "friendly" ? "friendly" : "game",
  );
  const [date, setData] = useState(event?.date ?? "");
  const [horaInicio, setHoraInicio] = useState(event?.start_time?.slice(0, 5) ?? "");
  const [horaFim, setHoraFim] = useState(event?.end_time?.slice(0, 5) ?? "");
  const [location, setLocal] = useState(event?.location ?? "");
  const [opponent, setAdversario] = useState(event?.opponent ?? "");
  const [capacity, setCapacidade] = useState(String(event?.capacity ?? 12));
  const [notes, setObservacoes] = useState(event?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(event ? `/api/admin/games/${event.id}` : "/api/admin/games", {
        method: event ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          date,
          start_time: horaInicio,
          end_time: horaFim,
          location,
          opponent,
          capacity: Number(capacity),
          notes,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Erro ao criar.");
        return;
      }

      if (!event) {
        setData("");
        setHoraInicio("");
        setHoraFim("");
        setLocal("");
        setAdversario("");
        setObservacoes("");
      }
      router.refresh();
      onDone?.();
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
          <select
            value={type}
            onChange={(e) => setTipo(e.target.value as "game" | "friendly")}
            className="input-field"
          >
            <option value="game">Competição</option>
            <option value="friendly">Amistoso</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vagas</label>
          <input
            type="number"
            min={1}
            max={99}
            value={capacity}
            onChange={(e) => setCapacidade(e.target.value)}
            className="input-field"
            required
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setData(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
          <input
            type="time"
            value={horaInicio}
            onChange={(e) => setHoraInicio(e.target.value)}
            className="input-field"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Fim</label>
          <input
            type="time"
            value={horaFim}
            onChange={(e) => setHoraFim(e.target.value)}
            className="input-field"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Adversário</label>
        <input
          type="text"
          value={opponent}
          onChange={(e) => setAdversario(e.target.value)}
          placeholder="Nome do time adversário"
          className="input-field"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Local</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocal(e.target.value)}
          placeholder="Ginásio, endereço..."
          className="input-field"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Observações <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <textarea
          value={notes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={2}
          className="input-field resize-none"
          placeholder="Uniforme, horário de concentração..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex flex-wrap gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            Voltar
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
        >
          {loading ? "Salvando..." : event ? "Salvar alterações" : "Criar jogo"}
        </button>
      </div>
    </form>
  );
}
