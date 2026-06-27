import Link from "next/link";
import { APP_NAME } from "@/lib/constants";

export default function HomePage() {
  return (
    <main className="min-h-full bg-gradient-to-b from-violet-700 to-violet-900 flex flex-col items-center justify-center p-6 text-white text-center">
      <div className="text-5xl mb-4">🏐</div>
      <h1 className="text-3xl font-bold mb-2">{APP_NAME}</h1>
      <p className="text-violet-200 mb-8 max-w-sm">
        Sistema de gerenciamento do time de vôlei
      </p>
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/login"
          className="rounded-xl bg-white px-5 py-3 text-sm font-semibold text-violet-800 hover:bg-violet-50 transition-colors"
        >
          Entrar como player
        </Link>
        <Link
          href="/signup"
          className="rounded-xl border border-violet-300 px-5 py-3 text-sm font-semibold text-white hover:bg-violet-800 transition-colors"
        >
          Fazer cadastro
        </Link>
      </div>
      <Link
        href="/admin/login"
        className="mt-10 text-xs text-violet-400 hover:text-violet-200 transition-colors"
      >
        Área administrativa
      </Link>
    </main>
  );
}
