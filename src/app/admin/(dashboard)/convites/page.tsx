export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import type { LinkConvite } from "@/lib/types";
import { ConviteForm } from "../../convite-form";
import { ConvitesList } from "../../convites-list";

export default async function ConvitesPage() {
  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const { data: convites } = await supabase
    .from("links_convite")
    .select("*")
    .order("criado_em", { ascending: false });

  const disponiveis = (convites ?? []).filter(
    (c) => !c.usado && (!c.expira_em || new Date(c.expira_em) >= new Date()),
  ).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Convites</h1>
        <p className="text-sm text-gray-500 mt-1">
          {(convites ?? []).length} link(s) gerados
          {disponiveis > 0 && ` · ${disponiveis} disponível(is)`}
        </p>
      </div>

      <section className="card">
        <h2 className="section-title">Novo link de cadastro</h2>
        <ConviteForm appUrl={appUrl} />
      </section>

      <section className="card">
        <h2 className="section-title">Links gerados</h2>
        <ConvitesList convites={(convites ?? []) as LinkConvite[]} appUrl={appUrl} />
      </section>
    </div>
  );
}
