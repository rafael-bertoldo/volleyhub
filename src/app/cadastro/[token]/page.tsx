export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { APP_NAME } from "@/lib/constants";
import { CadastroForm } from "./cadastro-form";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function CadastroPage({ params }: PageProps) {
  const { token } = await params;
  const supabase = createAdminClient();

  const { data: convite } = await supabase
    .from("invite_links")
    .select("*")
    .eq("token", token)
    .single();

  if (!convite) {
    notFound();
  }

  const expirado =
    convite.expires_at && new Date(convite.expires_at) < new Date();

  if (convite.used) {
    return (
      <PageShell>
        <div className="text-center space-y-3">
          <div className="text-4xl">🔗</div>
          <h1 className="text-xl font-bold text-gray-900">Link já utilizado</h1>
          <p className="text-gray-600 text-sm">
            Este link de cadastro já foi used. Se você já se cadastrou, peça seu
            link de acesso ao administrador.
          </p>
        </div>
      </PageShell>
    );
  }

  if (expirado) {
    return (
      <PageShell>
        <div className="text-center space-y-3">
          <div className="text-4xl">⏰</div>
          <h1 className="text-xl font-bold text-gray-900">Link expirado</h1>
          <p className="text-gray-600 text-sm">
            Este link de cadastro não é mais váis_read. Solicite um novo ao administrador.
          </p>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-violet-900">Cadastro</h1>
        <p className="text-gray-600 text-sm mt-1">
          Bem-vindo ao {APP_NAME}! Preencha seus dados abaixo.
        </p>
      </div>
      <CadastroForm conviteToken={token} />
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
