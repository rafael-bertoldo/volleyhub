export const dynamic = "force-dynamic";

import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAtletaByToken } from "@/lib/atleta-server";
import { getConvocacaoStatusPorEvento } from "@/lib/jogos-server";
import type { FeedItemComConvocacao } from "@/lib/types";
import { FeedList } from "./feed-list";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function FeedPage({ params }: PageProps) {
  const { token } = await params;
  const atleta = await getAtletaByToken(token);

  if (!atleta) {
    notFound();
  }

  const supabase = createAdminClient();

  const [{ data: feedItems }, { data: arquivados }] = await Promise.all([
    supabase
      .from("feed")
      .select("*")
      .or(`and(atleta_id.is.null,tipo.eq.anuncio),atleta_id.eq.${atleta.id}`)
      .order("criado_em", { ascending: false }),
    supabase
      .from("feed_arquivados")
      .select("feed_id")
      .eq("atleta_id", atleta.id),
  ]);

  const arquivadosIds = new Set((arquivados ?? []).map((a) => a.feed_id));
  const allItems = (feedItems ?? []) as FeedItemComConvocacao[];

  const convocacaoEventoIds = allItems
    .filter((i) => i.tipo === "convocacao" && i.evento_id)
    .map((i) => i.evento_id as string);

  const convocacaoStatus = await getConvocacaoStatusPorEvento(
    atleta.id,
    convocacaoEventoIds,
  );

  for (const item of allItems) {
    if (item.tipo === "convocacao" && item.evento_id) {
      item.convocacao_status =
        (convocacaoStatus.get(item.evento_id) as FeedItemComConvocacao["convocacao_status"]) ??
        "pendente";
    }
  }

  const activeItems = allItems.filter((i) => !arquivadosIds.has(i.id));
  const archivedItems = allItems.filter((i) => arquivadosIds.has(i.id));

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold text-gray-900">Feed</h1>
      <FeedList
        activeItems={activeItems}
        archivedItems={archivedItems}
        atletaId={atleta.id}
        accessToken={token}
      />
    </div>
  );
}
