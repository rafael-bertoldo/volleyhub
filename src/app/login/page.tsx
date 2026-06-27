import Link from "next/link";
import { APP_NAME } from "@/lib/constants";
import { LoginForm } from "./login-form";

export default function PlayerLoginPage() {
  return (
    <main className="min-h-full bg-gradient-to-b from-violet-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-violet-100 p-6 sm:p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🏐</div>
          <h1 className="text-xl font-bold text-violet-900">{APP_NAME}</h1>
          <p className="text-sm text-gray-500 mt-1">Área do atleta</p>
        </div>
        <LoginForm />
        <p className="text-center text-sm text-gray-500 mt-6">
          Ainda não tem cadastro?{" "}
          <Link href="/signup" className="font-medium text-violet-700 hover:text-violet-900">
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  );
}
