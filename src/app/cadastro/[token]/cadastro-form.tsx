"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MODALIDADES } from "@/lib/constants";
import type { CadastroFormData, Modalidade } from "@/lib/types";

interface CadastroFormProps {
  conviteToken: string;
}

export function CadastroForm({ conviteToken }: CadastroFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CadastroFormData>({
    nome: "",
    nascimento: "",
    endereco: "",
    bairro_cidade: "",
    modalidade: "" as Modalidade,
    interesse_competicoes: "" as CadastroFormData["interesse_competicoes"],
    observacoes: "",
  });

  function updateField<K extends keyof CadastroFormData>(
    field: K,
    value: CadastroFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cadastro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, convite_token: conviteToken }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Erro ao cadastrar.");
        return;
      }

      router.push(data.redirect);
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-violet-900 uppercase tracking-wide">
          Dados pessoais
        </legend>

        <div>
          <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-1">
            Nome *
          </label>
          <input
            id="nome"
            type="text"
            required
            value={form.nome}
            onChange={(e) => updateField("nome", e.target.value)}
            className="input-field"
            placeholder="Seu nome completo"
          />
        </div>

        <div>
          <label htmlFor="nascimento" className="block text-sm font-medium text-gray-700 mb-1">
            Nascimento *
          </label>
          <input
            id="nascimento"
            type="date"
            required
            value={form.nascimento}
            onChange={(e) => updateField("nascimento", e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="endereco" className="block text-sm font-medium text-gray-700 mb-1">
            Endereço *
          </label>
          <input
            id="endereco"
            type="text"
            required
            value={form.endereco}
            onChange={(e) => updateField("endereco", e.target.value)}
            className="input-field"
            placeholder="Rua, número"
          />
        </div>

        <div>
          <label htmlFor="bairro_cidade" className="block text-sm font-medium text-gray-700 mb-1">
            Bairro / Cidade *
          </label>
          <input
            id="bairro_cidade"
            type="text"
            required
            value={form.bairro_cidade}
            onChange={(e) => updateField("bairro_cidade", e.target.value)}
            className="input-field"
            placeholder="Bairro, cidade"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-violet-900 uppercase tracking-wide">
          Modalidade *
        </legend>
        <p className="text-xs text-gray-500">
          Modalidades mensalistas dependem de confirmação de disponibilidade pelo administrador.
        </p>

        {MODALIDADES.map((mod) => (
          <label
            key={mod.value}
            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
              form.modalidade === mod.value
                ? "border-violet-500 bg-violet-50"
                : "border-gray-200 hover:border-violet-300"
            }`}
          >
            <input
              type="radio"
              name="modalidade"
              value={mod.value}
              required
              checked={form.modalidade === mod.value}
              onChange={() => updateField("modalidade", mod.value)}
              className="mt-1 accent-violet-600"
            />
            <div>
              <span className="font-semibold text-gray-900">{mod.label}</span>
              <p className="text-sm text-gray-600">{mod.descricao}</p>
              {mod.requerAprovacao && (
                <p className="text-xs text-amber-600 mt-0.5">Sujeito a confirmação do admin</p>
              )}
            </div>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-violet-900 uppercase tracking-wide">
          Competições e amistosos *
        </legend>

        <label
          className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
            form.interesse_competicoes === "sim"
              ? "border-violet-500 bg-violet-50"
              : "border-gray-200 hover:border-violet-300"
          }`}
        >
          <input
            type="radio"
            name="interesse_competicoes"
            value="sim"
            required
            checked={form.interesse_competicoes === "sim"}
            onChange={() => updateField("interesse_competicoes", "sim")}
            className="accent-violet-600"
          />
          <span className="text-sm text-gray-800">Tenho interesse e disponibilidade</span>
        </label>

        <label
          className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
            form.interesse_competicoes === "nao"
              ? "border-violet-500 bg-violet-50"
              : "border-gray-200 hover:border-violet-300"
          }`}
        >
          <input
            type="radio"
            name="interesse_competicoes"
            value="nao"
            required
            checked={form.interesse_competicoes === "nao"}
            onChange={() => updateField("interesse_competicoes", "nao")}
            className="accent-violet-600"
          />
          <span className="text-sm text-gray-800">No momento não</span>
        </label>
      </fieldset>

      <div>
        <label htmlFor="observacoes" className="block text-sm font-medium text-gray-700 mb-1">
          Observações
        </label>
        <textarea
          id="observacoes"
          rows={3}
          value={form.observacoes}
          onChange={(e) => updateField("observacoes", e.target.value)}
          className="input-field resize-none"
          placeholder="Informações que julgar importantes..."
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-violet-600 px-6 py-3 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Cadastrando..." : "Finalizar cadastro"}
      </button>
    </form>
  );
}
