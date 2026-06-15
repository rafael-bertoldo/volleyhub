export const dynamic = "force-dynamic";

export default function ConvitesPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Convites</h1>
        <p className="text-sm text-gray-500 mt-1">
          Links de cadastro para novos atletas.
        </p>
      </div>

      <section className="card">
        <h2 className="section-title">Criar link de cadastro</h2>
        <p className="text-sm text-gray-500 mb-3">
          Por enquanto, crie links diretamente no Supabase. Em breve será possível
          gerar pelo painel.
        </p>
        <pre className="text-xs bg-gray-100 rounded-lg p-3 overflow-x-auto text-gray-700">
          {`INSERT INTO links_convite (token) VALUES ('nome-do-link');\n-- URL: ${appUrl}/cadastro/nome-do-link`}
        </pre>
      </section>
    </div>
  );
}
