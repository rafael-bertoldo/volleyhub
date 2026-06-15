export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { AnuncioForm } from "../../anuncio-form";
import { AnunciosList } from "../../anuncios-list";
import type { Anuncio } from "@/lib/types";

export default async function AnunciosPage() {
  const supabase = createAdminClient();
  const { data: anuncios } = await supabase
    .from("anuncios")
    .select("*")
    .order("criado_em", { ascending: false });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Anúncios</h1>
        <p className="text-sm text-gray-500 mt-1">
          Publica no feed dos atletas e copie para o WhatsApp.
        </p>
      </div>

      <section className="card">
        <h2 className="section-title">Novo anúncio</h2>
        <AnuncioForm />
      </section>

      <section className="card">
        <h2 className="section-title">Publicados</h2>
        <AnunciosList anuncios={(anuncios ?? []) as Anuncio[]} />
      </section>
    </div>
  );
}
