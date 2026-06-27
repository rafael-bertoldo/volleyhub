"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { APP_NAME } from "@/lib/constants";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const date = await res.json();

      if (!res.ok) {
        setError(date.error ?? "Erro ao entrar.");
        return;
      }

      router.push("/admin/announcements");
      router.refresh();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          E-mail
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="input-field"
          placeholder="seu@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
          Senha
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input-field"
          placeholder="••••••••"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-violet-600 px-6 py-3 text-white font-semibold hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Entrando..." : "Entrar"}
      </button>
    </form>
  );
}

export function LoginPageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-full bg-gradient-to-b from-violet-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-violet-100 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏐</div>
          <h1 className="text-xl font-bold text-violet-900">{APP_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">Área administrativa</p>
        </div>
        {children}
      </div>
    </main>
  );
}
