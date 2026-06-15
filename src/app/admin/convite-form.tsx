"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { conviteCadastroUrl } from "@/lib/convites";
import type { LinkConvite } from "@/lib/types";

interface ConviteFormProps {
  appUrl: string;
}

export function ConviteForm({ appUrl }: ConviteFormProps) {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [expiraEmDias, setExpiraEmDias] = useState("0");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [criado, setCriado] = useState<LinkConvite | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCriado(null);

    try {
      const res = await fetch("/api/admin/convites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: token.trim() || undefined,
          expira_em_dias: Number(expiraEmDias),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erro ao gerar link.");
        return;
      }

      setCriado(data.convite as LinkConvite);
      setToken("");
      setExpiraEmDias("0");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  async function copyUrl(url: string) {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Identificador <span className="text-gray-400 font-normal">(opcional)</span>
        </label>
        <input
          type="text"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="ex: turma-marco — deixe vazio para gerar automaticamente"
          className="input-field"
          maxLength={40}
        />
        <p className="text-xs text-gray-500 mt-1">
          Letras, números, hífen e underscore. Aparece na URL de cadastro.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Validade
        </label>
        <select
          value={expiraEmDias}
          onChange={(e) => setExpiraEmDias(e.target.value)}
          className="input-field"
        >
          <option value="0">Sem expiração</option>
          <option value="7">7 dias</option>
          <option value="30">30 dias</option>
          <option value="90">90 dias</option>
        </select>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {criado && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-2">
          <p className="text-sm font-medium text-green-800">Link gerado com sucesso!</p>
          <p className="text-xs text-green-700 break-all font-mono">
            {conviteCadastroUrl(criado.token, appUrl)}
          </p>
          <button
            type="button"
            onClick={() => copyUrl(conviteCadastroUrl(criado.token, appUrl))}
            className="text-xs font-medium px-3 py-1.5 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors"
          >
            {copied ? "Copiado!" : "Copiar link"}
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-violet-600 text-white text-sm font-medium hover:bg-violet-700 disabled:opacity-50 transition-colors"
      >
        {loading ? "Gerando..." : "Gerar link de cadastro"}
      </button>
    </form>
  );
}
