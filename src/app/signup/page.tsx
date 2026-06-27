export const dynamic = "force-dynamic";

import { APP_NAME } from "@/lib/constants";
import { CadastroForm } from "../cadastro/[token]/cadastro-form";

export default function SignupPage() {
  return (
    <PageShell>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-violet-900">Cadastro</h1>
        <p className="text-gray-600 text-sm mt-1">
          Bem-vindo ao {APP_NAME}! Crie seu acesso e preencha seus dados abaixo.
        </p>
      </div>
      <CadastroForm />
    </PageShell>
  );
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-full bg-gradient-to-b from-violet-50 to-white flex items-start justify-center p-4 py-10">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-lg border border-violet-100 p-6 sm:p-8">
        {children}
      </div>
    </main>
  );
}
