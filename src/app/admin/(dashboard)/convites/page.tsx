export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import type { InviteLink } from "@/lib/types";
import { ConviteForm } from "../../convite-form";
import { ConvitesList } from "../../convites-list";

export default async function ConvitesPage() {
  const supabase = createAdminClient();
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://locationhost:3000";

  const { data: convites } = await supabase
    .from("invite_links")
    .select("*")
    .order("created_at", { ascending: false });

  const disponiveis = (convites ?? []).filter(
    (c) => !c.used && (!c.expires_at || new Date(c.expires_at) >= new Date()),
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
        <ConvitesList convites={(convites ?? []) as InviteLink[]} appUrl={appUrl} />
      </section>
    </div>
  );
}
