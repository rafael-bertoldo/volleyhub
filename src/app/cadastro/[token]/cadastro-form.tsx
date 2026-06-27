"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MEMBERSHIP_TYPES, POSITIONS } from "@/lib/constants";
import type { SignupFormData, MembershipType } from "@/lib/types";

interface CadastroFormProps {
  conviteToken?: string;
}

export function CadastroForm({ conviteToken }: CadastroFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [form, setForm] = useState<SignupFormData>({
    name: "",
    nickname: "",
    birth_date: "",
    address: "",
    city_area: "",
    preferred_position: "",
    membership_type: "" as MembershipType,
    competition_interest: "" as SignupFormData["competition_interest"],
    notes: "",
  });

  function updateField<K extends keyof SignupFormData>(
    field: K,
    value: SignupFormData[K],
  ) {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("As senhas não conferem.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          email,
          password,
          convite_token: conviteToken,
        }),
      });

      const date = await res.json();

      if (!res.ok) {
        setError(date.error ?? "Erro ao cadastrar.");
        return;
      }

      router.push(date.redirect);
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
          Acesso
        </legend>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            E-mail *
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError(null);
            }}
            className="input-field"
            placeholder="seu@email.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            Senha *
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(null);
            }}
            className="input-field"
            placeholder="Mínimo de 6 caracteres"
          />
        </div>

        <div>
          <label
            htmlFor="confirm-password"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirmar senha *
          </label>
          <input
            id="confirm-password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError(null);
            }}
            className="input-field"
            placeholder="Repita sua senha"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-sm font-semibold text-violet-900 uppercase tracking-wide">
          Dados pessoais
        </legend>

        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            Nome *
          </label>
          <input
            id="name"
            type="text"
            required
            value={form.name}
            onChange={(e) => updateField("name", e.target.value)}
            className="input-field"
            placeholder="Seu name completo"
          />
        </div>

        <div>
          <label htmlFor="nickname" className="block text-sm font-medium text-gray-700 mb-1">
            Apelido
          </label>
          <input
            id="nickname"
            type="text"
            value={form.nickname}
            onChange={(e) => updateField("nickname", e.target.value)}
            className="input-field"
            placeholder="Como o time te conhece"
          />
        </div>

        <div>
          <label htmlFor="birth_date" className="block text-sm font-medium text-gray-700 mb-1">
            Nascimento *
          </label>
          <input
            id="birth_date"
            type="date"
            required
            value={form.birth_date}
            onChange={(e) => updateField("birth_date", e.target.value)}
            className="input-field"
          />
        </div>

        <div>
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
            Endereço *
          </label>
          <input
            id="address"
            type="text"
            required
            value={form.address}
            onChange={(e) => updateField("address", e.target.value)}
            className="input-field"
            placeholder="Rua, número"
          />
        </div>

        <div>
          <label htmlFor="city_area" className="block text-sm font-medium text-gray-700 mb-1">
            Bairro / Cidade *
          </label>
          <input
            id="city_area"
            type="text"
            required
            value={form.city_area}
            onChange={(e) => updateField("city_area", e.target.value)}
            className="input-field"
            placeholder="Bairro, cidade"
          />
        </div>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-violet-900 uppercase tracking-wide">
          Posição pretendida *
        </legend>

        {POSITIONS.map((preferred_position) => (
          <label
            key={preferred_position.value}
            className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
              form.preferred_position === preferred_position.value
                ? "border-violet-500 bg-violet-50"
                : "border-gray-200 hover:border-violet-300"
            }`}
          >
            <input
              type="radio"
              name="preferred_position"
              value={preferred_position.value}
              required
              checked={form.preferred_position === preferred_position.value}
              onChange={() => updateField("preferred_position", preferred_position.value)}
              className="accent-violet-600"
            />
            <span className="font-semibold text-gray-900">{preferred_position.label}</span>
          </label>
        ))}
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="text-sm font-semibold text-violet-900 uppercase tracking-wide">
          Modalidade *
        </legend>
        <p className="text-xs text-gray-500">
          Modalidades mensalistas dependem de confirmação de disponibilidade pelo administrador.
        </p>

        {MEMBERSHIP_TYPES.map((mod) => (
          <label
            key={mod.value}
            className={`flex items-start gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
              form.membership_type === mod.value
                ? "border-violet-500 bg-violet-50"
                : "border-gray-200 hover:border-violet-300"
            }`}
          >
            <input
              type="radio"
              name="membership_type"
              value={mod.value}
              required
              checked={form.membership_type === mod.value}
              onChange={() => updateField("membership_type", mod.value)}
              className="mt-1 accent-violet-600"
            />
            <div>
              <span className="font-semibold text-gray-900">{mod.label}</span>
              <p className="text-sm text-gray-600">{mod.description}</p>
              {mod.requiresApproval && (
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
            form.competition_interest === "yes"
              ? "border-violet-500 bg-violet-50"
              : "border-gray-200 hover:border-violet-300"
          }`}
        >
          <input
            type="radio"
            name="competition_interest"
            value="yes"
            required
            checked={form.competition_interest === "yes"}
            onChange={() => updateField("competition_interest", "yes")}
            className="accent-violet-600"
          />
          <span className="text-sm text-gray-800">Tenho interesse e disponibilidade</span>
        </label>

        <label
          className={`flex items-center gap-3 rounded-xl border p-4 cursor-pointer transition-colors ${
            form.competition_interest === "no"
              ? "border-violet-500 bg-violet-50"
              : "border-gray-200 hover:border-violet-300"
          }`}
        >
          <input
            type="radio"
            name="competition_interest"
            value="no"
            required
            checked={form.competition_interest === "no"}
            onChange={() => updateField("competition_interest", "no")}
            className="accent-violet-600"
          />
          <span className="text-sm text-gray-800">No momento não</span>
        </label>
      </fieldset>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
          Observações
        </label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
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
