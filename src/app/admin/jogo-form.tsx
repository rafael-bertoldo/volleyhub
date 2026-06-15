"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function JogoForm() {
  const router = useRouter();
  const [tipo, setTipo] = useState<"jogo" | "amistoso">("jogo");
  const [data, setData] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [local, setLocal] = useState("");
  const [adversario, setAdversario] = useState("");
  const [capacidade, setCapacidade] = useState("12");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/jogos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo,
          data,
          hora_inicio: horaInicio,
          hora_fim: horaFim,
          local,
          adversario,
          capacidade: Number(capacidade),
          observacoes,
        }),
      });

      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "Erro ao criar.");
        return;
      }

      setData("");
      setHoraInicio("");
      setHoraFim("");
      setLocal("");
      setAdversario("");
      setObservacoes("");
      router.refresh();
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
            value={tipo}
            onChange={(e) => setTipo(e.target.value as "jogo" | "amistoso")}
            className="input-field"
          >
            <option value="jogo">Competição</option>
            <option value="amistoso">Amistoso</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Vagas</label>
          <input
            type="number"
            min={1}
            max={99}
            value={capacidade}
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
            value={data}
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
          value={adversario}
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
          value={local}
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
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={2}
          className="input-field resize-none"
          placeholder="Uniforme, horário de concentração..."
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50"
      >
        {loading ? "Salvando..." : "Criar evento"}
      </button>
    </form>
  );
}
