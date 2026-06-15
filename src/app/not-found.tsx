import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-full flex flex-col items-center justify-center p-6 text-center">
      <div className="text-4xl mb-4">🏐</div>
      <h1 className="text-xl font-bold text-gray-900 mb-2">Página não encontrada</h1>
      <p className="text-gray-500 text-sm mb-6">
        O link pode estar incorreto ou expirado.
      </p>
      <Link
        href="/"
        className="text-sm text-violet-600 hover:text-violet-800 font-medium"
      >
        Voltar ao início
      </Link>
    </main>
  );
}
