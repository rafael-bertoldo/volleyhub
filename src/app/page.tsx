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
      <p className="text-sm text-violet-300">
        Acesse pelo link enviado pelo administrador ou após realizar seu cadastro.
      </p>
      <Link
        href="/admin"
        className="mt-10 text-xs text-violet-400 hover:text-violet-200 transition-colors"
      >
        Área administrativa
      </Link>
    </main>
  );
}
